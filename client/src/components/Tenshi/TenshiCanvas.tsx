import React, { useEffect, useRef, useState, useCallback } from 'react';
import { tenshiAudio } from './tenshiAudio';

export type TenshiMood = 'idle' | 'listening' | 'thinking' | 'speaking' | 'success' | 'dizzy' | 'error';

export interface TenshiCanvasProps {
  size?: number;
  mood?: TenshiMood;
  isSpeaking?: boolean;
  outputAmplitude?: number; // 0 to 1
  isListening?: boolean;
  voiceAmplitude?: number;  // 0 to 1
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
  showHalo?: boolean;
  showWings?: boolean;
}

// Constantes anatómicas del motor (adaptadas para Tenshi)
const EYE_SP = 0.36;   // Separación de ojos
const EYE_P = -0.10;    // Inclinación base de mirada
const EYE_W = 0.24;
const EYE_H = 0.28;

type EyeShape = 'pill' | 'happy' | 'wide' | 'thinking' | 'wink' | 'spiral' | 'closed' | 'flat';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  age: number;
  size: number;
  color: string;
}

export const TenshiCanvas: React.FC<TenshiCanvasProps> = ({
  size = 140,
  mood = 'idle',
  isSpeaking = false,
  outputAmplitude = 0,
  isListening = false,
  voiceAmplitude = 0,
  interactive = true,
  className = '',
  onClick,
  showHalo = true,
  showWings = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Estados dinámicos de cinemática
  const stateRef = useRef({
    yaw: 0,
    pitch: 0,
    roll: 0,
    tilt: 0,
    open: 1, // Párpados (0 = cerrado, 1 = abierto)
    sx: 1,   // Squash X
    sy: 1,   // Squash Y
    oy: 0,   // Offset Y (rebote/salto)
    blush: 0.3,
    mouthOpen: 0,
    lookX: 0,
    lookY: 0,
    tgLookX: 0,
    tgLookY: 0,
    lastTime: performance.now(),
    t0: performance.now(),
    nextBlink: performance.now() + 2000,
    pokes: 0,
    lastPokeTime: 0,
    forcedDizzyUntil: 0,
    winkUntil: 0,
    happyUntil: 0,
    particles: [] as Particle[],
  });

  // Reacción sonora y de emoción ante cambios de estado
  const prevMoodRef = useRef<TenshiMood>(mood);
  useEffect(() => {
    if (prevMoodRef.current !== mood) {
      if (mood === 'thinking') {
        tenshiAudio.playThink();
      } else if (mood === 'success') {
        tenshiAudio.playSuccess();
        stateRef.current.happyUntil = performance.now() + 2500;
        // Emitir partículas de alegría
        for (let i = 0; i < 6; i++) {
          stateRef.current.particles.push({
            x: (Math.random() - 0.5) * 40,
            y: (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 50,
            vy: -40 - Math.random() * 50,
            life: 1.0 + Math.random() * 0.5,
            age: 0,
            size: 3 + Math.random() * 3,
            color: Math.random() > 0.5 ? '#34D399' : '#FBBF24',
          });
        }
      }
      prevMoodRef.current = mood;
    }
  }, [mood]);

  // Manejo del seguimiento ocular con el ratón
  useEffect(() => {
    if (!interactive) return;

    let timeoutId: NodeJS.Timeout;
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = (e.clientX - cx) / Math.max(window.innerWidth / 2, 300);
      const dy = (e.clientY - cy) / Math.max(window.innerHeight / 2, 300);

      stateRef.current.tgLookX = Math.max(-1, Math.min(1, dx));
      stateRef.current.tgLookY = Math.max(-1, Math.min(1, dy));

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Vuelve suavemente al centro si el ratón no se mueve
        stateRef.current.tgLookX = 0;
        stateRef.current.tgLookY = 0;
      }, 3500);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, [interactive]);

  // Manejo del clic / poke
  const handleClick = useCallback(() => {
    const s = stateRef.current;
    const now = performance.now();

    // Detección de clics rápidos para mareo (dizzy)
    if (now - s.lastPokeTime < 1400) {
      s.pokes++;
    } else {
      s.pokes = 1;
    }
    s.lastPokeTime = now;

    if (s.pokes >= 4) {
      s.pokes = 0;
      s.forcedDizzyUntil = now + 2400;
      tenshiAudio.playDizzy();
      s.roll = Math.PI * 2;
    } else {
      tenshiAudio.playBlip();
      // Pequeño salto y aplastamiento elástico
      s.sy = 0.85;
      s.sx = 1.15;
      s.oy = -0.15;
      s.winkUntil = now + 800;
    }

    if (onClick) onClick();
  }, [onClick]);

  // Bucle de animación principal a 60 FPS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const now = performance.now();
      const s = stateRef.current;
      const dt = Math.min(0.05, (now - s.lastTime) / 1000);
      s.lastTime = now;
      const t = (now - s.t0) / 1000;

      // Actualizar DPI
      const dpr = window.devicePixelRatio || 1;
      const w = size;
      const h = size;

      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Determinar emoción activa
      let activeMood: TenshiMood = mood;
      if (now < s.forcedDizzyUntil) {
        activeMood = 'dizzy';
      } else if (now < s.happyUntil) {
        activeMood = 'success';
      }

      // Cinemática y cálculo de objetivos
      let targetYaw = s.tgLookX * 0.55;
      let targetPitch = s.tgLookY * 0.45;
      let targetTilt = 0;
      let targetBlush = 0.35;

      if (activeMood === 'thinking') {
        targetYaw = 0.35;
        targetPitch = 0.45; // Mira hacia arriba concentrado
        targetTilt = 0.08;
      } else if (activeMood === 'listening' || isListening) {
        targetPitch = -0.15; // Inclinación atenta hacia el frente
        targetTilt = Math.sin(t * 2) * 0.04;
      } else if (activeMood === 'speaking' || isSpeaking) {
        targetPitch = Math.sin(t * 3.5) * 0.08;
        targetTilt = Math.sin(t * 2.8) * 0.06;
        targetBlush = 0.6;
      } else if (activeMood === 'dizzy') {
        targetYaw = Math.sin(t * 12) * 0.3;
        targetPitch = Math.cos(t * 12) * 0.2;
        targetTilt = Math.sin(t * 8) * 0.25;
      }

      // Suavizado elástico (inercia orgánica)
      const kLook = 1 - Math.pow(0.003, dt);
      const kGen = 1 - Math.pow(0.0008, dt);

      s.yaw += (targetYaw - s.yaw) * kLook;
      s.pitch += (targetPitch - s.pitch) * kLook;
      s.tilt += (targetTilt - s.tilt) * kGen;
      s.blush += (targetBlush - s.blush) * kGen;

      // Respiración senoidal suave
      const breath = Math.sin(t * (isSpeaking ? 3.5 : 2.0));
      const targetSy = 1 + breath * 0.035;
      const targetSx = 1 - breath * 0.02;
      s.sy += (targetSy - s.sy) * kGen;
      s.sx += (targetSx - s.sx) * kGen;
      s.oy += (0 - s.oy) * kGen;

      // Parpadeo natural
      if (now > s.nextBlink) {
        s.open = 0.08;
        setTimeout(() => {
          s.open = 1;
        }, 120);
        s.nextBlink = now + 2400 + Math.random() * 3200;
      } else if (s.open < 0.99) {
        s.open += (1 - s.open) * (1 - Math.pow(0.0001, dt));
      }

      // Modulación de boca según habla / amplitud
      const targetMouth = isSpeaking
        ? Math.max(0.25, Math.min(1.0, outputAmplitude * 3.5))
        : 0;
      s.mouthOpen += (targetMouth - s.mouthOpen) * (1 - Math.pow(0.001, dt));

      // Dimensiones de referencia
      const R = w * 0.32;
      const rx = R * 1.12;
      const ry = R * 0.94;
      const cx = w / 2;
      const cy = h / 2 + s.oy * R + R * 0.05;

      // 1. DIBUJAR ALAS (Detrás del cuerpo)
      if (showWings) {
        const wingFlap = Math.sin(t * (isSpeaking ? 6.5 : 2.5)) * 0.15;
        ctx.save();
        ctx.translate(cx, cy);
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(side * rx * 0.68, ry * 0.05);
          ctx.rotate(side * (0.35 + wingFlap));
          ctx.scale(side, 1);

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(R * 0.7, -R * 0.6, R * 1.0, -R * 0.2, R * 0.85, R * 0.4);
          ctx.bezierCurveTo(R * 0.6, R * 0.35, R * 0.3, R * 0.2, 0, 0);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
          ctx.shadowColor = 'rgba(16, 185, 129, 0.25)';
          ctx.shadowBlur = 8;
          ctx.fill();

          ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // 2. DIBUJAR HALO CELESTIAL (Flotando sobre la cabeza)
      if (showHalo) {
        const haloBob = Math.sin(t * 2.2) * (R * 0.07);
        const haloY = cy - ry * 1.08 + haloBob;

        ctx.save();
        ctx.translate(cx + Math.sin(s.yaw) * (R * 0.3), haloY);
        ctx.rotate(s.tilt * 0.8);
        ctx.scale(1, 0.32); // Perspectiva elíptica del anillo

        // Resplandor del halo
        ctx.shadowColor = isSpeaking ? '#10B981' : '#FBBF24';
        ctx.shadowBlur = 14;

        ctx.beginPath();
        ctx.arc(0, 0, R * 0.58, 0, Math.PI * 2);
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = isSpeaking ? '#34D399' : '#FCD34D';
        ctx.stroke();

        // Núcleo brillante
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.58, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        ctx.restore();
      }

      // 3. DIBUJAR CUERPO (Squircle suave con colores de WAPPY)
      ctx.save();
      ctx.translate(cx, cy);
      if (s.tilt !== 0) ctx.rotate(s.tilt);
      ctx.scale(s.sx, s.sy);

      // Superelipse de 64 vértices
      const bodyPath = new Path2D();
      const n = 64;
      const expN = 2.0 / 2.6;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const px = rx * (ca >= 0 ? Math.pow(ca, expN) : -Math.pow(-ca, expN));
        const py = ry * (sa >= 0 ? Math.pow(sa, expN) : -Math.pow(-sa, expN));
        if (i === 0) bodyPath.moveTo(px, py);
        else bodyPath.lineTo(px, py);
      }
      bodyPath.closePath();

      // Degradado perlado celestial
      const bgGrad = ctx.createLinearGradient(rx * 0.5, -ry * 0.8, -rx * 0.6, ry * 0.8);
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(0.7, '#F0FDF4');
      bgGrad.addColorStop(1, '#D1FAE5');
      ctx.fillStyle = bgGrad;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.22)';
      ctx.shadowBlur = 16;
      ctx.fill(bodyPath);

      // Sombra interior de relieve 3D
      ctx.save();
      ctx.clip(bodyPath);
      const innerShadow = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, R * 1.2);
      innerShadow.addColorStop(0, 'rgba(255,255,255,0)');
      innerShadow.addColorStop(0.75, 'rgba(16,185,129,0.06)');
      innerShadow.addColorStop(1, 'rgba(16,185,129,0.25)');
      ctx.fillStyle = innerShadow;
      ctx.fill(bodyPath);

      // Brillo superior
      const highlight = ctx.createRadialGradient(rx * 0.3, -ry * 0.45, 0, rx * 0.3, -ry * 0.45, R * 0.45);
      highlight.addColorStop(0, 'rgba(255,255,255,0.85)');
      highlight.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = highlight;
      ctx.fill(bodyPath);

      // 4. MEJILLAS SONROJADAS (Blush)
      if (s.blush > 0.05) {
        ctx.fillStyle = `rgba(244, 114, 182, ${0.45 * s.blush})`;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(side * rx * 0.52 + Math.sin(s.yaw) * (rx * 0.2), ry * 0.18, R * 0.16, R * 0.09, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. OJOS EN PROYECCIÓN ESFÉRICA 3D
      let eyeShape: EyeShape = 'pill';
      if (activeMood === 'dizzy') {
        eyeShape = 'spiral';
      } else if (now < s.winkUntil) {
        eyeShape = 'wink';
      } else if (activeMood === 'success' || now < s.happyUntil) {
        eyeShape = 'happy';
      } else if (activeMood === 'thinking') {
        eyeShape = 'thinking';
      } else if (activeMood === 'listening' || isListening) {
        eyeShape = 'wide';
      } else if (activeMood === 'error') {
        eyeShape = 'flat';
      }

      const inkColor = '#064E3B'; // Esmeralda muy oscuro profundo (estilo WAPPY)

      for (const side of [-1, 1]) {
        const eyeYaw = side * EYE_SP + s.yaw;
        let eyePitch = EYE_P + s.pitch + s.roll;
        eyePitch = (((eyePitch + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

        const cp = Math.cos(eyePitch);
        if (Math.cos(eyeYaw) * cp <= 0.04) continue;

        const ex = Math.sin(eyeYaw) * cp * rx;
        const ey = -Math.sin(eyePitch) * ry;

        const ew = R * EYE_W;
        const eh = R * EYE_H;

        ctx.save();
        ctx.translate(ex, ey);

        // Si es wink, un ojo guiña (happy arc) y el otro permanece abierto
        const currentShape = eyeShape === 'wink' ? (side === 1 ? 'happy' : 'pill') : eyeShape;

        ctx.fillStyle = inkColor;
        ctx.strokeStyle = inkColor;

        if (currentShape === 'pill' || currentShape === 'wide') {
          const mult = currentShape === 'wide' ? 1.15 : 1.0;
          const hh = Math.max(eh * mult * s.open, ew * 0.25);
          const ww = ew * mult;
          ctx.beginPath();
          ctx.roundRect(-ww / 2, -hh / 2, ww, hh, [ww / 2]);
          ctx.fill();

          // Brillo en los ojos si están abiertos
          if (s.open > 0.6) {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-ww * 0.18, -hh * 0.18, ww * 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ww * 0.18, hh * 0.15, ww * 0.1, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (currentShape === 'happy') {
          ctx.lineWidth = ew * 0.35;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(0, eh * 0.15, ew * 0.65, Math.PI * 1.15, Math.PI * 1.85);
          ctx.stroke();
        } else if (currentShape === 'thinking') {
          ctx.beginPath();
          ctx.arc(0, 0, ew * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(-ew * 0.12, -ew * 0.12, ew * 0.18, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentShape === 'flat') {
          ctx.beginPath();
          ctx.roundRect(-ew * 0.6, -ew * 0.18, ew * 1.2, ew * 0.36, [ew * 0.18]);
          ctx.fill();
        } else if (currentShape === 'spiral') {
          ctx.lineWidth = ew * 0.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          for (let a = 0; a < 3.8 * Math.PI; a += 0.25) {
            const rad = ew * 0.08 + a * ew * 0.055;
            const aa = a + t * 10 * side;
            const px = Math.cos(aa) * rad;
            const py = Math.sin(aa) * rad;
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }

        ctx.restore();
      }

      // 6. BOCA MODULADA CON LA VOZ
      const mouthX = Math.sin(s.yaw) * (rx * 0.3);
      const mouthY = ry * 0.42;

      ctx.save();
      ctx.translate(mouthX, mouthY);

      if (s.mouthOpen > 0.08) {
        // Boca modulada al hablar
        const mw = R * (0.28 + s.mouthOpen * 0.18);
        const mh = R * s.mouthOpen * 0.38;

        ctx.fillStyle = '#064E3B';
        ctx.beginPath();
        ctx.ellipse(0, 0, mw / 2, mh / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lengüita sonrosada en el fondo de la boca
        ctx.fillStyle = '#FB7185';
        ctx.beginPath();
        ctx.ellipse(0, mh * 0.2, mw * 0.32, mh * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Sonrisa dulce por defecto
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#064E3B';
        ctx.beginPath();
        ctx.arc(0, -R * 0.05, R * 0.16, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
      }

      ctx.restore();

      ctx.restore(); // Restaurar recorte del cuerpo
      ctx.restore(); // Restaurar escala y traslación del cuerpo

      // 7. PARTÍCULAS FLOTANTES (Estrellas / destellos)
      if (s.particles.length > 0) {
        ctx.save();
        ctx.translate(cx, cy);
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.age += dt;
          if (p.age >= p.life) {
            s.particles.splice(i, 1);
            continue;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          const alpha = 1 - p.age / p.life;

          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
    };
  }, [size, mood, isSpeaking, outputAmplitude, isListening, voiceAmplitude, showHalo, showWings]);

  return (
    <div
      onClick={interactive ? handleClick : undefined}
      className={`relative inline-flex items-center justify-center select-none ${
        interactive ? 'cursor-pointer active:scale-95 transition-transform' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      title={interactive ? 'Haz clic en Tenshi para interactuar' : undefined}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="pointer-events-auto"
      />
    </div>
  );
};

export default TenshiCanvas;
