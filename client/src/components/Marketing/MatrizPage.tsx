import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Pause, ShieldAlert, Check, Lock, ShieldCheck, ArrowRight, Settings, Save, 
  Sparkles, Maximize, Minimize, Loader2, X, ExternalLink, Calendar, Clock
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { ThemeSelector } from '@librechat/client';
import axios from 'axios';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function MatrizPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'ADMIN';

  // State variables
  const [videoUrl, setVideoUrl] = useState('https://www.w3schools.com/html/mov_bbb.mp4');
  const [matrizDate1, setMatrizDate1] = useState('Martes 7:00 PM');
  const [matrizWhatsappUrl1, setMatrizWhatsappUrl1] = useState('');
  const [matrizDate2, setMatrizDate2] = useState('Jueves 7:00 PM');
  const [matrizWhatsappUrl2, setMatrizWhatsappUrl2] = useState('');
  const [matrizDate3, setMatrizDate3] = useState('Sábado 4:00 PM');
  const [matrizWhatsappUrl3, setMatrizWhatsappUrl3] = useState('');

  // Video State
  const [isVideoFinished, setIsVideoFinished] = useState(() => {
    return localStorage.getItem('wappy_matriz_video_finished') === 'true';
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Admin and UI State
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Temporary admin inputs
  const [tempVideoUrl, setTempVideoUrl] = useState('');
  const [tempDate1, setTempDate1] = useState('');
  const [tempWhatsappUrl1, setTempWhatsappUrl1] = useState('');
  const [tempDate2, setTempDate2] = useState('');
  const [tempWhatsappUrl2, setTempWhatsappUrl2] = useState('');
  const [tempDate3, setTempDate3] = useState('');
  const [tempWhatsappUrl3, setTempWhatsappUrl3] = useState('');

  // Player references
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const youtubeId = getYouTubeId(videoUrl);
  const isYouTube = !!youtubeId;

  // Load config from database
  const fetchConfig = () => {
    setConfigLoading(true);
    axios.get('/api/comunidad/config?funnelKey=matriz')
      .then(res => {
        if (res.data) {
          setVideoUrl(res.data.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4');
          setMatrizDate1(res.data.matrizDate1 || 'Martes 7:00 PM');
          setMatrizWhatsappUrl1(res.data.matrizWhatsappUrl1 || '');
          setMatrizDate2(res.data.matrizDate2 || 'Jueves 7:00 PM');
          setMatrizWhatsappUrl2(res.data.matrizWhatsappUrl2 || '');
          setMatrizDate3(res.data.matrizDate3 || 'Sábado 4:00 PM');
          setMatrizWhatsappUrl3(res.data.matrizWhatsappUrl3 || '');

          // Set temp admin fields
          setTempVideoUrl(res.data.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4');
          setTempDate1(res.data.matrizDate1 || 'Martes 7:00 PM');
          setTempWhatsappUrl1(res.data.matrizWhatsappUrl1 || '');
          setTempDate2(res.data.matrizDate2 || 'Jueves 7:00 PM');
          setTempWhatsappUrl2(res.data.matrizWhatsappUrl2 || '');
          setTempDate3(res.data.matrizDate3 || 'Sábado 4:00 PM');
          setTempWhatsappUrl3(res.data.matrizWhatsappUrl3 || '');
        }
      })
      .catch(err => {
        console.error('[MatrizPage] Failed to fetch config:', err);
      })
      .finally(() => {
        setConfigLoading(false);
      });
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Save config changes
  const handleSaveAdminConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        funnelKey: 'matriz',
        videoUrl: tempVideoUrl,
        matrizDate1: tempDate1,
        matrizWhatsappUrl1: tempWhatsappUrl1,
        matrizDate2: tempDate2,
        matrizWhatsappUrl2: tempWhatsappUrl2,
        matrizDate3: tempDate3,
        matrizWhatsappUrl3: tempWhatsappUrl3
      };
      await axios.post('/api/comunidad/config', payload);
      
      // Update local states
      setVideoUrl(tempVideoUrl);
      setMatrizDate1(tempDate1);
      setMatrizWhatsappUrl1(tempWhatsappUrl1);
      setMatrizDate2(tempDate2);
      setMatrizWhatsappUrl2(tempWhatsappUrl2);
      setMatrizDate3(tempDate3);
      setMatrizWhatsappUrl3(tempWhatsappUrl3);

      setIsAdminPanelOpen(false);
    } catch (err) {
      console.error('[MatrizPage] Failed to save config:', err);
      alert('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  // Load YouTube API script dynamically
  useEffect(() => {
    if (!isYouTube) return;
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, [isYouTube]);

  // Hook into the YouTube Player Iframe API
  useEffect(() => {
    if (!isYouTube) return;

    let intervalId: NodeJS.Timeout;
    let ytPlayer: any = null;

    const initializeYTPlayer = () => {
      if (window.YT && window.YT.Player) {
        ytPlayer = new window.YT.Player('wappy-matriz-yt-player', {
          events: {
            onReady: (event: any) => {
              setDuration(event.target.getDuration());
              const savedProgress = localStorage.getItem('wappy_matriz_video_progress');
              if (savedProgress) {
                const seekTime = parseFloat(savedProgress);
                if (seekTime > 0 && seekTime < event.target.getDuration() - 2) {
                  event.target.seekTo(seekTime, true);
                }
              }
            },
            onStateChange: (event: any) => {
              const state = event.data;
              if (state === 1) { // Playing
                setIsPlaying(true);
              } else if (state === 2) { // Paused
                setIsPlaying(false);
              } else if (state === 0) { // Ended
                setIsPlaying(false);
                handleVideoFinished();
              }
            }
          }
        });
        ytPlayerRef.current = ytPlayer;

        // Poll current playback time securely every 200ms
        intervalId = setInterval(() => {
          if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
            try {
              const time = ytPlayer.getCurrentTime();
              setCurrentTime(time);
              const totalDuration = ytPlayer.getDuration();
              if (totalDuration > 0) setDuration(totalDuration);

              // Save progress locally if video is not finished yet
              const savedFinished = localStorage.getItem('wappy_matriz_video_finished') === 'true';
              if (time > 1 && !savedFinished && (!totalDuration || time < totalDuration - 2)) {
                localStorage.setItem('wappy_matriz_video_progress', time.toString());
              }
            } catch (err) {
              // Frame may not be fully loaded
            }
          }
        }, 200);
      }
    };

    if (window.YT && window.YT.Player) {
      initializeYTPlayer();
    } else {
      const pollYTSDK = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(pollYTSDK);
          initializeYTPlayer();
        }
      }, 100);

      return () => {
        clearInterval(pollYTSDK);
        if (intervalId) clearInterval(intervalId);
      };
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (ytPlayer && typeof ytPlayer.destroy === 'function') {
        ytPlayer.destroy();
      }
    };
  }, [isYouTube, videoUrl]);

  // Monitor playback time for HTML5 video
  useEffect(() => {
    if (isYouTube) return;

    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);

      // Save progress locally if video is not finished yet
      const savedFinished = localStorage.getItem('wappy_matriz_video_finished') === 'true';
      if (time > 1 && !savedFinished && (!video.duration || time < video.duration - 2)) {
        localStorage.setItem('wappy_matriz_video_progress', time.toString());
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      const savedProgress = localStorage.getItem('wappy_matriz_video_progress');
      if (savedProgress) {
        const seekTime = parseFloat(savedProgress);
        if (seekTime > 0 && seekTime < video.duration - 2) {
          video.currentTime = seekTime;
        }
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      handleVideoFinished();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isYouTube, videoUrl]);

  // Video completion callback
  const handleVideoFinished = () => {
    setIsVideoFinished(true);
    localStorage.setItem('wappy_matriz_video_finished', 'true');
    localStorage.removeItem('wappy_matriz_video_progress');
  };

  // Video control helpers
  const togglePlay = () => {
    if (isYouTube) {
      const player = ytPlayerRef.current;
      if (player && typeof player.getPlayerState === 'function') {
        const state = player.getPlayerState();
        if (state === 1) { // playing
          player.pauseVideo();
          setIsPlaying(false);
        } else {
          player.playVideo();
          setIsPlaying(true);
        }
      }
    } else {
      const video = videoRef.current;
      if (video) {
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    }
  };

  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Monitor fullscreen events natively
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const getProgressBarWidth = () => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  const handleWhatsappRedirect = (whatsappUrl: string) => {
    if (!whatsappUrl) {
      alert('Esta fecha aún no tiene un enlace de WhatsApp configurado.');
      return;
    }
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/planes')}>
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-xl font-black tracking-wider text-transparent">
              WAPPY IA
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/25">
              Campaña Especial
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeSelector />

            {isAdmin && (
              <button
                onClick={() => setIsAdminPanelOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Ajustes</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      {configLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-sm text-slate-400">Cargando detalles de la campaña...</p>
        </div>
      ) : (
        <main className="mx-auto max-w-5xl px-6 py-12 flex flex-col items-center justify-center">
          
          {/* Header Title */}
          <div className="text-center max-w-3xl mb-8 space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Capacitación Exclusiva: Automatización de Matrices con IA
            </h1>
            <p className="text-sm md:text-base text-slate-400 leading-relaxed">
              Mira la mentoría completa para aprender a crear y gestionar tus matrices de riesgos en minutos utilizando Inteligencia Artificial. Al finalizar, podrás separar tu plaza en vivo.
            </p>
          </div>

          {/* Locked/Unlocked Banner */}
          {!isVideoFinished ? (
            <div className="w-full max-w-3xl mx-auto mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm animate-pulse text-center">
              <span>🎁 ¡Mira el video completo para desbloquear los enlaces de reserva de plaza!</span>
            </div>
          ) : (
            <div className="w-full max-w-3xl mx-auto mb-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm text-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>¡Capacitación Completada! Ya puedes separar tu plaza seleccionando una fecha a continuación.</span>
            </div>
          )}

          {/* Video Container */}
          <div 
            ref={playerContainerRef}
            className="w-full max-w-3xl relative rounded-3xl overflow-hidden border border-slate-900 bg-slate-950/70 shadow-2xl aspect-video mb-10 group"
            onContextMenu={(e) => e.preventDefault()}
          >
            {isYouTube ? (
              <iframe
                id="wappy-matriz-yt-player"
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&controls=0&disablekb=1&rel=0&modestbranding=1&fs=0&iv_load_policy=3&showinfo=0`}
                className="w-full h-full object-cover pointer-events-none select-none border-0"
                allow="autoplay; encrypted-media"
                title="YouTube Video Player"
              />
            ) : (
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover pointer-events-none select-none"
                playsInline
                controls={false}
              />
            )}

            {/* Tap/Click to Play overlay */}
            <div 
              onClick={togglePlay}
              onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="absolute inset-0 z-20 cursor-pointer select-none"
            />

            {!isPlaying && (
              <div 
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-slate-950/40 hover:bg-slate-950/30 transition-all duration-300 cursor-pointer z-25"
              >
                <div className="w-20 h-20 flex items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/35 transform hover:scale-110 transition-transform duration-300">
                  <Play className="w-9 h-9 fill-current ml-1" />
                </div>
              </div>
            )}

            {/* Custom Control Bar (Only Progress Bar) */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-950/90 to-transparent flex flex-col justify-end z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-full h-1 bg-white/10 relative">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-200 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                  style={{ width: `${getProgressBarWidth()}%` }}
                />
              </div>

              <div className="flex items-center justify-between px-6 py-3">
                <button 
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleFullscreen}
                    className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>

                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/90 border border-slate-800 text-[10px] text-slate-300 select-none">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Reproducción Protegida WAPPY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Separar Plaza Dates Section (Revealed only when video ends) */}
          {isVideoFinished && (
            <div className="w-full max-w-4xl mx-auto border border-emerald-500/20 bg-slate-950/50 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-500">
              
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
                <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-2">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  ¡Reserva Tu Lugar en las Clases en Vivo!
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Selecciona la fecha que mejor se adapte a tu horario. Al hacer clic serás redirigido a un grupo exclusivo de WhatsApp donde enviaremos el enlace de conexión y todo el material.
                </p>
              </div>

              {/* Grid of Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                
                {/* Date Option 1 */}
                <div className="flex flex-col justify-between border border-slate-900 bg-slate-900/40 p-6 rounded-2xl relative group hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.1)]">
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Clase en Vivo - Opción 1</h4>
                      <p className="text-base font-extrabold text-white leading-tight min-h-[48px]">
                        {matrizDate1}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleWhatsappRedirect(matrizWhatsappUrl1)}
                    className="w-full mt-6 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span>Separar Plaza 1</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Date Option 2 */}
                <div className="flex flex-col justify-between border border-slate-900 bg-slate-900/40 p-6 rounded-2xl relative group hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.1)]">
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Clase en Vivo - Opción 2</h4>
                      <p className="text-base font-extrabold text-white leading-tight min-h-[48px]">
                        {matrizDate2}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleWhatsappRedirect(matrizWhatsappUrl2)}
                    className="w-full mt-6 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span>Separar Plaza 2</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Date Option 3 */}
                <div className="flex flex-col justify-between border border-slate-900 bg-slate-900/40 p-6 rounded-2xl relative group hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.1)]">
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Clase en Vivo - Opción 3</h4>
                      <p className="text-base font-extrabold text-white leading-tight min-h-[48px]">
                        {matrizDate3}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleWhatsappRedirect(matrizWhatsappUrl3)}
                    className="w-full mt-6 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span>Separar Plaza 3</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          )}

        </main>
      )}

      {/* Admin Panel Modal */}
      {isAdmin && isAdminPanelOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/85 backdrop-blur-lg p-6 z-50 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-left shadow-2xl relative my-auto">
            
            <button
              type="button"
              onClick={() => setIsAdminPanelOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-500" />
              <span>Ajustes Avanzados (Campaña Matriz)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Configura el enlace de video y las fechas o enlaces de WhatsApp del embudo actual.
            </p>

            <form onSubmit={handleSaveAdminConfig} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  URL del Video (YouTube o MP4)
                </label>
                <input
                  type="url"
                  value={tempVideoUrl}
                  onChange={(e) => setTempVideoUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </div>

              <div className="border-t border-slate-800/60 pt-4 space-y-4">
                
                {/* Config Option 1 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Texto Fecha 1</label>
                    <input
                      type="text"
                      value={tempDate1}
                      onChange={(e) => setTempDate1(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      placeholder="Ej: Martes 23 de Jun - 7 PM"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Enlace WhatsApp 1</label>
                    <input
                      type="url"
                      value={tempWhatsappUrl1}
                      onChange={(e) => setTempWhatsappUrl1(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      placeholder="https://chat.whatsapp.com/..."
                    />
                  </div>
                </div>

                {/* Config Option 2 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Texto Fecha 2</label>
                    <input
                      type="text"
                      value={tempDate2}
                      onChange={(e) => setTempDate2(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      placeholder="Ej: Jueves 25 de Jun - 7 PM"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Enlace WhatsApp 2</label>
                    <input
                      type="url"
                      value={tempWhatsappUrl2}
                      onChange={(e) => setTempWhatsappUrl2(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      placeholder="https://chat.whatsapp.com/..."
                    />
                  </div>
                </div>

                {/* Config Option 3 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Texto Fecha 3</label>
                    <input
                      type="text"
                      value={tempDate3}
                      onChange={(e) => setTempDate3(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      placeholder="Ej: Sábado 27 de Jun - 4 PM"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Enlace WhatsApp 3</label>
                    <input
                      type="url"
                      value={tempWhatsappUrl3}
                      onChange={(e) => setTempWhatsappUrl3(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      placeholder="https://chat.whatsapp.com/..."
                    />
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setIsAdminPanelOpen(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-850 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-50 transition-all shadow-md shadow-emerald-500/10"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
