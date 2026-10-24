import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

/**
 * Tokens Oficiales de Identidad Visual WAPPY (wappy.club)
 */
export const WAPPY_TOKENS = {
  lime: '#c7f303',
  limeDark: '#a8cf00',
  ink: '#0e1300',
  inkSoft: '#2e3428',
  inkMuted: '#5a6252',
  teal: '#0d9488',
  tealBright: '#2dd4bf',
  skyGradient: 'linear-gradient(180deg, #5bb8f5 0%, #86ccf6 34%, #bfe3fa 64%, #eaf6fe 100%)',
  cream: '#f6f5ef',
  paper: '#ffffff',
  fontDisplay: '"Plus Jakarta Sans", "Outfit", "Inter", sans-serif',
  fontSans: '"Inter", system-ui, sans-serif',
  fontMono: '"JetBrains Mono", monospace',
};

/**
 * Micro-animación Lottie-style determinista: Cloud Syncing (inspirado en LottieFiles Cloud Syncing)
 */
export const WappyCloudSyncIcon: React.FC<{ size?: number }> = ({ size = 72 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const rot = (t * 140) % 360;
  const pulse = 1 + 0.06 * Math.sin(t * 5);
  const upY = -3 * Math.sin(t * 4);

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <g transform={`translate(0, ${upY.toFixed(2)})`}>
        <path
          d="M18 46H47C53.075 46 58 41.075 58 35C58 29.36 53.75 24.71 48.27 24.07C46.46 16.03 39.28 10 30.67 10C20.73 10 12.67 18.06 12.67 28C12.67 28.58 12.7 29.15 12.75 29.71C8.84 31.19 6 34.97 6 39.42C6 45.26 10.74 46 18 46Z"
          fill={WAPPY_TOKENS.teal}
          fillOpacity={0.22}
          stroke={WAPPY_TOKENS.teal}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <circle
          cx="32"
          cy="31"
          r="11"
          fill={WAPPY_TOKENS.lime}
          style={{ transform: `scale(${pulse.toFixed(3)})`, transformOrigin: '32px 31px' }}
        />
        <g transform={`rotate(${rot.toFixed(1)} 32 31)`}>
          <path
            d="M27 31A5 5 0 0 1 36 28M37 31A5 5 0 0 1 28 34"
            stroke={WAPPY_TOKENS.ink}
            strokeWidth={2.8}
            strokeLinecap="round"
          />
          <polygon points="36,24 39,29 33,29" fill={WAPPY_TOKENS.ink} />
          <polygon points="28,38 25,33 31,33" fill={WAPPY_TOKENS.ink} />
        </g>
      </g>
    </svg>
  );
};

/**
 * Tarjeta Flotante de Tenshi 3D o Pieza WAPPY para Reels en Remotion
 */
export const WappyReelCard: React.FC<{
  eyebrow?: string;
  titulo: string;
  highlight?: string;
  subtitulo?: string;
  cta?: string;
}> = ({ eyebrow = 'WAPPY IA · SOMOS SST', titulo, highlight, subtitulo, cta = 'wappy.club' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 140 } });
  const hlScale = interpolate(frame, [8, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        transform: `translateY(${(1 - enter) * 40}px) scale(${0.9 + 0.1 * enter})`,
        opacity: enter,
        background: 'rgba(14, 19, 0, 0.94)',
        border: `3px solid ${WAPPY_TOKENS.lime}`,
        borderRadius: 34,
        padding: '28px 32px',
        color: '#ffffff',
        fontFamily: WAPPY_TOKENS.fontDisplay,
        boxShadow: '0 28px 64px rgba(14, 19, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(255,255,255,0.08)',
            color: WAPPY_TOKENS.lime,
            padding: '6px 16px',
            borderRadius: 9999,
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: WAPPY_TOKENS.lime,
              boxShadow: '0 0 0 4px rgba(199, 243, 3, 0.28)',
            }}
          />
          {eyebrow}
        </div>
        <WappyCloudSyncIcon size={54} />
      </div>

      <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
        {titulo}{' '}
        {highlight && (
          <span
            style={{
              display: 'inline-block',
              background: WAPPY_TOKENS.lime,
              color: WAPPY_TOKENS.ink,
              padding: '2px 12px',
              borderRadius: 12,
              transform: `scaleX(${hlScale})`,
              transformOrigin: 'left center',
            }}
          >
            {highlight}
          </span>
        )}
      </div>

      {subtitulo && (
        <div style={{ fontSize: 22, color: '#ecfdf5', lineHeight: 1.4, fontWeight: 500 }}>{subtitulo}</div>
      )}

      <div
        style={{
          marginTop: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(13, 148, 136, 0.26)',
          border: '1.5px solid rgba(45, 212, 191, 0.45)',
          borderRadius: 18,
          padding: '10px 18px',
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 800, color: WAPPY_TOKENS.tealBright }}>{cta}</span>
        <span
          style={{
            background: WAPPY_TOKENS.lime,
            color: WAPPY_TOKENS.ink,
            padding: '6px 16px',
            borderRadius: 9999,
            fontSize: 16,
            fontWeight: 900,
          }}
        >
          Entrar ↗
        </span>
      </div>
    </div>
  );
};

/**
 * Efecto Sable Láser / Rayo de Energía en Manos para Remotion (cuando aparecen manos en vídeo)
 */
export const WappyLightsaberHand: React.FC<{
  x: number;
  y: number;
  angle?: number;
  length?: number;
  color?: string;
  startFrame?: number;
}> = ({ x, y, angle = -35, length = 340, color = WAPPY_TOKENS.lime, startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relFrame = Math.max(0, frame - startFrame);
  const ext = spring({ frame: relFrame, fps, config: { damping: 12, stiffness: 220 } });
  const t = frame / fps;
  const flicker = 0.92 + 0.08 * Math.sin(t * 48);
  const L = length * ext;
  const W = 16 * flicker;

  if (frame < startFrame) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        pointerEvents: 'none',
        zIndex: 40,
      }}
    >
      <svg width={800} height={800} viewBox="0 0 800 800" fill="none" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="wappySaberGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={14 * flicker} result="b1" />
            <feGaussianBlur stdDeviation={28 * flicker} result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#wappySaberGlow)">
          <line x1={400} y1={400} x2={400 + L} y2={400} stroke={color} strokeWidth={W * 2.3} strokeLinecap="round" strokeOpacity={0.45} />
          <line x1={400} y1={400} x2={400 + L} y2={400} stroke={color} strokeWidth={W} strokeLinecap="round" />
          <line x1={400} y1={400} x2={400 + L} y2={400} stroke="#ffffff" strokeWidth={W * 0.48} strokeLinecap="round" />
          <circle cx={400} cy={400} r={18 * ext * flicker} fill="#ffffff" stroke={color} strokeWidth={4} />
        </g>
      </svg>
    </div>
  );
};

