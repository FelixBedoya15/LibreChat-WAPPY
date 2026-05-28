import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Pause, ShieldAlert, Check, Lock, ShieldCheck, ArrowRight, Settings, Save, 
  AlertCircle, Sparkles, UserCheck, HelpCircle, Maximize, Minimize, Trash2, 
  Download, Unlock, FileText, Loader2, RefreshCw, Plus, X, ExternalLink, Key 
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { ThemeSelector } from '@librechat/client';
import axios from 'axios';

// Declare global types for YouTube Iframe Player API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
    WidgetCheckout: any;
  }
}

// Extract YouTube ID helper
function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function ComunidadPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'ADMIN';

  // Config States (Loaded from Backend DB)
  const [configLoading, setConfigLoading] = useState(true);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [price, setPrice] = useState(0);
  const [downloadableFiles, setDownloadableFiles] = useState<any[]>([]);
  const [videoUrl, setVideoUrl] = useState('https://www.w3schools.com/html/mov_bbb.mp4');

  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);

  // Parse if it is YouTube
  const youtubeId = getYouTubeId(videoUrl);
  const isYouTube = !!youtubeId;
  const isYouTubeChannelError = !isYouTube && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));

  // Access State (Free Leads or Paid Purchases)
  const [isAccessChecking, setIsAccessChecking] = useState(true);
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('wappy_comunidad_email') || '');
  const [userFullName, setUserFullName] = useState('');
  
  // Checkout & Recovery Modal States
  const [checkoutFullName, setCheckoutFullName] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [isCheckoutSubmitting, setIsCheckoutSubmitting] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);

  // Free Lead Modal State (Active when requiresPayment is false)
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [isLeadCaptured, setIsLeadCaptured] = useState(() => {
    return localStorage.getItem('wappy_lead_captured') === 'true';
  });

  // Access Recovery
  const [showRecoveryView, setShowRecoveryView] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  // Admin Config Panel States
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [tempVideoUrl, setTempVideoUrl] = useState(videoUrl);
  const [tempRequiresPayment, setTempRequiresPayment] = useState(requiresPayment);
  const [tempPrice, setTempPrice] = useState(price);
  const [tempFiles, setTempFiles] = useState<any[]>([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Admin Dashboard States (Leads vs Purchases)
  const [isLeadsPanelOpen, setIsLeadsPanelOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'leads' | 'purchases'>('leads');
  const [leads, setLeads] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [leadsSearch, setLeadsSearch] = useState('');
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  // Admin File Upload States
  const [uploadFileName, setUploadFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileUploading, setIsFileUploading] = useState(false);

  const isAccessGrantedRef = useRef(isAccessGranted);
  useEffect(() => {
    isAccessGrantedRef.current = isAccessGranted;
  }, [isAccessGranted]);

  const isLeadCapturedRef = useRef(isLeadCaptured);
  useEffect(() => {
    isLeadCapturedRef.current = isLeadCaptured;
  }, [isLeadCaptured]);

  const showLeadModalRef = useRef(showLeadModal);
  useEffect(() => {
    showLeadModalRef.current = showLeadModal;
  }, [showLeadModal]);

  // 1. Fetch Page Configurations from Backend
  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/comunidad/config');
      if (response.data) {
        const data = response.data;
        setVideoUrl(data.videoUrl);
        setTempVideoUrl(data.videoUrl);
        setRequiresPayment(data.requiresPayment);
        setTempRequiresPayment(data.requiresPayment);
        setPrice(data.price);
        setTempPrice(data.price);
        setDownloadableFiles(data.downloadableFiles || []);
        setTempFiles(data.downloadableFiles || []);
      }
    } catch (err) {
      console.error('[Comunidad] Error fetching page config:', err);
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // 2. Check Access for Returning User
  useEffect(() => {
    if (configLoading) return;
    
    // If not in paid mode, we bypass paid check
    if (!requiresPayment) {
      setIsAccessChecking(false);
      return;
    }

    if (!userEmail) {
      setIsAccessChecking(false);
      return;
    }

    axios.post('/api/comunidad/check-access', { email: userEmail })
      .then(res => {
        if (res.data.isPaid) {
          setIsAccessGranted(true);
          setUserFullName(res.data.fullName);
          if (res.data.videoWatched) {
            setIsVideoFinished(true); // if they watched it, immediately unlock materials!
          }
        }
      })
      .catch(err => {
        console.error('[Comunidad] Access check failed:', err);
      })
      .finally(() => {
        setIsAccessChecking(false);
      });
  }, [userEmail, requiresPayment, configLoading]);

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
        ytPlayer = new window.YT.Player('wappy-yt-player', {
          events: {
            onReady: (event: any) => {
              setDuration(event.target.getDuration());
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

              // Standard Lead capture modal logic: lock at 120s if in Free Mode and lead not captured
              if (!requiresPayment && time >= 120 && !isLeadCapturedRef.current && !showLeadModalRef.current) {
                ytPlayer.pauseVideo();
                setIsPlaying(false);
                setShowLeadModal(true);
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
  }, [isYouTube, videoUrl, requiresPayment]);

  // Monitor playback time for HTML5 video
  useEffect(() => {
    if (isYouTube) return;

    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Standard Lead capture modal logic: lock at 120s if in Free Mode and lead not captured
      if (!requiresPayment && video.currentTime >= 120 && !isLeadCapturedRef.current && !showLeadModalRef.current) {
        video.pause();
        setIsPlaying(false);
        video.currentTime = 120; // Lock to exactly 120s
        setShowLeadModal(true);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      handleVideoFinished();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoUrl, isYouTube, requiresPayment]);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Prevent seeking via keyboard
  useEffect(() => {
    if (showLeadModal || (requiresPayment && !isAccessGranted && !isAdmin)) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const blockedKeys = [
        'ArrowLeft', 'ArrowRight', 'Home', 'End', 
        'j', 'J', 'l', 'L', 'k', 'K', 
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 
        'PageUp', 'PageDown', 'i', 'I', 't', 'T'
      ];
      
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      if (e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [showLeadModal, isPlaying, videoUrl, requiresPayment, isAccessGranted, isAdmin]);

  // Video completion callback
  const handleVideoFinished = async () => {
    setIsVideoFinished(true);
    
    // Save completion state to DB if email is available (in free/paid modes)
    const email = userEmail || localStorage.getItem('wappy_lead_data') ? JSON.parse(localStorage.getItem('wappy_lead_data') || '{}').email : '';
    if (email) {
      try {
        await axios.post('/api/comunidad/video-finished', { email });
        console.log('[Comunidad] Persisted video watched status.');
      } catch (err) {
        console.error('[Comunidad] Error persisting progress:', err);
      }
    }
  };

  const playYouTube = () => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
      ytPlayerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const pauseYouTube = () => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      ytPlayerRef.current.pauseVideo();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (showLeadModal || (requiresPayment && !isAccessGranted && !isAdmin)) return;

    if (isYouTube) {
      if (isPlaying) {
        pauseYouTube();
      } else {
        playYouTube();
      }
    } else {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(err => console.error("Error playing video:", err));
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.error("Error entering fullscreen:", err));
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Custom visual progress bar math
  const getProgressBarWidth = () => {
    const isUnlocked = isAdmin || isAccessGranted || isLeadCaptured;
    const targetDuration = isUnlocked ? duration : 120;
    if (targetDuration <= 0) return 0;
    
    const x = Math.min(Math.max(currentTime / targetDuration, 0), 1);
    const nonLinearX = 1 - Math.pow(1 - x, 2); // Quadratic ease-out curve
    return nonLinearX * 100;
  };

  // --- Dynamic Payment Checkout Flow (Wompi) ---
  const handleWompiCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (!checkoutFullName.trim()) {
      setCheckoutError('Por favor, ingresa tu nombre completo.');
      return;
    }
    if (!checkoutEmail.trim() || !/\S+@\S+\.\S+/.test(checkoutEmail)) {
      setCheckoutError('Por favor, ingresa un correo electrónico válido.');
      return;
    }
    if (!checkoutPhone.trim() || checkoutPhone.length < 7) {
      setCheckoutError('Por favor, ingresa un número de celular válido.');
      return;
    }
    if (!acceptedPolicies) {
      setCheckoutError('Debes aceptar las políticas de WAPPY para continuar.');
      return;
    }

    setIsCheckoutSubmitting(true);

    try {
      const { data } = await axios.post('/api/comunidad/checkout', {
        fullName: checkoutFullName.trim(),
        email: checkoutEmail.trim(),
        phone: checkoutPhone.trim()
      });

      if (data.freeAccess || data.alreadyPaid) {
        // Access granted directly (e.g. price is 0 or already paid)
        localStorage.setItem('wappy_comunidad_email', checkoutEmail.trim());
        setUserEmail(checkoutEmail.trim());
        setIsAccessGranted(true);
        if (data.videoWatched) {
          setIsVideoFinished(true);
        }
        setIsCheckoutSubmitting(false);
        return;
      }

      // Load Wompi checkout widget
      if (!window.WidgetCheckout) {
        const script = document.createElement('script');
        script.src = 'https://checkout.wompi.co/widget.js';
        script.async = true;
        document.body.appendChild(script);
        
        script.onload = () => {
          openWompiWidget(data, checkoutEmail.trim());
        };
      } else {
        openWompiWidget(data, checkoutEmail.trim());
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Error al iniciar el proceso de pago.';
      setCheckoutError(errMsg);
      setIsCheckoutSubmitting(false);
    }
  };

  const openWompiWidget = (wompiData: any, email: string) => {
    setIsCheckoutSubmitting(false);
    
    const checkout = new window.WidgetCheckout({
      currency: 'COP',
      amountInCents: wompiData.amountInCents,
      reference: wompiData.reference,
      publicKey: wompiData.publicKey,
      signature: wompiData.signature ? { integrity: wompiData.signature } : undefined,
      redirectUrl: window.location.href
    });

    checkout.open(async (result: any) => {
      const transaction = result.transaction;
      if (transaction.status === 'APPROVED') {
        try {
          setIsAccessChecking(true);
          const response = await axios.post('/api/comunidad/verify', { transactionId: transaction.id });
          if (response.data.success) {
            localStorage.setItem('wappy_comunidad_email', email);
            setUserEmail(email);
            setIsAccessGranted(true);
          }
        } catch (err) {
          console.error('[Wompi Verify] Error:', err);
        } finally {
          setIsAccessChecking(false);
        }
      } else if (transaction.status === 'PENDING') {
        alert('Tu pago está siendo procesado por tu banco. Tan pronto sea aprobado, podrás acceder escribiendo tu correo en la opción "Recuperar acceso".');
      } else {
        alert('El pago no fue aprobado. Por favor, intenta de nuevo o con otro medio de pago.');
      }
    });
  };

  // --- Access Recovery Flow ---
  const handleRecoverAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (!recoveryEmail.trim() || !/\S+@\S+\.\S+/.test(recoveryEmail)) {
      setRecoveryError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setIsRecovering(true);

    try {
      const response = await axios.post('/api/comunidad/check-access', { email: recoveryEmail.trim() });
      if (response.data.isPaid) {
        localStorage.setItem('wappy_comunidad_email', recoveryEmail.trim());
        setUserEmail(recoveryEmail.trim());
        setIsAccessGranted(true);
        setRecoverySuccess('¡Acceso recuperado con éxito! Bienvenido de vuelta.');
        
        if (response.data.videoWatched) {
          setIsVideoFinished(true);
        }
        
        setTimeout(() => {
          setShowRecoveryView(false);
          setRecoverySuccess('');
        }, 2000);
      } else {
        setRecoveryError('No se encontró ningún pago aprobado asociado a este correo. Verifica los datos o realiza tu compra.');
      }
    } catch (err: any) {
      setRecoveryError('Error al validar el correo.');
    } finally {
      setIsRecovering(false);
    }
  };

  // --- Free Lead Capture Form Submit ---
  const handleLeadFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (!checkoutFullName.trim()) {
      setCheckoutError('Por favor, ingresa tu nombre completo.');
      return;
    }
    if (!checkoutEmail.trim() || !/\S+@\S+\.\S+/.test(checkoutEmail)) {
      setCheckoutError('Por favor, ingresa un correo electrónico válido.');
      return;
    }
    if (!checkoutPhone.trim() || checkoutPhone.length < 7) {
      setCheckoutError('Por favor, ingresa un número de celular válido.');
      return;
    }
    if (!acceptedPolicies) {
      setCheckoutError('Debes aceptar las políticas de WAPPY para continuar.');
      return;
    }

    setIsCheckoutSubmitting(true);

    try {
      await axios.post('/api/admin/leads', {
        fullName: checkoutFullName.trim(),
        email: checkoutEmail.trim(),
        phone: checkoutPhone.trim(),
        videoUrl,
      });

      localStorage.setItem('wappy_lead_captured', 'true');
      localStorage.setItem('wappy_lead_data', JSON.stringify({ 
        fullName: checkoutFullName, 
        email: checkoutEmail, 
        phone: checkoutPhone 
      }));
      setIsLeadCaptured(true);
      setShowLeadModal(false);
      setIsCheckoutSubmitting(false);
      
      // Auto-resume video
      if (isYouTube) {
        playYouTube();
      } else if (videoRef.current) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => console.error("Error playing video:", err));
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Hubo un problema al registrar la información.';
      setCheckoutError(errMsg);
      setIsCheckoutSubmitting(false);
    }
  };

  // --- Admin: Config Settings Submit ---
  const handleSaveAdminConfig = async () => {
    setIsSavingConfig(true);
    try {
      const response = await axios.post('/api/comunidad/config', {
        videoUrl: tempVideoUrl,
        requiresPayment: tempRequiresPayment,
        price: tempPrice,
        downloadableFiles: tempFiles
      });
      if (response.data.success) {
        setVideoUrl(tempVideoUrl);
        setRequiresPayment(tempRequiresPayment);
        setPrice(tempPrice);
        setDownloadableFiles(tempFiles);
        setIsAdminPanelOpen(false);
        setIsVideoFinished(false);
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
        if (videoRef.current) {
          videoRef.current.load();
        }
        alert('Configuración guardada exitosamente.');
      }
    } catch (err) {
      console.error('[Admin Config] Save error:', err);
      alert('Hubo un error al guardar la configuración.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // --- Admin: Files Upload & Management ---
  const handleUploadFile = async () => {
    if (!selectedFile) {
      alert('Por favor selecciona un archivo primero.');
      return;
    }
    if (!uploadFileName.trim()) {
      alert('Por favor ingresa un nombre para mostrar al usuario.');
      return;
    }

    setIsFileUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('/api/comunidad/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        const uploaded = response.data.file;
        const newFile = {
          name: uploadFileName.trim(),
          url: uploaded.url,
          filename: uploaded.filename
        };
        setTempFiles(prev => [...prev, newFile]);
        setSelectedFile(null);
        setUploadFileName('');
        // Reset file input
        const fileInput = document.getElementById('comunidad-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (err: any) {
      console.error('[Admin Upload] File upload error:', err);
      alert(err.response?.data?.error || 'Error al subir el archivo.');
    } finally {
      setIsFileUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setTempFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  // --- Admin Dashboard (Leads & Purchases lists) ---
  const fetchDashboardData = async () => {
    setIsLoadingLeads(true);
    try {
      const [leadsRes, purchasesRes] = await Promise.all([
        axios.get('/api/admin/leads'),
        axios.get('/api/comunidad/purchases')
      ]);
      setLeads(leadsRes.data || []);
      setPurchases(purchasesRes.data || []);
    } catch (err) {
      console.error('[Admin Dashboard] Fetch metrics error:', err);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin, isLeadsPanelOpen]);

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este lead registrado?')) {
      return;
    }
    try {
      const response = await axios.delete(`/api/admin/leads/${leadId}`);
      if (response.data.success) {
        setLeads(prev => prev.filter(l => l._id !== leadId));
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
      alert('Error al intentar eliminar.');
    }
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este registro de pago? Se le suspenderá el acceso al usuario.')) {
      return;
    }
    try {
      const response = await axios.delete(`/api/comunidad/purchases/${purchaseId}`);
      if (response.data.success) {
        setPurchases(prev => prev.filter(p => p._id !== purchaseId));
      }
    } catch (err) {
      console.error('Error deleting purchase:', err);
      alert('Error al intentar eliminar.');
    }
  };

  // Export leads or purchases to CSV
  const handleExportCSV = () => {
    const isLeads = dashboardTab === 'leads';
    const activeList = isLeads ? leads : purchases;
    if (activeList.length === 0) return;

    let headers = [];
    let rows = [];

    if (isLeads) {
      headers = ['Nombre Completo', 'Correo Electrónico', 'Número de Celular', 'Fecha de Registro'];
      rows = activeList.map(item => [
        `"${item.fullName.replace(/"/g, '""')}"`,
        `"${item.email.replace(/"/g, '""')}"`,
        `"${item.phone.replace(/"/g, '""')}"`,
        `"${new Date(item.createdAt).toLocaleString()}"`
      ]);
    } else {
      headers = ['Nombre Completo', 'Correo Electrónico', 'Celular', 'Monto Pagado', 'Referencia Wompi', 'Vio Video Completo', 'Fecha de Pago'];
      rows = activeList.map(item => [
        `"${item.fullName.replace(/"/g, '""')}"`,
        `"${item.email.replace(/"/g, '""')}"`,
        `"${item.phone.replace(/"/g, '""')}"`,
        `"$${((item.amountInCents || 0) / 100).toLocaleString('es-CO')}"`,
        `"${item.wompiReference || ''}"`,
        `"${item.videoWatched ? 'Sí' : 'No'}"`,
        `"${new Date(item.createdAt).toLocaleString()}"`
      ]);
    }

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `WAPPY_${isLeads ? 'Leads' : 'Pagos'}_Comunidad_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isUnlocked = isAdmin || isAccessGranted || (!requiresPayment && isLeadCaptured);

  return (
    <div className="min-h-screen bg-surface-secondary text-text-primary font-sans relative overflow-x-hidden transition-colors duration-300 flex flex-col justify-between">
      
      {/* Dynamic Glow Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/5 dark:bg-emerald-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/5 dark:bg-purple-600/10 blur-[120px]" />
      </div>

      <style>{`
        @keyframes floatEffect {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        .animate-premium-float {
          animation: floatEffect 4s ease-in-out infinite;
        }
        .bg-glass {
          background-color: rgba(var(--color-surface-primary), 0.7);
          backdrop-filter: blur(16px);
        }
      `}</style>

      {/* Fixed bottom left theme selector */}
      <div className="fixed bottom-4 left-4 z-50">
        <ThemeSelector />
      </div>

      <div>
        {/* Top Header Navbar */}
        <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-xl"></div>
              <img src="/assets/logo.png" alt="WAPPY Logo" className="h-10 w-auto relative z-10" />
            </div>
            <span className="text-xl font-bold tracking-tight text-text-primary outfit">
              WAPPY
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    localStorage.removeItem('wappy_comunidad_email');
                    localStorage.removeItem('wappy_lead_captured');
                    localStorage.removeItem('wappy_lead_data');
                    setIsAccessGranted(false);
                    setIsLeadCaptured(false);
                    setShowLeadModal(false);
                    setCurrentTime(0);
                    window.location.reload();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 transition-all text-xs font-semibold shadow-sm"
                  title="Reinicia las cookies locales para probar la vista pública"
                >
                  Reiniciar Sesión
                </button>

                <button
                  onClick={() => {
                    setIsLeadsPanelOpen(!isLeadsPanelOpen);
                    setIsAdminPanelOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-primary hover:bg-surface-hover text-text-primary border border-border-medium transition-all text-xs font-semibold shadow-sm"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Métricas de Comunidad
                </button>

                <button
                  onClick={() => {
                    setIsAdminPanelOpen(!isAdminPanelOpen);
                    setIsLeadsPanelOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-primary hover:bg-surface-hover text-text-primary border border-border-medium transition-all text-xs font-semibold shadow-sm"
                >
                  <Settings className="w-3.5 h-3.5 text-emerald-500" />
                  Ajustes de Curso
                </button>
              </>
            )}

            {isVideoFinished && (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-bold transition-all duration-300 text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 hover:scale-105"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Acceder a WAPPY
              </button>
            )}
          </div>
        </nav>

        {/* --- Admin leads / purchases metrics panel --- */}
        {isAdmin && isLeadsPanelOpen && (
          <div className="w-full max-w-5xl mx-auto px-6 mb-6 relative z-30">
            <div className="bg-surface-primary/95 border border-emerald-500/40 rounded-2xl p-6 backdrop-blur-md shadow-xl text-left">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-border-medium">
                <div>
                  <h3 className="text-base font-bold text-emerald-500 flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Dashboard de Contactos y Ventas de Comunidad
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Visualiza y descarga los leads recolectados en el embudo gratuito y los pagos acreditados en el embudo premium.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleExportCSV}
                    disabled={(dashboardTab === 'leads' ? leads : purchases).length === 0}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Exportar Lista (CSV)
                  </button>
                  <button
                    onClick={() => setIsLeadsPanelOpen(false)}
                    className="p-2 rounded-xl bg-surface-secondary hover:bg-surface-hover text-text-secondary border border-border-medium transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabs Selector */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setDashboardTab('leads')}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${dashboardTab === 'leads' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/40 shadow-sm' : 'bg-surface-secondary border-border-medium text-text-secondary hover:bg-surface-hover'}`}
                >
                  Registros Gratuitos (Leads: {leads.length})
                </button>
                <button
                  onClick={() => setDashboardTab('purchases')}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${dashboardTab === 'purchases' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/40 shadow-sm' : 'bg-surface-secondary border-border-medium text-text-secondary hover:bg-surface-hover'}`}
                >
                  Ventas Aprobadas (Wompi: {purchases.length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <input
                  type="text"
                  value={leadsSearch}
                  onChange={(e) => setLeadsSearch(e.target.value)}
                  placeholder="Buscar por nombre, correo o celular..."
                  className="w-full max-w-sm px-4 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all placeholder:text-text-secondary/40"
                />
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-xl border border-border-medium bg-surface-secondary/20 max-h-96 overflow-y-auto">
                {isLoadingLeads ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <span className="text-xs text-text-secondary">Cargando métricas...</span>
                  </div>
                ) : (dashboardTab === 'leads' ? leads : purchases).length === 0 ? (
                  <div className="text-center py-12 text-xs text-text-secondary">No hay registros cargados para esta sección.</div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-surface-secondary border-b border-border-medium text-text-secondary font-semibold sticky top-0 z-10">
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Correo</th>
                        <th className="p-3">Celular</th>
                        {dashboardTab === 'purchases' && (
                          <>
                            <th className="p-3">Monto (COP)</th>
                            <th className="p-3">Referencia</th>
                            <th className="p-3 text-center">Video Visto</th>
                          </>
                        )}
                        <th className="p-3">Fecha de Registro</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dashboardTab === 'leads' ? leads : purchases)
                        .filter(item => {
                          const query = leadsSearch.toLowerCase();
                          return (
                            item.fullName.toLowerCase().includes(query) ||
                            item.email.toLowerCase().includes(query) ||
                            item.phone.includes(query)
                          );
                        })
                        .map((item, idx) => (
                          <tr key={item._id || idx} className="border-b border-border-medium/40 hover:bg-surface-secondary/40 transition-colors">
                            <td className="p-3 font-semibold text-text-primary">{item.fullName}</td>
                            <td className="p-3 text-text-secondary font-mono">{item.email}</td>
                            <td className="p-3 text-text-secondary">{item.phone}</td>
                            {dashboardTab === 'purchases' && (
                              <>
                                <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">
                                  ${((item.amountInCents || 0) / 100).toLocaleString('es-CO')}
                                </td>
                                <td className="p-3 text-text-secondary font-mono text-[10px]">{item.wompiReference}</td>
                                <td className="p-3 text-center">
                                  {item.videoWatched ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">Completado</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold">En curso</span>
                                  )}
                                </td>
                              </>
                            )}
                            <td className="p-3 text-text-secondary">{new Date(item.createdAt).toLocaleString()}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => dashboardTab === 'leads' ? handleDeleteLead(item._id) : handleDeletePurchase(item._id)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all shadow-sm hover:scale-105 shrink-0"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- Admin global configuration panel (Requires Payment, price, file uploads) --- */}
        {isAdmin && isAdminPanelOpen && (
          <div className="w-full max-w-4xl mx-auto px-6 mb-6 relative z-30">
            <div className="bg-surface-primary/95 border border-emerald-500/40 rounded-2xl p-6 backdrop-blur-md shadow-xl text-left">
              <div className="flex items-center justify-between pb-3 border-b border-border-medium mb-4">
                <h3 className="text-base font-bold text-emerald-500 flex items-center gap-2">
                  <Settings className="w-4 h-4 animate-spin-slow" />
                  Ajustes Avanzados del Embudo de Comunidad
                </h3>
                <button
                  onClick={() => setIsAdminPanelOpen(false)}
                  className="p-1.5 rounded-xl bg-surface-secondary hover:bg-surface-hover text-text-secondary border border-border-medium transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General adjustments */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Ajustes Generales</h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Enlace del Video Curso</label>
                    <input
                      type="text"
                      value={tempVideoUrl}
                      onChange={(e) => setTempVideoUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all font-mono"
                      placeholder="URL .mp4 o enlace de YouTube"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border border-border-medium">
                    <div>
                      <h5 className="text-xs font-bold text-text-primary">¿Requiere Pago para Acceder?</h5>
                      <p className="text-[10px] text-text-secondary mt-0.5">Si se activa, el video se bloquea completamente hasta pagar. Si no, se bloquea a los 2 minutos con un formulario de lead.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={tempRequiresPayment} 
                        onChange={(e) => setTempRequiresPayment(e.target.checked)} 
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-border-medium peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {tempRequiresPayment && (
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">Precio de Venta (COP)</label>
                      <input
                        type="number"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                        placeholder="Ej. 49000"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleSaveAdminConfig}
                    disabled={isSavingConfig}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                  >
                    {isSavingConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Guardar Todas las Configuraciones
                  </button>
                </div>

                {/* Downloadable files list */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l border-border-medium md:pl-6 pt-4 md:pt-0 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">Recursos y Archivos de Descarga</h4>
                    
                    {/* Add file selector */}
                    <div className="p-3 rounded-xl bg-surface-secondary/40 border border-border-medium mb-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Nombre en Pantalla</label>
                          <input
                            type="text"
                            value={uploadFileName}
                            onChange={(e) => setUploadFileName(e.target.value)}
                            placeholder="Ej. Matriz de Peligros Editable"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-surface-secondary border border-border-medium text-[11px] text-text-primary focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Seleccionar Archivo (PDF, Excel, ZIP...)</label>
                          <input
                            type="file"
                            id="comunidad-file-input"
                            onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                            className="w-full text-[10px] text-text-secondary file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border file:border-emerald-500/20 file:text-[10px] file:font-semibold file:bg-emerald-500/10 file:text-emerald-500 file:cursor-pointer hover:file:bg-emerald-500/20"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleUploadFile}
                        disabled={isFileUploading}
                        className="w-full py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                      >
                        {isFileUploading ? <Loader2 className="w-3 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Subir y Agregar Material
                      </button>
                    </div>

                    {/* Current Files List */}
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {tempFiles.length === 0 ? (
                        <div className="text-[10px] text-text-secondary/50 text-center py-4">No se han subido materiales aún.</div>
                      ) : (
                        tempFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-surface-secondary border border-border-medium/60 text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="font-medium text-text-primary truncate" title={file.name}>{file.name}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveFile(idx)}
                              className="p-1 rounded hover:bg-red-500/10 text-red-500/80 hover:text-red-500 shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Landing/Checkout Section */}
        {configLoading ? (
          <div className="w-full max-w-4xl mx-auto px-6 py-24 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <h3 className="font-bold text-text-primary text-base">Cargando embudo interactivo...</h3>
          </div>
        ) : (requiresPayment && !isAccessGranted && !isAdmin) ? (
          // --- Paid Access Gate (Covering the entire funnel landing!) ---
          <main className="w-full max-w-4xl mx-auto px-6 py-4 flex flex-col items-center justify-center relative z-10 text-center">
            
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-6 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              CURSO MASTERCLASS SST PREMIUM
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary mb-5 leading-tight max-w-3xl outfit">
              Accede al Curso de Gestión de SST con <span className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">Inteligencia Artificial</span>
            </h1>

            <p className="text-sm text-text-secondary max-w-xl mb-8 leading-relaxed">
              Paga una tarifa única para desbloquear la videocapacitación completa y descargar todas las plantillas y formatos editables de valor.
            </p>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-2 items-start">
              
              {/* Marketing features value column */}
              <div className="space-y-5 bg-surface-primary/50 border border-border-medium rounded-3xl p-6 sm:p-8 backdrop-blur-md">
                <h3 className="text-lg font-bold text-emerald-500 outfit">¿Qué incluye tu compra?</h3>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/20">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-text-primary">Videocapacitación Práctica Completa</h4>
                      <p className="text-[11px] text-text-secondary mt-0.5 leading-normal">Domina la matriz de riesgos, formatos automatizados y el diagnóstico global del SVE utilizando Inteligencia Artificial.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/20">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-text-primary">Material y Plantillas Editables</h4>
                      <p className="text-[11px] text-text-secondary mt-0.5 leading-normal">Descarga de forma ilimitada la Matriz de Peligros, el Plan de Capacitaciones y el manual completo que desbloquearás al terminar de ver el video.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/20">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-text-primary">Acceso de por Vida y Sin Límite</h4>
                      <p className="text-[11px] text-text-secondary mt-0.5 leading-normal">Vuelve a ingresar las veces que quieras con tu correo electrónico para revisar el material y descargar actualizaciones sin volver a pagar.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-medium flex flex-col justify-center text-center">
                  <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Costo único del Curso</span>
                  <span className="text-3xl font-extrabold text-emerald-500 mt-1 outfit">
                    ${price.toLocaleString('es-CO')} <span className="text-xs font-semibold text-text-secondary font-sans">COP</span>
                  </span>
                </div>
              </div>

              {/* Form Checkout & Recovery column */}
              <div className="bg-surface-primary border border-border-medium rounded-3xl p-6 sm:p-8 shadow-2xl relative">
                
                {!showRecoveryView ? (
                  // Wompi Purchase checkout
                  <form onSubmit={handleWompiCheckout} className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border-medium/60">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider">Completa tu Registro y Pago</h3>
                    </div>

                    {checkoutError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{checkoutError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Nombre Completo</label>
                      <input
                        type="text"
                        value={checkoutFullName}
                        onChange={(e) => setCheckoutFullName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        value={checkoutEmail}
                        onChange={(e) => setCheckoutEmail(e.target.value)}
                        placeholder="juan@correo.com"
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Número de Celular</label>
                      <input
                        type="tel"
                        value={checkoutPhone}
                        onChange={(e) => setCheckoutPhone(e.target.value)}
                        placeholder="Ej. 3001234567"
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer group pt-1">
                      <input
                        type="checkbox"
                        checked={acceptedPolicies}
                        onChange={(e) => setAcceptedPolicies(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border-medium bg-surface-secondary text-emerald-500 focus:ring-emerald-500/20"
                      />
                      <span className="text-[10px] text-text-secondary leading-normal group-hover:text-text-primary transition-colors">
                        Acepto la{' '}
                        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-500 underline">política de privacidad</a>{' '}
                        y el tratamiento de datos de WAPPY.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isCheckoutSubmitting}
                      className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-extrabold transition-all duration-300 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isCheckoutSubmitting ? (
                        <>
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                          <span>Inicializando Wompi...</span>
                        </>
                      ) : (
                        <>
                          <span>Pagar y Acceder al Curso</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="pt-3 text-center border-t border-border-medium/60 mt-1">
                      <button
                        type="button"
                        onClick={() => setShowRecoveryView(true)}
                        className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center justify-center gap-1.5 mx-auto"
                      >
                        <Key className="w-3.5 h-3.5" />
                        ¿Ya compraste? Recupera tu acceso
                      </button>
                    </div>
                  </form>
                ) : (
                  // Access Recovery View
                  <form onSubmit={handleRecoverAccess} className="space-y-4 py-4">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border-medium/60">
                      <Key className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider">Recuperar Acceso Autorizado</h3>
                    </div>

                    <p className="text-[11px] text-text-secondary leading-normal">
                      Ingresa el correo electrónico que utilizaste al realizar el pago del curso. Si tu compra fue aprobada, recuperarás el acceso al video y materiales al instante.
                    </p>

                    {recoveryError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{recoveryError}</span>
                      </div>
                    )}

                    {recoverySuccess && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 shrink-0" />
                        <span>{recoverySuccess}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Correo Electrónico registrado</label>
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="juan@correo.com"
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isRecovering}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-extrabold transition-all duration-300 shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isRecovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Verificar Acceso de Compra
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowRecoveryView(false);
                        setRecoveryError('');
                      }}
                      className="w-full py-2.5 rounded-xl bg-surface-secondary hover:bg-surface-hover text-text-secondary text-xs font-semibold border border-border-medium transition-all"
                    >
                      Volver al Formulario de Compra
                    </button>
                  </form>
                )}

              </div>

            </div>

          </main>
        ) : (
          // --- Unified Funnel with Video Player and downloads ---
          <main className="w-full max-w-4xl mx-auto px-6 py-4 flex flex-col items-center text-center relative z-10">
            
            {/* Marketing Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-6 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              CAPACITACIÓN EXCLUSIVA WAPPY
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary mb-6 leading-tight max-w-3xl outfit">
              Domina la Gestión de SST usando <span className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">Inteligencia Artificial</span>
            </h1>

            {/* Summarized columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full mb-8 text-left">
              <div className="bg-surface-primary/60 border border-border-medium/60 rounded-2xl p-4 flex gap-3 hover:border-emerald-500/30 transition-all duration-300 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5 border border-emerald-500/20">
                  <span className="font-bold text-sm outfit">01</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text-primary leading-snug">Matriz de Peligros Gratis</h4>
                  <p className="text-xs text-text-secondary mt-1 leading-normal">Diseña e identifica de forma 100% gratuita tu matriz de peligros completa con soporte de IA.</p>
                </div>
              </div>

              <div className="bg-surface-primary/60 border border-border-medium/60 rounded-2xl p-4 flex gap-3 hover:border-emerald-500/30 transition-all duration-300 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5 border border-emerald-500/20">
                  <span className="font-bold text-sm outfit">02</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text-primary leading-snug">Formatos IA y Manuales</h4>
                  <p className="text-xs text-text-secondary mt-1 leading-normal">Crea al instante formatos dinámicos interactivos, políticas SST y manuales del SVE con la IA.</p>
                </div>
              </div>

              <div className="bg-surface-primary/60 border border-border-medium/60 rounded-2xl p-4 flex gap-3 hover:border-emerald-500/30 transition-all duration-300 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5 border border-emerald-500/20">
                  <span className="font-bold text-sm outfit">03</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text-primary leading-snug">SST con Código QR Activo</h4>
                  <p className="text-xs text-text-secondary mt-1 leading-normal">Usa el QR de cada trabajador registrado para escanear y conocer sus datos de emergencia ante incidentes.</p>
                </div>
              </div>
            </div>

            {/* Video Player Box */}
            <div 
              ref={playerContainerRef}
              className="w-full relative rounded-3xl overflow-hidden border border-border-medium bg-surface-primary/70 shadow-2xl aspect-video mb-8 group"
              onContextMenu={(e) => e.preventDefault()}
            >
              {isYouTube ? (
                <iframe
                  id="wappy-yt-player"
                  ref={iframeRef}
                  src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&controls=0&disablekb=1&rel=0&modestbranding=1&fs=0&iv_load_policy=3&showinfo=0`}
                  className="w-full h-full object-cover pointer-events-none select-none border-0"
                  allow="autoplay; encrypted-media"
                  title="YouTube Video Player"
                />
              ) : isYouTubeChannelError ? (
                <div className="w-full h-full bg-surface-secondary flex flex-col items-center justify-center p-6 text-center select-none">
                  <ShieldAlert className="w-12 h-12 text-amber-500 mb-2 animate-bounce" />
                  <h4 className="font-bold text-text-primary text-base">Enlace de YouTube no soportado</h4>
                  <p className="text-xs text-text-secondary mt-1 max-w-sm leading-normal">
                    Ingresa un link directo de video (ej: https://www.youtube.com/watch?v=VIDEO_ID) para que funcione.
                  </p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-cover pointer-events-none select-none"
                  playsInline
                  controls={false}
                />
              )}

              {/* Protected Click Shield */}
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

              {/* Large Center Play Icon */}
              {!isPlaying && !showLeadModal && !isYouTubeChannelError && (
                <div 
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-slate-950/40 hover:bg-slate-950/30 transition-all duration-300 cursor-pointer z-25"
                >
                  <div className="w-20 h-20 flex items-center justify-center rounded-full bg-emerald-500 text-white dark:text-slate-950 shadow-lg shadow-emerald-500/35 transform hover:scale-110 transition-transform duration-300">
                    <Play className="w-9 h-9 fill-current ml-1" />
                  </div>
                </div>
              )}

              {/* Free Lead Modal Overlay (Displays at 120s if requiresPayment is false) */}
              {showLeadModal && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85 dark:bg-slate-950/90 backdrop-blur-lg p-4 sm:p-6 z-40">
                  <div className="w-full max-w-md bg-surface-primary border border-border-medium rounded-2xl p-6 sm:p-8 text-left shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-text-primary leading-tight outfit">Acceso Exclusivo WAPPY</h3>
                        <p className="text-[10px] text-text-secondary">Registra tus datos para desbloquear el video curso</p>
                      </div>
                    </div>

                    <form onSubmit={handleLeadFormSubmit} className="space-y-3.5">
                      {checkoutError && (
                        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{checkoutError}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Nombre Completo</label>
                        <input
                          type="text"
                          value={checkoutFullName}
                          onChange={(e) => setCheckoutFullName(e.target.value)}
                          placeholder="Juan Pérez"
                          className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Correo</label>
                          <input
                            type="email"
                            value={checkoutEmail}
                            onChange={(e) => setCheckoutEmail(e.target.value)}
                            placeholder="juan@correo.com"
                            className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Celular</label>
                          <input
                            type="tel"
                            value={checkoutPhone}
                            onChange={(e) => setCheckoutPhone(e.target.value)}
                            placeholder="Ej. 3001234567"
                            className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>

                      <label className="flex items-start gap-2 cursor-pointer group mt-2.5">
                        <input
                          type="checkbox"
                          checked={acceptedPolicies}
                          onChange={(e) => setAcceptedPolicies(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-border-medium bg-surface-secondary text-emerald-500 focus:ring-emerald-500/20"
                        />
                        <span className="text-[10px] text-text-secondary leading-normal group-hover:text-text-primary">
                          Acepto las <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-500 underline">políticas de privacidad</a> y el tratamiento de datos de WAPPY.
                        </span>
                      </label>

                      <button
                        type="submit"
                        disabled={isCheckoutSubmitting}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                      >
                        {isCheckoutSubmitting ? 'Registrando...' : 'Continuar con el video'}
                        {!isCheckoutSubmitting && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Bottom Custom Playback Bar */}
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-950/90 to-transparent flex flex-col justify-end z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-full h-1 bg-white/20 relative">
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
                      <Lock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>Reproducción Protegida WAPPY</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* --- Downloadable Files Container --- */}
            <div className="w-full max-w-4xl mt-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-text-primary outfit">Material Complementario y Plantillas Descargables</h3>
              </div>

              {downloadableFiles.length === 0 ? (
                <div className="p-8 rounded-2xl border border-border-medium bg-surface-primary/40 text-center text-xs text-text-secondary">
                  El administrador no ha subido materiales complementarios para esta clase aún.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {downloadableFiles.map((file, idx) => {
                    return (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-4 ${
                          isVideoFinished 
                            ? 'bg-surface-primary border-emerald-500/30 hover:border-emerald-500/60 shadow-md hover:shadow-lg' 
                            : 'bg-surface-primary/50 border-border-medium/60 opacity-70 select-none'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl border shrink-0 ${
                            isVideoFinished 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                              : 'bg-surface-secondary border-border-medium text-text-secondary/50'
                          }`}>
                            {isVideoFinished ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4 animate-pulse" />}
                          </div>
                          
                          <div className="truncate">
                            <h4 className="font-bold text-xs text-text-primary truncate" title={file.name}>{file.name}</h4>
                            <p className="text-[10px] text-text-secondary mt-0.5">Formato 100% editable</p>
                          </div>
                        </div>

                        {isVideoFinished ? (
                          <a
                            href={file.url}
                            download
                            className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm hover:scale-[1.02]"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Descargar Archivo
                          </a>
                        ) : (
                          <button
                            onClick={() => alert('🔒 Contenido Bloqueado: Debes terminar de ver la videocapacitación de principio a fin para descargar estas herramientas de valor.')}
                            className="w-full py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-secondary text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
                          >
                            <Lock className="w-3 h-3" />
                            Bloqueado
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Value badge noticed float */}
            <div className="w-full max-w-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/20 to-emerald-500/10 border-2 border-emerald-500/80 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:shadow-[0_0_35px_rgba(16,185,129,0.25)] transition-all duration-300 mt-10 text-center flex flex-col items-center justify-center gap-3 animate-premium-float">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                <ShieldCheck className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-text-primary leading-snug">
                  Finalizando el curso recibirás acceso a todas las herramientas y una sorpresa por llegar hasta el final.
                </h3>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Aprovecha esta capacitación e integra la IA con la Seguridad y Salud en el Trabajo.
                </p>
              </div>
            </div>

          </main>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-border-medium py-6 mt-10 text-center text-xs text-text-secondary relative z-10 bg-surface-primary/20">
        <div className="flex justify-center gap-6 mb-2">
          <a href="/privacy" className="hover:text-emerald-500 transition-colors">Políticas de Privacidad</a>
          <span>·</span>
          <a href="/terms" className="hover:text-emerald-500 transition-colors">Términos de Servicio</a>
        </div>
        <p>© {new Date().getFullYear()} WAPPY. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
