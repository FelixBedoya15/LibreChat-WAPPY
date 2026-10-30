import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  Copy,
  Check,
  Radio,
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
  const [vuLeft, setVuLeft] = useState(1);
  const [vuRight, setVuRight] = useState(1);
  const autoPlayTriggeredRef = useRef(false);

  const src = audioUrl || (audioBase64 ? `data:audio/wav;base64,${audioBase64}` : '');

  // Sincronizar duración si cambia desde las props
  useEffect(() => {
    if (durationSeconds && durationSeconds > 0) {
      setDuration(durationSeconds);
    }
  }, [durationSeconds]);

  // Manejo de cambio de audio fuente
  useEffect(() => {
    setCurrentTime(0);
    if (src) {
      if (autoPlayTriggeredRef.current) {
        autoPlayTriggeredRef.current = false;
        // Retardo para que el elemento audio cargue el nuevo buffer
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current
              .play()
              .then(() => setIsPlaying(true))
              .catch((err) => console.log('Autoplay tras síntesis:', err));
          }
        }, 150);
      } else {
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
    }
  }, [src]);

  // Animación del VU-Meter LED estéreo cuando isPlaying
  useEffect(() => {
    if (!isPlaying) {
      setVuLeft(1);
      setVuRight(1);
      return;
    }
    const interval = setInterval(() => {
      // Oscilación reactiva asimétrica de 1 a 10 LEDs
      const baseL = Math.floor(Math.random() * 6) + 4;
      const baseR = Math.floor(Math.random() * 6) + 4;
      setVuLeft(Math.min(10, Math.max(2, baseL + (Math.random() > 0.7 ? 2 : 0))));
      setVuRight(Math.min(10, Math.max(2, baseR + (Math.random() > 0.7 ? 2 : 0))));
    }, 90);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!src) {
      if (onSynthesizeAndPlay) {
        autoPlayTriggeredRef.current = true;
        onSynthesizeAndPlay();
      }
      return;
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error('Error al reproducir audio en Walkman:', e));
    }
  };

  const skipSeconds = (delta: number) => {
    if (!audioRef.current) return;
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

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const total = Math.floor(secs);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

  // Progreso para carretes dinámicos de cinta (0 a 1)
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  // Bobina izquierda: de 38px a 20px (se vacía)
  const leftSpoolRadius = 38 - progressRatio * 18;
  // Bobina derecha: de 20px a 38px (se llena)
  const rightSpoolRadius = 20 + progressRatio * 18;

  // Paletas de color por Cassette Skin
  const skinStyles = {
    lime: {
      cassetteBody: 'from-[#0e1300] via-[#121c08] to-[#0a1506] border-[#C7F303]/40',
      labelBg: 'bg-gradient-to-r from-[#C7F303] via-[#b6e100] to-[#99cc00] text-[#0E1300]',
      accentStripes: 'from-[#0E1300]/25 via-emerald-900/30 to-transparent',
      labelSub: 'text-[#0E1300]/80 font-bold',
      spoolCenter: '#C7F303',
      glow: 'shadow-[#C7F303]/10',
    },
    chrome: {
      cassetteBody: 'from-[#051c19] via-[#082a25] to-[#041614] border-[#0D9488]/50',
      labelBg: 'bg-gradient-to-r from-[#0D9488] via-[#14b8a6] to-[#065f46] text-white',
      accentStripes: 'from-cyan-300/30 via-emerald-400/20 to-transparent',
      labelSub: 'text-emerald-100 font-semibold',
      spoolCenter: '#14b8a6',
      glow: 'shadow-[#0D9488]/15',
    },
    apple: {
      cassetteBody: 'from-[#171320] via-[#1e152d] to-[#110d18] border-fuchsia-500/40',
      labelBg: 'bg-gradient-to-r from-purple-800 via-fuchsia-800 to-indigo-900 text-white',
      accentStripes: 'from-fuchsia-400/25 via-purple-300/20 to-transparent',
      labelSub: 'text-fuchsia-200 font-semibold',
      spoolCenter: '#d946ef',
      glow: 'shadow-fuchsia-500/15',
    },
  }[activeSkin];

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/30 dark:border-[#C7F303]/30 bg-gradient-to-br from-[#0e1300] via-slate-900 to-[#071f1a] p-4 sm:p-6 shadow-2xl text-slate-100">
      {/* Halos Ambientales WAPPY IA */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#C7F303]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#0D9488]/20 blur-3xl" />

      {/* Tornillos Decorativos Metálicos en las 4 esquinas */}
      <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800 border border-slate-500 shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-0.5 bg-slate-300 rotate-45" />
      </div>
      <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800 border border-slate-500 shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-0.5 bg-slate-300 -rotate-45" />
      </div>
      <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800 border border-slate-500 shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-0.5 bg-slate-300 -rotate-45" />
      </div>
      <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800 border border-slate-500 shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-0.5 bg-slate-300 rotate-45" />
      </div>

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

      {/* ==================================================================== */}
      {/* 1. PLACA METÁLICA SUPERIOR & SELECTOR DE SKINS                       */}
      {/* ==================================================================== */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C7F303]/30 via-teal-500/20 to-transparent border border-[#C7F303]/40 flex items-center justify-center shrink-0 shadow-inner">
            <Radio className="w-5 h-5 text-[#C7F303]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-black tracking-widest text-[#C7F303] uppercase">
                WAPPY WALKMAN PRO
              </span>
              <span className="text-[10px] font-mono text-slate-400">·</span>
              <span className="text-[10px] font-bold tracking-wider text-teal-400 uppercase">
                HI-FI 24kHz NEURAL DECK
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight">
              CAPSTAN SERVO MOTOR • GEMINI 3.8 FLASH TTS STEREO MASTER
            </p>
          </div>
        </div>

        {/* Selector de Skins de Cassette */}
        <div className="flex items-center gap-1.5 self-start md:self-auto bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 hidden sm:inline">
            Cassette Skin:
          </span>
          <button
            type="button"
            onClick={() => setActiveSkin('lime')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer',
              activeSkin === 'lime'
                ? 'bg-[#C7F303] text-[#0E1300] shadow-md shadow-[#C7F303]/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5',
            )}
            title="Cassette WAPPY Lime C-60"
          >
            <span>🟢</span>
            <span className="text-[11px]">Lime C-60</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSkin('chrome')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer',
              activeSkin === 'chrome'
                ? 'bg-[#0D9488] text-white shadow-md shadow-[#0D9488]/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5',
            )}
            title="Cassette SST Chrome CrO2"
          >
            <span>🩵</span>
            <span className="text-[11px]">Chrome CrO2</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSkin('apple')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer',
              activeSkin === 'apple'
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5',
            )}
            title="Cassette Apple Podcast Studio"
          >
            <span>🟣</span>
            <span className="text-[11px]">Apple Studio</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. CHASIS CENTRAL DEL CASSETTE CON CARRETES ANIMADOS SVG             */}
      {/* ==================================================================== */}
      <div className="relative mt-4">
        <div
          className={cn(
            'relative rounded-2xl border-2 bg-gradient-to-b p-3.5 sm:p-5 shadow-2xl transition-all duration-300',
            skinStyles.cassetteBody,
            skinStyles.glow,
          )}
        >
          {/* Muescas y Biseles de Cassette en las esquinas superiores */}
          <div className="absolute top-2 left-6 w-8 h-2 rounded-full bg-black/60 border border-white/10" />
          <div className="absolute top-2 right-6 w-8 h-2 rounded-full bg-black/60 border border-white/10" />

          {/* ETIQUETA IMPRESA SUPERIOR DEL CASSETTE */}
          <div
            className={cn(
              'relative rounded-xl p-3 sm:p-4 shadow-md overflow-hidden transition-all duration-300',
              skinStyles.labelBg,
            )}
          >
            {/* Rayas Retro Horizontales de Carreras */}
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-b opacity-25 pointer-events-none',
                skinStyles.accentStripes,
              )}
            />
            <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-current/20 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-black uppercase tracking-wider bg-black/25">
                  SIDE A
                </span>
                <span className="font-mono text-[10px] font-bold tracking-widest uppercase">
                  24kHz PCM STEREO • HIGH OUTPUT
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-black/20">
                  DOLBY B-C NR TYPE IV
                </span>
                <span className="font-mono text-[10px] font-black uppercase">METAL BIAS</span>
              </div>
            </div>

            {/* Título del Episodio */}
            <h2 className="relative text-sm sm:text-base font-black tracking-tight line-clamp-1">
              {title || 'Episodio de Podcast SST'}
            </h2>

            {/* Voces Activas en la Etiqueta */}
            <div className="relative mt-1 flex flex-wrap items-center gap-2 text-xs">
              {multiSpeaker ? (
                <div className="flex items-center gap-2">
                  <span className={cn('text-[11px]', skinStyles.labelSub)}>
                    🎙️ HOST 1: <strong>{speaker1Name}</strong> ({speaker1Voice})
                  </span>
                  <span className="opacity-60">×</span>
                  <span className={cn('text-[11px]', skinStyles.labelSub)}>
                    HOST 2: <strong>{speaker2Name}</strong> ({speaker2Voice})
                  </span>
                </div>
              ) : (
                <span className={cn('text-[11px]', skinStyles.labelSub)}>
                  🎙️ LOCUTOR: <strong>{voiceName || 'Kore'}</strong> (Gemini 3.8 TTS 24kHz)
                </span>
              )}
            </div>
          </div>

          {/* VENTANA CENTRAL TRANSPARENTE DEL CASSETTE CON CARRETES (SPOOLS) */}
          <div className="relative mt-3 rounded-xl bg-black/80 border-2 border-slate-700/80 p-3 sm:p-4 shadow-inner">
            {/* Guías y Marcas de Escala en la Ventana Ahumada */}
            <div className="flex items-center justify-between px-6 text-[9px] font-mono text-slate-500 mb-1">
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>

            <div className="relative flex items-center justify-around py-2">
              {/* CARRETE IZQUIERDO (FEED SPOOL) */}
              <div className="relative flex items-center justify-center">
                {/* Bobina de Cinta Magnética (Radio dinámico: se reduce al avanzar) */}
                <div
                  className="rounded-full bg-gradient-to-br from-stone-900 via-neutral-900 to-black border border-stone-700/60 shadow-lg transition-all duration-300 flex items-center justify-center"
                  style={{
                    width: `${leftSpoolRadius * 2}px`,
                    height: `${leftSpoolRadius * 2}px`,
                  }}
                >
                  {/* Carrete Dentado Central (Gira si isPlaying) */}
                  <div
                    className={cn(
                      'w-14 h-14 rounded-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 border-2 border-slate-400 shadow-md flex items-center justify-center',
                      isPlaying && 'animate-[spin_4s_linear_infinite]',
                    )}
                  >
                    {/* Dientes del Carrete (6 puntas) */}
                    <svg className="w-10 h-10" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="16" fill="#0E1300" />
                      {Array.from({ length: 6 }).map((_, i) => (
                        <rect
                          key={i}
                          x="47"
                          y="18"
                          width="6"
                          height="14"
                          rx="2"
                          fill={skinStyles.spoolCenter}
                          transform={`rotate(${i * 60} 50 50)`}
                        />
                      ))}
                    </svg>
                  </div>
                </div>
                <span className="absolute -bottom-5 text-[9px] font-mono text-slate-400">FEED</span>
              </div>

              {/* PUENTE CENTRAL DE CINTA & CABEZAL MAGNÉTICO (HEAD) */}
              <div className="flex flex-col items-center justify-center px-2">
                <div className="w-16 sm:w-28 h-1 bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 rounded-full shadow-inner mb-2" />
                <div className="relative px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 shadow-md flex items-center gap-1.5">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-300',
                      isPlaying
                        ? 'bg-[#C7F303] shadow-[0_0_8px_#C7F303] animate-pulse'
                        : isSynthesizing
                          ? 'bg-amber-400 animate-ping'
                          : 'bg-slate-600',
                    )}
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-300">
                    {isPlaying ? 'READ HEAD' : isSynthesizing ? 'SYNTH...' : 'HEAD STANDBY'}
                  </span>
                </div>
              </div>

              {/* CARRETE DERECHO (TAKE-UP SPOOL) */}
              <div className="relative flex items-center justify-center">
                {/* Bobina de Cinta Magnética (Radio dinámico: aumenta al avanzar) */}
                <div
                  className="rounded-full bg-gradient-to-br from-stone-900 via-neutral-900 to-black border border-stone-700/60 shadow-lg transition-all duration-300 flex items-center justify-center"
                  style={{
                    width: `${rightSpoolRadius * 2}px`,
                    height: `${rightSpoolRadius * 2}px`,
                  }}
                >
                  {/* Carrete Dentado Central (Gira si isPlaying) */}
                  <div
                    className={cn(
                      'w-14 h-14 rounded-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 border-2 border-slate-400 shadow-md flex items-center justify-center',
                      isPlaying && 'animate-[spin_4s_linear_infinite]',
                    )}
                  >
                    <svg className="w-10 h-10" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="16" fill="#0E1300" />
                      {Array.from({ length: 6 }).map((_, i) => (
                        <rect
                          key={i}
                          x="47"
                          y="18"
                          width="6"
                          height="14"
                          rx="2"
                          fill={skinStyles.spoolCenter}
                          transform={`rotate(${i * 60} 50 50)`}
                        />
                      ))}
                    </svg>
                  </div>
                </div>
                <span className="absolute -bottom-5 text-[9px] font-mono text-slate-400">TAKE-UP</span>
              </div>
            </div>

            {/* Base Inferior del Cassette (Rodillos guía de latón) */}
            <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-between px-6">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border border-amber-300 shadow-inner" />
              <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">
                DUAL CAPSTAN • WAPPY PRECISION MECHANISM
              </span>
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border border-amber-300 shadow-inner" />
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. VU-METER ESTÉREO LED & PANTALLA DIGITAL LCD                       */}
      {/* ==================================================================== */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-black/50 p-3 rounded-2xl border border-white/10">
        {/* VU-Meter LED Estéreo (Canales L & R) */}
        <div className="md:col-span-7 space-y-1.5">
          {/* Canal L */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-extrabold text-teal-400 w-4">L</span>
            <div className="flex-1 grid grid-cols-10 gap-1 bg-slate-950 p-1 rounded-md border border-slate-800">
              {Array.from({ length: 10 }).map((_, idx) => {
                const active = idx < vuLeft;
                const isGreen = idx < 5;
                const isYellow = idx >= 5 && idx < 8;
                return (
                  <div
                    key={idx}
                    className={cn(
                      'h-2.5 rounded-xs transition-all duration-75',
                      active
                        ? isGreen
                          ? 'bg-emerald-400 shadow-[0_0_6px_#10B981]'
                          : isYellow
                            ? 'bg-amber-400 shadow-[0_0_6px_#F59E0B]'
                            : 'bg-rose-500 shadow-[0_0_6px_#EF4444]'
                        : 'bg-slate-900 border border-slate-800/60',
                    )}
                  />
                );
              })}
            </div>
            <span className="font-mono text-[9px] text-slate-400 w-7 text-right">
              {isPlaying ? `${(vuLeft * 3 - 30).toFixed(0)}dB` : '-30dB'}
            </span>
          </div>

          {/* Canal R */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-extrabold text-teal-400 w-4">R</span>
            <div className="flex-1 grid grid-cols-10 gap-1 bg-slate-950 p-1 rounded-md border border-slate-800">
              {Array.from({ length: 10 }).map((_, idx) => {
                const active = idx < vuRight;
                const isGreen = idx < 5;
                const isYellow = idx >= 5 && idx < 8;
                return (
                  <div
                    key={idx}
                    className={cn(
                      'h-2.5 rounded-xs transition-all duration-75',
                      active
                        ? isGreen
                          ? 'bg-emerald-400 shadow-[0_0_6px_#10B981]'
                          : isYellow
                            ? 'bg-amber-400 shadow-[0_0_6px_#F59E0B]'
                            : 'bg-rose-500 shadow-[0_0_6px_#EF4444]'
                        : 'bg-slate-900 border border-slate-800/60',
                    )}
                  />
                );
              })}
            </div>
            <span className="font-mono text-[9px] text-slate-400 w-7 text-right">
              {isPlaying ? `${(vuRight * 3 - 30).toFixed(0)}dB` : '-30dB'}
            </span>
          </div>
        </div>

        {/* Display LCD Digital Verde Lima */}
        <div className="md:col-span-5 flex items-center justify-between bg-[#0E1300] px-3.5 py-2 rounded-xl border border-[#C7F303]/40 shadow-inner">
          <div className="min-w-0">
            <div className="text-[9px] font-mono font-bold tracking-widest text-[#C7F303]/70 uppercase">
              TAPE COUNTER • 24.0 kHz
            </div>
            <div className="font-mono text-base font-black text-[#C7F303] tracking-wider">
              {isSynthesizing ? (
                <span className="flex items-center gap-1.5 animate-pulse text-amber-400 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  SINTETIZANDO 24kHz...
                </span>
              ) : (
                `${formatTime(currentTime)} / ${formatTime(duration)}`
              )}
            </div>
          </div>
          <div className="text-right">
            <span
              className={cn(
                'inline-block px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase border',
                isPlaying
                  ? 'bg-[#C7F303]/20 border-[#C7F303] text-[#C7F303] animate-pulse'
                  : src
                    ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400',
              )}
            >
              {isPlaying ? 'PLAY' : src ? 'READY' : 'STANDBY'}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. SLIDER INTERACTIVO DE CINTA MAGNÉTICA                             */}
      {/* ==================================================================== */}
      <div className="mt-3 space-y-1">
        <input
          type="range"
          min={0}
          max={Math.max(1, duration)}
          step={0.1}
          disabled={!src}
          value={Math.min(currentTime, Math.max(1, duration))}
          onChange={(e) => {
            const target = parseFloat(e.target.value);
            if (audioRef.current) {
              audioRef.current.currentTime = target;
            }
            setCurrentTime(target);
          }}
          className={cn(
            'w-full h-2 rounded-lg appearance-none cursor-pointer transition-all',
            src
              ? 'bg-slate-800 accent-[#C7F303] hover:accent-emerald-400'
              : 'bg-slate-900 opacity-40 cursor-not-allowed',
          )}
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-400 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span className="text-slate-500">
            {duration > 0 ? `Total: ${formatTime(duration)}` : 'Cinta lista para reproducir'}
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. BOTONERA MECÁNICA TÁCTIL DE WALKMAN + ACCIONES EXPORTAR/COPIAR    */}
      {/* ==================================================================== */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-700/60">
        {/* Controles de Transporte Táctil */}
        <div className="flex items-center gap-2">
          {/* Si NO hay audio sintetizado, botón grande para sintetizar y hacer play */}
          {!src ? (
            <button
              type="button"
              disabled={isSynthesizing}
              onClick={togglePlay}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C7F303] via-emerald-400 to-[#0D9488] hover:from-[#d6ff17] hover:to-teal-400 text-[#0E1300] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#C7F303]/25 transition transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0E1300]" />
                  <span>Sintetizando 24kHz...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>▶ Sintetizar y Reproducir en Walkman</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={togglePlay}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C7F303] via-emerald-400 to-[#0D9488] hover:scale-105 active:scale-95 text-[#0E1300] flex items-center justify-center shadow-lg shadow-[#C7F303]/30 transition shrink-0 cursor-pointer border border-[#C7F303]/60"
              title={isPlaying ? 'Pausar Walkman' : 'Reproducir Walkman'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
          )}

          {/* Retroceder 10s */}
          <button
            type="button"
            disabled={!src}
            onClick={() => skipSeconds(-10)}
            title="Retroceder 10 segundos"
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Adelantar 10s */}
          <button
            type="button"
            disabled={!src}
            onClick={() => skipSeconds(10)}
            title="Adelantar 10 segundos"
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer disabled:opacity-40"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Selector de Velocidad */}
          <button
            type="button"
            onClick={cyclePlaybackRate}
            title="Cambiar velocidad de reproducción"
            className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-[11px] font-mono font-bold text-teal-300 transition active:scale-95 cursor-pointer"
          >
            {playbackRate}x
          </button>

          {/* Botón Mute */}
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Activar audio' : 'Silenciar'}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Acciones de Exportar y Copiar (ExpandableButton WAPPY 14-Group) */}
        <div className="flex items-center gap-2">
          {audioBase64 && (
            <ExpandableButton
              size="sm"
              icon={copied ? <Check /> : <Copy />}
              label={copied ? 'Copiado' : 'Copiar Base64'}
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
