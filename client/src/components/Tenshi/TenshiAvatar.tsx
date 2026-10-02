import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '~/utils';

export interface TenshiAvatarProps {
  size?: number; // en píxeles (ej. 180, 140, 48, 36)
  isSpeaking?: boolean;
  outputAmplitude?: number; // 0..1
  isVoiceActive?: boolean;
  isTyping?: boolean;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
  showHaloEffect?: boolean;
}

export const TenshiAvatar: React.FC<TenshiAvatarProps> = ({
  size = 140,
  isSpeaking = false,
  outputAmplitude = 0,
  isVoiceActive = false,
  isTyping = false,
  interactive = true,
  className = '',
  onClick,
  showHaloEffect = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, rz: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  // Seguimiento suave del ratón (Mirada 3D interactiva inspirada en Coucou)
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

      // Ángulos de rotación 3D para mirar al cursor
      const ry = dx * 16; // Giro lateral (-16° a +16°)
      const rx = -dy * 14; // Inclinación arriba/abajo (-14° a +14°)
      const rz = isTyping ? 3.5 : dx * 2; // Ligera inclinación curiosa al pensar

      // Posición del reflejo de luz (glare) en las gafas y superficie
      const glareX = 50 + dx * 40;
      const glareY = 50 + dy * 40;

      setTilt({ rx, ry, rz, glareX, glareY });

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Vuelve suavemente a reposo
        setTilt({ rx: 0, ry: 0, rz: isTyping ? 3 : 0, glareX: 50, glareY: 50 });
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, [interactive, isTyping]);

  const handleClick = useCallback(() => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 350);
    if (onClick) onClick();
  }, [onClick]);

  // Escala reactiva a la amplitud de voz
  const voiceScale = isSpeaking ? 1 + Math.min(outputAmplitude * 0.28, 0.18) : isHovered ? 1.04 : 1;

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative inline-flex items-center justify-center select-none group',
        interactive && 'cursor-pointer',
        className
      )}
      style={{
        width: size,
        height: size,
        perspective: '800px',
      }}
      title={interactive ? 'Tenshi - Asistente WAPPY' : undefined}
    >
      <style>{`
        @keyframes tenshi-halo-pulse {
          0%, 100% { transform: translateX(-50%) rotateX(68deg) translateY(0) scale(1); opacity: 0.85; }
          50% { transform: translateX(-50%) rotateX(68deg) translateY(-4px) scale(1.08); opacity: 1; }
        }
        @keyframes tenshi-aura-wave {
          0% { transform: scale(0.95); opacity: 0.6; }
          50% { transform: scale(1.12); opacity: 0.15; }
          100% { transform: scale(0.95); opacity: 0.6; }
        }
      `}</style>

      {/* 1. Ondas de Aura Expansiva (Voz o Micrófono Activo) */}
      {(isSpeaking || isVoiceActive) && size >= 60 && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            animation: 'tenshi-aura-wave 2s infinite ease-in-out',
            background: isSpeaking
              ? 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, rgba(16,185,129,0) 70%)'
              : 'radial-gradient(circle, rgba(52,211,153,0.25) 0%, rgba(52,211,153,0) 70%)',
          }}
        />
      )}

      {/* 2. Halo Celestial Dorado Flotante (Efecto Ángel Tenshi) */}
      {showHaloEffect && size >= 50 && (
        <div
          className="absolute -top-3 left-1/2 pointer-events-none transition-transform duration-200 ease-out z-20"
          style={{
            width: size * 0.62,
            height: size * 0.22,
            animation: isSpeaking ? 'tenshi-halo-pulse 1.2s infinite ease-in-out' : 'tenshi-halo-pulse 3.5s infinite ease-in-out',
            transformOrigin: 'center center',
          }}
        >
          <div
            className={cn(
              'h-full w-full rounded-full border-2 transition-all duration-300',
              isSpeaking
                ? 'border-emerald-400 shadow-[0_0_22px_rgba(52,211,153,0.9)] bg-emerald-400/10'
                : isTyping
                ? 'border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.7)] bg-amber-400/10'
                : isVoiceActive
                ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] bg-emerald-400/10'
                : 'border-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.5)] bg-amber-300/10'
            )}
          />
        </div>
      )}

      {/* 3. Contenedor 3D del Avatar con Física de Rebote (Squash & Stretch) */}
      <div
        className={cn(
          'relative h-full w-full rounded-full p-1 border-2 transition-all duration-200 ease-out overflow-hidden shadow-md',
          isSpeaking
            ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]'
            : isTyping
            ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.45)]'
            : isVoiceActive
            ? 'border-emerald-400/80 shadow-[0_0_18px_rgba(52,211,153,0.35)]'
            : 'border-emerald-500/40 hover:border-emerald-500/70',
          !isSpeaking && !isClicked && 'animate-tenshi-float'
        )}
        style={{
          transform: `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) rotateZ(${tilt.rz}deg) scale(${
            isClicked ? 0.9 : voiceScale
          })`,
          transformStyle: 'preserve-3d',
          transition: isClicked
            ? 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Imagen Oficial de Tenshi (El gato con gafas de sol) */}
        <img
          src="/assets/tenshi.png"
          alt="Tenshi"
          className="h-full w-full rounded-full object-cover object-center pointer-events-none transition-transform duration-300 select-none"
          onError={(e) => {
            e.currentTarget.src = '/assets/logo.svg';
          }}
        />

        {/* Reflejo de luz dinámico (Specular Glare en las gafas de sol) */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 60%)`,
            opacity: isHovered || isSpeaking ? 0.95 : 0.4,
          }}
        />

        {/* Indicador brillante inferior cuando habla */}
        {isSpeaking && (
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-2 w-12 rounded-full bg-emerald-400 blur-[2px] animate-pulse pointer-events-none" />
        )}
      </div>
    </div>
  );
};

export default TenshiAvatar;
