import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Download,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import ExpandableButton from '~/components/Common/ExpandableButton';
import { cn } from '~/utils';

export type CassetteSkin = 'lime' | 'chrome' | 'apple';

export interface WappyCassetteWalkmanPlayerProps {
  audioBase64?: string;
  audioUrl?: string;
  title: string;
  durationSeconds?: number;
  voiceName?: string;
  speaker1Name?: string;
  speaker1Voice?: string;
  speaker2Name?: string;
  speaker2Voice?: string;
  multiSpeaker?: boolean;
  isSynthesizing?: boolean;
  onSynthesizeAndPlay?: () => void;
  token?: string;
}

export default function WappyCassetteWalkmanPlayer({
  audioBase64,
  audioUrl,
  title,
  durationSeconds,
  voiceName,
  speaker1Name = 'Alex',
  speaker1Voice = 'Puck',
  speaker2Name = 'Sam',
  speaker2Voice = 'Kore',
  multiSpeaker = true,
  isSynthesizing = false,
  onSynthesizeAndPlay,
  token,
}: WappyCassetteWalkmanPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSkin, setActiveSkin] = useState<CassetteSkin>('lime');
  const [vuBarsL, setVuBarsL] = useState<number[]>([35, 55, 75, 45, 25]);
  const [vuBarsR, setVuBarsR] = useState<number[]>([40, 65, 50, 70, 30]);
  const autoPlayTriggeredRef = useRef(false);

  const src = audioUrl || (audioBase64 ? `data:audio/wav;base64,${audioBase64}` : '');

  useEffect(() => {
    if (durationSeconds && durationSeconds > 0) {
      setDuration(durationSeconds);
    }
  }, [durationSeconds]);

  useEffect(() => {
    setCurrentTime(0);
    if (src) {
      if (autoPlayTriggeredRef.current) {
        autoPlayTriggeredRef.current = false;
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => {});
          }
        }, 150);
      } else {
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
    }
  }, [src]);

  useEffect(() => {
    if (!isPlaying) {
      setVuBarsL([25, 35, 30, 20, 15]);
      setVuBarsR([25, 30, 35, 20, 15]);
      return;
    }
    const interval = setInterval(() => {
      setVuBarsL([
        Math.floor(40 + Math.random() * 60),
        Math.floor(45 + Math.random() * 55),
        Math.floor(50 + Math.random() * 50),
        Math.floor(35 + Math.random() * 65),
        Math.floor(25 + Math.random() * 70),
      ]);
      setVuBarsR([
        Math.floor(40 + Math.random() * 60),
        Math.floor(50 + Math.random() * 50),
        Math.floor(45 + Math.random() * 55),
        Math.floor(35 + Math.random() * 65),
        Math.floor(30 + Math.random() * 65),
      ]);
    }, 110);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlay = () => {
    if (!src) {
      if (onSynthesizeAndPlay) {
        autoPlayTriggeredRef.current = true;
        onSynthesizeAndPlay();
      }
      return;
    }
    if (!audioRef.current) return;
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((e) => console.error('Error al reproducir audio en Walkman:', e));
  };

  const handlePause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const handleRecordSynthesize = () => {
    if (onSynthesizeAndPlay) {
      autoPlayTriggeredRef.current = true;
      onSynthesizeAndPlay();
    }
  };

  const skipSeconds = (delta: number) => {
    if (!audioRef.current || !src) return;
    const maxDur = Math.max(1, duration || audioRef.current.duration || 0);
    const next = Math.max(0, Math.min(maxDur, audioRef.current.currentTime + delta));
    audioRef.current.currentTime = next;
    setCurrentTime(next);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !isMuted;
    audioRef.current.muted = next;
    setIsMuted(next);
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const formatCounter = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '0 0 : 0 0';
    const total = Math.floor(secs);
    const m = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m[0]} ${m[1]} : ${s[0]} ${s[1]}`;
  };

  const formatTimeShort = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const total = Math.floor(secs);
    const m = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleDownload = async () => {
    if (!src) return;
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'wappy-podcast'}.wav`;
    try {
      if (src.startsWith('data:') || src.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = src;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const r = await fetch(src, { headers });
      if (r.ok) {
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        return;
      }
    } catch {
      /* fallback below */
    }
    const a = document.createElement('a');
    a.href = src;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const leftTapeRadius = Math.round(44 - progressRatio * 14);
  const rightTapeRadius = Math.round(30 + progressRatio * 14);

  const skinStyles = {
    lime: {
      chassis: 'from-[#18240f] via-[#0e1300] to-[#070b03] border-[#c7f303]/40',
      labelBg: 'from-[#c7f303] via-[#b2dc02] to-[#c7f303] text-[#0e1300]',
      badgeBg: 'bg-[#0e1300] text-[#c7f303]',
      toothColor: '#c7f303',
    },
    chrome: {
      chassis: 'from-[#062c28] via-[#041d1b] to-[#02100f] border-[#0d9488]/50',
      labelBg: 'from-[#14b8a6] via-[#0d9488] to-[#0f766e] text-white',
      badgeBg: 'bg-[#042f2e] text-[#5eead4]',
      toothColor: '#14b8a6',
    },
    apple: {
      chassis: 'from-[#24123a] via-[#130921] to-[#090411] border-purple-400/45',
      labelBg: 'from-fuchsia-500 via-purple-600 to-indigo-600 text-white',
      badgeBg: 'bg-black/70 text-fuchsia-200',
      toothColor: '#e879f9',
    },
  }[activeSkin];

  return (
    <div
      className={cn(
        'h-full flex flex-col justify-between rounded-2xl bg-gradient-to-b border-2 p-4 sm:p-5 shadow-2xl relative overflow-hidden transition-all duration-300',
        skinStyles.chassis,
      )}
    >
      {/* Tornillos mecánicos metálicos en las 4 esquinas */}
      <span className="absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-slate-400/50 border border-slate-600 shadow-inner" />
      <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-slate-400/50 border border-slate-600 shadow-inner" />
      <span className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-slate-400/50 border border-slate-600 shadow-inner" />
      <span className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-slate-400/50 border border-slate-600 shadow-inner" />

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current?.duration && !isNaN(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
      />

      {/* 1. Header Walkman + Selector de Cassette Skin */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10 mb-3">
        <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-[#c7f303]">
          <span
            className={cn(
              'w-2.5 h-2.5 rounded-full',
              isPlaying
                ? 'bg-[#c7f303] animate-ping'
                : isSynthesizing
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-red-500 animate-pulse',
            )}
          />
          <span>WAPPY WALKMAN PROFESSIONAL</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveSkin('lime')}
            className={cn(
              'px-2 py-0.5 rounded text-[9px] font-black uppercase transition cursor-pointer',
              activeSkin === 'lime'
                ? 'bg-[#c7f303] text-[#0e1300]'
                : 'bg-white/10 text-slate-300 hover:bg-white/20',
            )}
            title="Skin WAPPY Lime C-60"
          >
            C-60 Lime
          </button>
          <button
            type="button"
            onClick={() => setActiveSkin('chrome')}
            className={cn(
              'px-2 py-0.5 rounded text-[9px] font-black uppercase transition cursor-pointer',
              activeSkin === 'chrome'
                ? 'bg-[#14b8a6] text-[#042f2e]'
                : 'bg-white/10 text-slate-300 hover:bg-white/20',
            )}
            title="Skin Turquesa SST CrO2"
          >
            CrO2 SST
          </button>
          <button
            type="button"
            onClick={() => setActiveSkin('apple')}
            className={cn(
              'px-2 py-0.5 rounded text-[9px] font-black uppercase transition cursor-pointer',
              activeSkin === 'apple'
                ? 'bg-fuchsia-500 text-white'
                : 'bg-white/10 text-slate-300 hover:bg-white/20',
            )}
            title="Skin Apple Podcasts Studio"
          >
            Studio
          </button>
        </div>
      </div>

      {/* 2. Ventana Central Ahumada del Cassette Deck */}
      <div className="rounded-xl bg-black/80 border border-white/15 p-3 sm:p-3.5 relative overflow-hidden shadow-inner mb-3">
        {/* Etiqueta Vintage C-60 WAPPY */}
        <div
          className={cn(
            'rounded-lg bg-gradient-to-r p-2.5 mb-2.5 shadow-sm transition-all duration-300',
            skinStyles.labelBg,
          )}
        >
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider">
            <span>WAPPY CASSETTE C-60 · 24kHz WAV</span>
            <span className={cn('px-1.5 py-0.5 rounded font-mono text-[8px]', skinStyles.badgeBg)}>
              TYPE II · HIGH BIAS
            </span>
          </div>
          <div className="text-xs font-black tracking-tight leading-tight mt-1 truncate">
            {title || '24kHz NEURAL STEREO • GEMINI 3.8 FLASH TTS'}
          </div>
          <div className="flex items-center justify-between text-[9px] font-bold opacity-85 mt-1">
            <span className="truncate">
              {multiSpeaker
                ? `SIDE A · ${speaker1Name} (${speaker1Voice}) × ${speaker2Name} (${speaker2Voice})`
                : `SIDE A · Voz: ${voiceName || 'Kore'}`}
            </span>
            <span className="shrink-0 ml-2">
              {src ? `READY · ${formatTimeShort(duration)}` : 'STANDBY · 24kHz'}
            </span>
          </div>
        </div>

        {/* Ventanilla transparente con carretes SVG giratorios y cinta magnética */}
        <div className="relative h-24 rounded-lg bg-[#141b12] border border-white/10 flex items-center justify-between px-4 sm:px-5 overflow-hidden">
          {/* Cinta magnética de fondo conectando los dos carretes */}
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-4 bg-[#2b1e11] border-y border-[#3d2a17]" />

          {/* Carrete Izquierdo Spool SVG Giratorio */}
          <div className="relative z-10 w-16 h-16 flex items-center justify-center shrink-0">
            <svg
              className={cn(
                'w-16 h-16 transition-transform',
                isPlaying && 'animate-[spin_3s_linear_infinite]',
              )}
              viewBox="0 0 100 100"
              fill="none"
            >
              <circle
                cx="50"
                cy="50"
                r={leftTapeRadius}
                fill="#1f1610"
                stroke="#4b3621"
                strokeWidth="2"
              />
              <circle cx="50" cy="50" r="28" fill="#111827" stroke="#6b7280" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="15" fill="#ffffff" stroke="#111827" strokeWidth="3" />
              <rect x="47" y="24" width="6" height="8" rx="2" fill={skinStyles.toothColor} />
              <rect x="47" y="68" width="6" height="8" rx="2" fill={skinStyles.toothColor} />
              <rect x="24" y="47" width="8" height="6" rx="2" fill={skinStyles.toothColor} />
              <rect x="68" y="47" width="8" height="6" rx="2" fill={skinStyles.toothColor} />
              <circle cx="50" cy="31" r="3.5" fill="#374151" />
              <circle cx="66" cy="40" r="3.5" fill="#374151" />
              <circle cx="66" cy="60" r="3.5" fill="#374151" />
              <circle cx="50" cy="69" r="3.5" fill="#374151" />
              <circle cx="34" cy="60" r="3.5" fill="#374151" />
              <circle cx="34" cy="40" r="3.5" fill="#374151" />
            </svg>
          </div>

          {/* Visor Central de Minutos y VU Meter */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-1.5">
            <span className="text-[8.5px] font-mono font-bold text-slate-400 uppercase">
              {isSynthesizing ? 'SINTETIZANDO IA...' : 'TAPE COUNTER'}
            </span>
            <span className="text-xs font-mono font-black text-[#c7f303] bg-black/90 px-2.5 py-0.5 rounded border border-[#c7f303]/40 tracking-widest my-0.5 shadow-inner">
              {isSynthesizing ? '•• : ••' : formatCounter(currentTime || duration)}
            </span>

            {/* Medidor VU Estéreo L / R */}
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-end gap-0.5 h-3.5">
                {vuBarsL.map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className={cn(
                      'w-1 rounded-xs transition-all duration-100',
                      i < 2
                        ? 'bg-emerald-400'
                        : i === 2
                          ? 'bg-[#c7f303]'
                          : i === 3
                            ? 'bg-amber-400'
                            : 'bg-red-500',
                    )}
                  />
                ))}
              </div>
              <span className="text-[7.5px] font-mono text-slate-300 font-bold">24kHz</span>
              <div className="flex items-end gap-0.5 h-3.5">
                {vuBarsR.map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className={cn(
                      'w-1 rounded-xs transition-all duration-100',
                      i < 2
                        ? 'bg-emerald-400'
                        : i === 2
                          ? 'bg-[#c7f303]'
                          : i === 3
                            ? 'bg-amber-400'
                            : 'bg-red-500',
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Carrete Derecho Spool SVG Giratorio */}
          <div className="relative z-10 w-16 h-16 flex items-center justify-center shrink-0">
            <svg
              className={cn(
                'w-16 h-16 transition-transform',
                isPlaying && 'animate-[spin_3s_linear_infinite]',
              )}
              viewBox="0 0 100 100"
              fill="none"
            >
              <circle
                cx="50"
                cy="50"
                r={rightTapeRadius}
                fill="#1f1610"
                stroke="#4b3621"
                strokeWidth="2"
              />
              <circle cx="50" cy="50" r="28" fill="#111827" stroke="#6b7280" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="15" fill="#ffffff" stroke="#111827" strokeWidth="3" />
              <rect x="47" y="24" width="6" height="8" rx="2" fill={skinStyles.toothColor} />
              <rect x="47" y="68" width="6" height="8" rx="2" fill={skinStyles.toothColor} />
              <rect x="24" y="47" width="8" height="6" rx="2" fill={skinStyles.toothColor} />
              <rect x="68" y="47" width="8" height="6" rx="2" fill={skinStyles.toothColor} />
              <circle cx="50" cy="31" r="3.5" fill="#374151" />
              <circle cx="66" cy="40" r="3.5" fill="#374151" />
              <circle cx="66" cy="60" r="3.5" fill="#374151" />
              <circle cx="50" cy="69" r="3.5" fill="#374151" />
              <circle cx="34" cy="60" r="3.5" fill="#374151" />
              <circle cx="34" cy="40" r="3.5" fill="#374151" />
            </svg>
          </div>
        </div>

        {/* Barra de progreso de cinta interactiva */}
        <div className="mt-2.5 flex items-center gap-2">
          <span className="text-[9px] font-mono text-slate-400 w-8">
            {formatTimeShort(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(1, duration)}
            step={0.1}
            disabled={!src}
            value={Math.min(currentTime, Math.max(1, duration))}
            onChange={(e) => {
              const target = parseFloat(e.target.value);
              if (audioRef.current) audioRef.current.currentTime = target;
              setCurrentTime(target);
            }}
            className={cn(
              'flex-1 h-1.5 rounded-lg appearance-none cursor-pointer',
              src ? 'bg-slate-800 accent-[#c7f303]' : 'bg-slate-900 opacity-50 cursor-not-allowed',
            )}
          />
          <span className="text-[9px] font-mono text-slate-400 w-8 text-right">
            {formatTimeShort(duration)}
          </span>
        </div>
      </div>

      {/* 3. Botonera Mecánica Táctil Walkman Deck (6 Botones Físicos) */}
      <div className="grid grid-cols-6 gap-1 sm:gap-1.5 mb-2.5">
        <button
          type="button"
          onClick={() => {
            document
              .getElementById('podcast-script-editor-anchor')
              ?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[9px] font-bold cursor-pointer active:scale-95 transition-all"
          title="Ir al Editor de Guion"
        >
          <span>⏏</span>
          <span className="text-[7.5px] mt-0.5">GUIÓN</span>
        </button>

        <button
          type="button"
          disabled={!src}
          onClick={() => skipSeconds(-10)}
          className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[9px] font-bold cursor-pointer active:scale-95 transition-all disabled:opacity-40"
          title="Rebobinar 10 segundos"
        >
          <span>⏪</span>
          <span className="text-[7.5px] mt-0.5">REW</span>
        </button>

        <button
          type="button"
          disabled={isSynthesizing}
          onClick={isPlaying ? handlePause : handlePlay}
          className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-[#c7f303] hover:bg-[#b2dc02] text-[#0e1300] font-black text-[9px] cursor-pointer shadow-md shadow-[#c7f303]/30 active:scale-95 transition-all disabled:opacity-50"
          title={
            !src
              ? 'Sintetizar con IA y Reproducir en Walkman'
              : isPlaying
                ? 'Pausar Walkman'
                : 'Reproducir Walkman'
          }
        >
          {isSynthesizing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0e1300]" />
          ) : (
            <span>{isPlaying ? '⏸' : '▶'}</span>
          )}
          <span className="text-[7.5px] mt-0.5 font-black">
            {isSynthesizing ? 'SYNTH' : isPlaying ? 'PLAYING' : 'PLAY'}
          </span>
        </button>

        <button
          type="button"
          disabled={!src}
          onClick={() => skipSeconds(10)}
          className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[9px] font-bold cursor-pointer active:scale-95 transition-all disabled:opacity-40"
          title="Adelantar 10 segundos"
        >
          <span>⏩</span>
          <span className="text-[7.5px] mt-0.5">FF</span>
        </button>

        <button
          type="button"
          disabled={isSynthesizing}
          onClick={handleRecordSynthesize}
          className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-[9px] cursor-pointer active:scale-95 transition-all disabled:opacity-50"
          title="Grabar / Sintetizar Guion Actual en el Walkman (24kHz WAV)"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping my-0.5" />
          <span className="text-[7.5px] mt-0.5">REC IA</span>
        </button>

        <button
          type="button"
          onClick={handlePause}
          className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[9px] font-bold cursor-pointer active:scale-95 transition-all"
          title="Pausar Walkman"
        >
          <span>⏸</span>
          <span className="text-[7.5px] mt-0.5">PAUSE</span>
        </button>
      </div>

      {/* 4. Barra Inferior de Exportación WAV 24kHz + Velocidad + Mute */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={cyclePlaybackRate}
            className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono font-bold text-[#c7f303] cursor-pointer"
            title="Velocidad de reproducción"
          >
            {playbackRate}x
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 cursor-pointer"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <span className="text-[8.5px] font-mono text-[#c7f303]/80 hidden sm:inline">
            ● 24,000 Hz MASTER
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {audioBase64 && (
            <ExpandableButton
              size="sm"
              icon={copied ? <Check /> : <Copy />}
              label={copied ? 'Copiado' : 'Base64'}
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
            alwaysExpanded
            disabled={!src}
            onClick={handleDownload}
          />
        </div>
      </div>
    </div>
  );
}
