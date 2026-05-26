import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, ShieldAlert, Check, Lock, ShieldCheck, ArrowRight, Settings, Save, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { ThemeSelector } from '@librechat/client';

export default function ComunidadPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'ADMIN';

  // Video State
  const [videoUrl, setVideoUrl] = useState(() => {
    return localStorage.getItem('wappy_comunidad_video_url') || 'https://www.w3schools.com/html/mov_bbb.mp4';
  });
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [tempVideoUrl, setTempVideoUrl] = useState(videoUrl);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Lead Modal State
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [isLeadCaptured, setIsLeadCaptured] = useState(() => {
    return localStorage.getItem('wappy_lead_captured') === 'true';
  });

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Monitor playback time to trigger the lead capture at 120 seconds (2 minutes)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // If video reaches 120s and lead is not captured, pause and show modal
      if (video.currentTime >= 120 && !isLeadCaptured) {
        video.pause();
        setIsPlaying(false);
        video.currentTime = 120; // Lock to exactly 120s
        setShowLeadModal(true);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [isLeadCaptured]);

  // Prevent seeking via keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // List of blocked keys
      const blockedKeys = [
        'ArrowLeft', 'ArrowRight', 'Home', 'End', 
        'j', 'J', 'l', 'L', 'k', 'K', // YouTube hotkeys
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', // Seeking percentages
        'PageUp', 'PageDown', 'i', 'I', 't', 'T' // Picture-in-picture, theater mode
      ];
      
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Space toggles play/pause
      if (e.key === ' ' && !showLeadModal) {
        e.preventDefault();
        e.stopPropagation();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [showLeadModal, isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || showLeadModal) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.error("Error playing video:", err));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSaveVideoUrl = () => {
    localStorage.setItem('wappy_comunidad_video_url', tempVideoUrl);
    setVideoUrl(tempVideoUrl);
    setIsAdminPanelOpen(false);
    if (videoRef.current) {
      videoRef.current.load();
      setIsPlaying(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('Por favor, ingresa tu nombre completo.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setFormError('Por favor, ingresa un correo electrónico válido.');
      return;
    }
    if (!phone.trim() || phone.length < 7) {
      setFormError('Por favor, ingresa un número de celular válido.');
      return;
    }
    if (!acceptedPolicies) {
      setFormError('Debes aceptar las políticas de WAPPY para continuar.');
      return;
    }

    setIsSubmitting(true);

    // Mock API submission / Lead storage
    setTimeout(() => {
      localStorage.setItem('wappy_lead_captured', 'true');
      localStorage.setItem('wappy_lead_data', JSON.stringify({ fullName, email, phone }));
      setIsLeadCaptured(true);
      setShowLeadModal(false);
      setIsSubmitting(false);
      
      // Auto-resume video
      if (videoRef.current) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        });
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* Floating Theme Selector (invisible or elegant) */}
      <div className="fixed bottom-4 left-4 z-50">
        <ThemeSelector />
      </div>

      {/* Top Navbar */}
      <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-xl"></div>
            <img src="/assets/logo.png" alt="WAPPY Logo" className="h-10 w-auto relative z-10" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white outfit">
            WAPPY<span className="text-emerald-400">.comunidad</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isAdmin && (
            <button
              onClick={() => {
                setTempVideoUrl(videoUrl);
                setIsAdminPanelOpen(!isAdminPanelOpen);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all text-sm font-medium"
            >
              <Settings className="w-4 h-4 text-emerald-400 animate-spin-slow" />
              Configurar Video
            </button>
          )}
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all duration-300 text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35"
          >
            Iniciar Sesión
          </button>
        </div>
      </nav>

      {/* Admin Settings Panel */}
      {isAdmin && isAdminPanelOpen && (
        <div className="w-full max-w-3xl mx-auto px-6 mb-6 relative z-30">
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 backdrop-blur-md shadow-xl">
            <h3 className="text-md font-bold text-emerald-400 mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Panel de Administración: Enlace de Video
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Ingresa el link directo de tu video promocional (.mp4). Los cambios se aplicarán de inmediato.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={tempVideoUrl}
                onChange={(e) => setTempVideoUrl(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-all"
                placeholder="https://ejemplo.com/video.mp4"
              />
              <button
                onClick={handleSaveVideoUrl}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                Guardar Enlace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Funnel */}
      <main className="w-full max-w-4xl mx-auto px-6 py-6 flex flex-col items-center text-center relative z-10">
        
        {/* Marketing Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          MASTERCLASS EXCLUSIVA PARA SST
        </div>

        {/* Catchy Headline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight max-w-2xl outfit">
          Domina la Gestión de SST usando <span className="text-emerald-400 bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Inteligencia Artificial</span>
        </h1>
        
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mb-8 leading-relaxed">
          Mira este video completo y aprende cómo automatizar matrices de riesgo, generar inspecciones y auditar sistemas de seguridad en minutos.
        </p>

        {/* Custom Video Player Container */}
        <div className="w-full relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/70 shadow-2xl aspect-video mb-8 group" onContextMenu={(e) => e.preventDefault()}>
          
          {/* Main Video Element */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover pointer-events-none select-none"
            playsInline
            controls={false} // Force custom controls only
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Secure Invisible Interactive Overlay */}
          <div 
            onClick={togglePlay}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute inset-0 z-20 cursor-pointer select-none"
          />

          {/* Large Center Play Overlay (when paused) */}
          {!isPlaying && !showLeadModal && (
            <div 
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-slate-950/50 hover:bg-slate-950/40 transition-all duration-300 cursor-pointer z-25"
            >
              <div className="w-20 h-20 flex items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 transform hover:scale-110 transition-transform duration-300">
                <Play className="w-9 h-9 fill-current ml-1" />
              </div>
            </div>
          )}

          {/* Locked Lead Capture Popup Modal (Overlay inside Player) */}
          {showLeadModal && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-lg p-4 sm:p-6 z-40">
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-left shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight outfit">Acceso Exclusivo</h3>
                    <p className="text-xs text-slate-400">Rellena tus datos para continuar el curso</p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {formError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nombre Completo</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="juan@correo.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Número de Celular</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej. 3001234567"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  {/* Policies Agreement Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group mt-2">
                    <input
                      type="checkbox"
                      checked={acceptedPolicies}
                      onChange={(e) => setAcceptedPolicies(e.target.checked)}
                      className="mt-1 h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-slate-900"
                    />
                    <span className="text-xs text-slate-400 leading-normal group-hover:text-slate-300 transition-colors">
                      Acepto la{' '}
                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 underline hover:text-emerald-300 transition-colors"
                      >
                        política de privacidad
                      </a>{' '}
                      y el tratamiento de datos personales de WAPPY.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 mt-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all duration-300 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 hover:translate-x-0.5 active:translate-x-0 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Registrando...' : 'Desbloquear y Continuar'}
                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Premium Custom Control Bar */}
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-950 to-transparent flex items-center justify-between px-6 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlay}
                className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <span className="text-xs font-mono text-slate-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Reproducción Protegida WAPPY</span>
            </div>
          </div>
        </div>

        {/* Premium Bottom Notice Card */}
        <div className="w-full max-w-2xl bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-5 sm:p-6 backdrop-blur-md relative overflow-hidden shadow-lg shadow-emerald-500/5">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-start gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
                Finalizando el curso recibirás acceso a todas las herramientas y una sorpresa por llegar hasta el final.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Aprovecha esta capacitación e integra la IA en tu día a día laboral con WAPPY.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Simple and elegant footer matching other pages */}
      <footer className="w-full border-t border-slate-900 mt-20 py-8 text-center text-xs text-slate-500 relative z-10 bg-slate-950">
        <div className="flex justify-center gap-6 mb-3">
          <a href="/privacy" className="hover:text-emerald-400 transition-colors">Políticas de Privacidad</a>
          <span>·</span>
          <a href="/terms" className="hover:text-emerald-400 transition-colors">Términos de Servicio</a>
        </div>
        <p>© {new Date().getFullYear()} WAPPY LTDA. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
