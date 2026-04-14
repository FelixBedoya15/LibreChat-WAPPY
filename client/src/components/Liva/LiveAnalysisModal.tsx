import { useState, useEffect, useCallback, useRef, useMemo, type FC } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { X, Mic, MicOff, Video, VideoOff, RefreshCcw, Monitor, MonitorOff, PhoneOff, Smartphone } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import store from '~/store';
import VoiceOrb from '../Voice/VoiceOrb';
import VoiceSelector from '../Voice/VoiceSelector';
import { useLiveAnalysisSession } from '~/hooks/useLiveAnalysisSession';
import { useLocalize } from '~/hooks';

interface LiveAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId?: string;
    onConversationIdUpdate?: (newId: string) => void;
    onTextReceived?: (text: string) => void;
    onReportReceived?: (html: string, kpi?: any) => void;
    onConversationUpdated?: () => void;
    selectedModel?: string;
}

const LiveAnalysisModal: FC<LiveAnalysisModalProps> = ({ isOpen, onClose, conversationId, onConversationIdUpdate, onTextReceived, onReportReceived, onConversationUpdated, selectedModel }) => {
    const localize = useLocalize();
    const [voiceLiveAnalysis, setVoiceLiveAnalysis] = useRecoilState(store.voiceLiveAnalysis);
    const setShowModalState = useSetRecoilState(store.showLiveAnalysisModal);
    const [selectedVoice, setSelectedVoice] = useState(voiceLiveAnalysis);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [statusText, setStatusText] = useState('Initializing...');
    const [isReady, setIsReady] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [showVoiceSelector, setShowVoiceSelector] = useState(false);
    const [audioAmplitude, setAudioAmplitude] = useState(0);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const snapshotRef = useRef<string | null>(null);
    // Store multiple snapshots for the report (up to 3)
    const snapshotsRef = useRef<string[]>([]);
    const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Countdown state - 10 seconds
    const [countdown, setCountdown] = useState(10);

    // Track if report has been received
    const [hasReceivedReport, setHasReceivedReport] = useState(false);
    const [reportNotification, setReportNotification] = useState(false);

    const [supportsScreenShare, setSupportsScreenShare] = useState(false);

    useEffect(() => {
        // Check if getDisplayMedia is supported
        if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
            setSupportsScreenShare(true);
        }
    }, []);

    // Helper to capture video frame — validates dimensions before saving
    const captureSnapshot = useCallback((): string | null => {
        const video = videoRef.current;
        if (!video) return null;
        const w = video.videoWidth;
        const h = video.videoHeight;
        // Only capture if video is actually streaming (non-zero dimensions)
        if (!w || !h) {
            console.warn('[LiveAnalysisModal] captureSnapshot: video not ready (0x0), skipping');
            return null;
        }
        try {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                console.log(`[LiveAnalysisModal] Snapshot captured: ${w}x${h}`);
                return dataUrl;
            }
        } catch (e) {
            console.error('Error capturing snapshot:', e);
        }
        return null;
    }, []);

    const sessionOptions = useMemo(() => ({
        conversationId,
        onConversationIdUpdate,
        disableAudio: false,
        initialVoice: voiceLiveAnalysis,
        selectedModel,
        onAudioReceived: (audioData: string) => {
            handleAudioReceived(audioData);
        },
        onTextReceived: (text: string) => {
            onTextReceived?.(text);
        },
        onReportReceived: (html: string) => {
            setHasReceivedReport(true); // Toast is triggered by useEffect watching this

            const dateStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = new Date().toLocaleTimeString('es-ES');
            const snapshots = snapshotsRef.current;

            // Build evidence gallery (up to 3 images)
            let evidenceSection = '';
            if (snapshots.length > 0) {
                const imgItems = snapshots.map((src, idx) => `
                    <div style="flex:1; min-width:200px; text-align:center;">
                        <img src="${src}" alt="Evidencia ${idx+1}" style="width:100%; height:160px; object-fit:cover; border-radius:8px; border:1px solid #ddd; box-shadow:0 2px 8px rgba(0,0,0,0.1);" />
                        <p style="font-size:0.75em; color:#7f8c8d; margin-top:4px;">Figura ${idx+1}: Captura ${idx === 0 ? 'inicial' : idx === 1 ? 'intermedia' : 'final'} del entorno.</p>
                    </div>`).join('');
                evidenceSection = `
                    <div style="margin-bottom:24px;">
                        <h3 style="color:#1a3a5c; font-size:1em; text-transform:uppercase; letter-spacing:1px; border-left:4px solid #0066cc; padding-left:10px;">1. Evidencia Fotográfica del Entorno Analizado</h3>
                        <div style="display:flex; flex-wrap:wrap; gap:12px; margin-top:12px;">${imgItems}</div>
                    </div>`;
            }

            // ─── Parse KPI metadata embedded by the AI ─────────────────────────
            // The AI starts with: <div id="wappy-kpi" data-riesgo="..." data-accion="..." data-consecuencia="..." data-npeligros="N">
            const parseKpi = (rawHtml: string) => {
                const defaults = { riesgo: 'INDETERMINADO', accion: 'Evaluar', consecuencia: 'Incapacitante', npeligros: '5+' };
                try {
                    const match = rawHtml.match(/<div[^>]+id=["']wappy-kpi["'][^>]*>/i);
                    if (!match) return defaults;
                    const tag = match[0];
                    const get = (attr: string) => {
                        const m = tag.match(new RegExp(`${attr}=["']([^"']+)["']`, 'i'));
                        return m ? m[1].trim() : '';
                    };
                    return {
                        riesgo:       get('data-riesgo')       || defaults.riesgo,
                        accion:       get('data-accion')       || defaults.accion,
                        consecuencia: get('data-consecuencia') || defaults.consecuencia,
                        npeligros:    get('data-npeligros')    || defaults.npeligros,
                    };
                } catch { return defaults; }
            };

            const kpi = parseKpi(html);

            // Color schemes per risk level
            const riesgoStyle = kpi.riesgo === 'ALTO'
                ? { bg: '#fff3e0', border: '#f57c00', labelColor: '#e65100', valColor: '#bf360c', icon: '⚠' }
                : kpi.riesgo === 'MEDIO'
                ? { bg: '#fffde7', border: '#f9a825', labelColor: '#f57f17', valColor: '#e65100', icon: '⚡' }
                : kpi.riesgo === 'BAJO'
                ? { bg: '#e8f5e9', border: '#2e7d32', labelColor: '#1b5e20', valColor: '#2e7d32', icon: '✔' }
                : { bg: '#f5f5f5', border: '#9e9e9e', labelColor: '#616161', valColor: '#424242', icon: '?' };

            const accionStyle = kpi.accion === 'Inmediata'
                ? { bg: '#fce4ec', border: '#c62828', labelColor: '#b71c1c', valColor: '#b71c1c', icon: '🔴' }
                : kpi.accion === 'Programada'
                ? { bg: '#fff8e1', border: '#f57c00', labelColor: '#e65100', valColor: '#e65100', icon: '🟡' }
                : { bg: '#e3f2fd', border: '#1565c0', labelColor: '#0d47a1', valColor: '#0d47a1', icon: '🟢' };

            const consecuenciaStyle = kpi.consecuencia === 'Mortal'
                ? { bg: '#fce4ec', border: '#880e4f', labelColor: '#880e4f', valColor: '#880e4f', icon: '☠️' }
                : kpi.consecuencia === 'Incapacitante'
                ? { bg: '#fff3e0', border: '#e65100', labelColor: '#bf360c', valColor: '#bf360c', icon: '🦺' }
                : { bg: '#e8f5e9', border: '#2e7d32', labelColor: '#1b5e20', valColor: '#2e7d32', icon: '🩹' };

            const kpiCards = `
      <div style="flex:1; min-width:120px; background:${riesgoStyle.bg}; border-left:4px solid ${riesgoStyle.border}; border-radius:8px; padding:12px 16px;">
        <div style="font-size:0.65em; color:${riesgoStyle.labelColor}; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Riesgo Predominante</div>
        <div style="font-size:1.3em; font-weight:800; color:${riesgoStyle.valColor};">${kpi.riesgo} ${riesgoStyle.icon}</div>
      </div>
      <div style="flex:1; min-width:120px; background:${consecuenciaStyle.bg}; border-left:4px solid ${consecuenciaStyle.border}; border-radius:8px; padding:12px 16px;">
        <div style="font-size:0.65em; color:${consecuenciaStyle.labelColor}; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Consecuencia Máx.</div>
        <div style="font-size:1.1em; font-weight:800; color:${consecuenciaStyle.valColor};">${kpi.consecuencia} ${consecuenciaStyle.icon}</div>
      </div>
      <div style="flex:1; min-width:120px; background:#e8eaf6; border-left:4px solid #3949ab; border-radius:8px; padding:12px 16px;">
        <div style="font-size:0.65em; color:#1a237e; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Peligros Detectados</div>
        <div style="font-size:1.3em; font-weight:800; color:#283593;">${kpi.npeligros} 🔍</div>
      </div>
      <div style="flex:1; min-width:120px; background:${accionStyle.bg}; border-left:4px solid ${accionStyle.border}; border-radius:8px; padding:12px 16px;">
        <div style="font-size:0.65em; color:${accionStyle.labelColor}; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Acción Requerida</div>
        <div style="font-size:1.1em; font-weight:800; color:${accionStyle.valColor};">${kpi.accion} ${accionStyle.icon}</div>
      </div>`;

            // SGSST-style full report HTML
            const finalHtml = `
<div style="font-family:'Segoe UI',Arial,sans-serif; max-width:900px; margin:0 auto; color:#222;">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#0d2d5e 0%,#1565c0 100%); padding:28px 32px; border-radius:12px 12px 0 0; margin-bottom:0;">
    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
      <div>
        <div style="color:#64b5f6; font-size:0.7em; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-bottom:4px;">Sistema de Gestión de Seguridad y Salud en el Trabajo</div>
        <h1 style="color:#fff; font-size:1.6em; font-weight:800; margin:0 0 4px;">Informe de Análisis de Riesgos y Peligros</h1>
        <div style="color:#90caf9; font-size:0.8em;">Modalidad: Inspección en Vivo (Live Analysis) · GTC 45 / ISO 45001</div>
      </div>
      <div style="text-align:right;">
        <div style="background:rgba(255,255,255,0.15); border-radius:8px; padding:10px 16px; min-width:160px;">
          <div style="color:#64b5f6; font-size:0.65em; font-weight:700; letter-spacing:2px; text-transform:uppercase;">Radicado</div>
          <div style="color:#fff; font-size:1.1em; font-weight:700;">LA-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}</div>
          <div style="color:#90caf9; font-size:0.7em; margin-top:4px;">${dateStr}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- INFO BAR -->
  <div style="background:#e3f2fd; border:1px solid #90caf9; border-top:none; padding:12px 24px; display:flex; flex-wrap:wrap; gap:24px; font-size:0.8em; color:#1565c0;">
    <div><strong>Fecha:</strong> ${dateStr}</div>
    <div><strong>Hora:</strong> ${timeStr}</div>
    <div><strong>Tipo:</strong> Inspección de Riesgos en Vivo</div>
    <div><strong>Metodología:</strong> GTC 45 / ISO 45001 / Decreto 1072</div>
    <div><strong>Estado:</strong> <span style="color:#2e7d32; font-weight:700;">✔ Completado</span></div>
  </div>

  <!-- BODY -->
  <div style="background:#fff; border:1px solid #e0e0e0; border-top:none; padding:28px 32px 16px;">

    ${evidenceSection}

    <!-- KPI Cards (dynamic) -->
    <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:24px;">
      ${kpiCards}
    </div>

    <!-- AI GENERATED CONTENT -->
    <div class="ai-report-content" style="line-height:1.7;">
      ${html}
    </div>

  </div>
  </div>

</div>`;

            onReportReceived?.(finalHtml, kpi);

        },
        onStatusChange: (newStatus: string) => {
            console.log('[LiveAnalysisModal] Status:', newStatus);
            switch (newStatus) {
                case 'listening':
                    setStatusText('Escuchando...');
                    break;
                case 'speaking':
                    setStatusText('Hablando...');
                    break;
                case 'thinking':
                    setStatusText('Analizando...');
                    break;
                case 'connecting':
                    setStatusText('Conectando...');
                    break;
                case 'connected':
                    setStatusText('Conectado');
                    break;
                case 'generating_report':
                    setStatusText('Generando Reporte...');
                    // 📸 Capture 3 snapshots NOW — at the exact moment the report is being generated
                    // This freezes the relevant frames for the evidence gallery
                    snapshotsRef.current = [];
                    [0, 500, 1000].forEach((delay) => {
                        setTimeout(() => {
                            const snap = captureSnapshot();
                            if (snap) {
                                snapshotsRef.current.push(snap);
                                snapshotRef.current = snap;
                                console.log(`[LiveAnalysisModal] 📸 Report snapshot ${snapshotsRef.current.length}/3 at generating_report`);
                            }
                        }, delay);
                    });
                    break;
                case 'ready':
                    setStatusText('Listo');
                    break;
                case 'turn_complete':
                    // Only show completion if we actually got the report
                    if (hasReceivedReport) {
                        setStatusText('Análisis Completado');
                    } else {
                        setStatusText('Listo');
                    }
                    break;
                default:
                    setStatusText(newStatus);
            }
        },
        onError: (err: string) => {
            console.error('[LiveAnalysisModal] Error:', err);
            setStatusText(`Error: ${err}`);
        },
    }), [conversationId, onConversationIdUpdate, voiceLiveAnalysis, onTextReceived, onReportReceived, hasReceivedReport, selectedModel]);

    // Trigger toast ONLY when hasReceivedReport flips to true (not on every render)
    const prevHasReport = useRef(false);
    useEffect(() => {
        if (hasReceivedReport && !prevHasReport.current) {
            prevHasReport.current = true;
            setReportNotification(true);
            const timer = setTimeout(() => setReportNotification(false), 8000);
            return () => clearTimeout(timer);
        }
    }, [hasReceivedReport]);

    const {
        isConnected,
        isConnecting,
        status,
        connect,
        disconnect,
        sendVideoFrame,
        sendTextMessage,
        setMuted,
        changeVoice,
        getInputVolume,
    } = useLiveAnalysisSession(sessionOptions);

    // Connection Delay Logic with 10-second Countdown
    useEffect(() => {
        if (isOpen && isConnected) {
            setIsReady(false);
            setCountdown(10);
            snapshotsRef.current = [];

            const interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) return 1;
                    return prev - 1;
                });
            }, 1000);

            const timer = setTimeout(() => {
                setIsReady(true);
                clearInterval(interval);
            }, 10000);

            return () => {
                clearTimeout(timer);
                clearInterval(interval);
            };
        } else {
            setIsReady(false);
            setCountdown(10);
        }
    }, [isOpen, isConnected]);

    // Reset report state when modal is closed (to allow next session to show toast again)
    useEffect(() => {
        if (!isOpen) {
            prevHasReport.current = false;
            setHasReceivedReport(false);
            setReportNotification(false);
        }
    }, [isOpen]);

    // Sync visible state with Recoil for Tenshi hiding
    useEffect(() => {
        setShowModalState(isOpen);
    }, [isOpen, setShowModalState]);

    // Connect on mount if open
    useEffect(() => {
        if (!isOpen) return;

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        connect();

        return () => {
            stopMediaTracks();
            disconnect();
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, [isOpen]);

    // Ensure voice is updated when connected
    useEffect(() => {
        if (isOpen && isConnected && selectedVoice !== voiceLiveAnalysis) {
            console.log('[LiveAnalysisModal] Syncing voice with global setting:', voiceLiveAnalysis);
            setSelectedVoice(voiceLiveAnalysis);
            changeVoice(voiceLiveAnalysis);
        }
    }, [isOpen, isConnected, voiceLiveAnalysis, changeVoice]);

    // Auto-start camera and send initial prompt when READY (after countdown)
    useEffect(() => {
        if (isConnected && isOpen && isReady) {
            startCamera();

            const timer = setTimeout(() => {
                console.log("[LiveAnalysisModal] Sending initial analysis prompt");

                // Snapshots are captured at 'generating_report' status — not at startup
                // This ensures evidence photos match the actual report moment

                const currentDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

                sendTextMessage(`
                    Actúa como un Auditor Líder Experto en Seguridad y Salud en el Trabajo (SST/HSE) certificado.
                    
                    CONTEXTO:
                    Estás realizando una inspección técnica formal basada en la evidencia visual que estás viendo AHORA MISMO en el video.

                    TU MISIÓN:
                    Identificar peligros evidentes, evaluar actos inseguros y dar recomendaciones asertivas en tiempo real. 

                    INSTRUCCIONES DE RESPUESTA:
                    1. **ANÁLISIS INICIAL**: Inicia el análisis proactivamente AHORA MISMO basándote SÓLO en la imagen/video que captas. Comienza hablando de inmediato.
                    2. **ESTILO**: Háblame profesionalmente. Sé directo y táctico sobre los peligros críticos. 
                    3. **REPORTE (CRÍTICO)**: Cuando yo te pida generar el informe o reporte de la inspección, tu ÚNICA RESPUESTA debe ser EXACTAMENTE: "Entendido. Estoy procesando lo que vimos para generar el informe técnico detallado." 
                    NO generes el informe verbalmente ni en HTML. Solo di esa frase y el sistema en el backend se encargará de crearlo.
                `);
            }, 1000); // Short delay after ready

            return () => clearTimeout(timer);
        }
    }, [isConnected, isOpen, isReady, sendTextMessage, captureSnapshot]);

    const handleClose = () => {
        stopMediaTracks();
        disconnect();
        onClose();
    };

    const stopMediaTracks = () => {
        if (videoIntervalRef.current) {
            clearInterval(videoIntervalRef.current);
            videoIntervalRef.current = null;
        }

        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }

        setIsCameraOn(false);
        setIsScreenSharing(false);
    };

    const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
        try {
            stopMediaTracks(); // Ensure clean switch

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 320 },
                    height: { ideal: 240 },
                    frameRate: { ideal: 15 },
                    facingMode: mode
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => console.error("Error playing video:", e));
            }

            setIsCameraOn(true);
            startSendingFrames();

        } catch (error) {
            console.error('[LiveAnalysisModal] Error starting camera:', error);
            setStatusText('Error accessing camera');
            setIsCameraOn(false);
        }
    };

    const startScreenShare = async () => {
        try {
            stopMediaTracks(); // Ensure clean switch

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 10 }
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            // Handle user clicking "Stop Sharing" in browser UI
            stream.getVideoTracks()[0].onended = () => {
                stopMediaTracks();
            };

            setIsScreenSharing(true);
            startSendingFrames();

        } catch (error) {
            console.error('[LiveAnalysisModal] Error starting screen share:', error);
            setIsScreenSharing(false);
        }
    };

    const startSendingFrames = () => {
        if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = setInterval(() => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
                sendVideoFrame(videoRef.current);
            }
        }, 500); // Keep 2 FPS for analysis
    };


    const toggleCamera = () => {
        if (isCameraOn) {
            stopMediaTracks();
        } else {
            startCamera();
        }
    };

    const toggleScreenShare = () => {
        if (isScreenSharing) {
            stopMediaTracks();
        } else {
            startScreenShare();
        }
    };

    const switchCamera = () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        if (isCameraOn) {
            stopMediaTracks();
            setTimeout(() => startCamera(newMode), 200);
        }
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        setMuted(newMuted);
    };

    const nextStartTimeRef = useRef<number>(0);
    const outputAnalyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const updateAmplitude = () => {
            let vol = 0;

            if (status === 'speaking' && outputAnalyserRef.current) {
                const dataArray = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
                outputAnalyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                vol = Math.min(1, (average / 255) * 2);
            } else if (status === 'listening' || status === 'ready') {
                vol = getInputVolume();
            }

            setAudioAmplitude(vol);
            animationFrameRef.current = requestAnimationFrame(updateAmplitude);
        };

        updateAmplitude();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [status, getInputVolume]);

    function handleAudioReceived(audioData: string) {
        try {
            if (!audioContextRef.current) return;
            if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();

            const binaryString = atob(audioData);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

            const float32Data = new Float32Array(len / 2);
            const dataView = new DataView(bytes.buffer);
            for (let i = 0; i < len / 2; i++) float32Data[i] = dataView.getInt16(i * 2, true) / 32768.0;

            const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
            audioBuffer.getChannelData(0).set(float32Data);

            scheduleAudio(audioBuffer);
        } catch (error) {
            console.error('[LiveAnalysisModal] Error processing audio:', error);
        }
    }

    function scheduleAudio(buffer: AudioBuffer) {
        if (!audioContextRef.current) return;

        const currentTime = audioContextRef.current.currentTime;
        if (nextStartTimeRef.current < currentTime) {
            nextStartTimeRef.current = currentTime + 0.05;
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;

        if (!outputAnalyserRef.current) {
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 256;
            outputAnalyserRef.current = analyser;
            analyser.connect(audioContextRef.current.destination);
        }

        source.connect(outputAnalyserRef.current);
        source.start(nextStartTimeRef.current);

        nextStartTimeRef.current += buffer.duration;
    }

    const handleVoiceChange = (voiceId: string) => {
        setSelectedVoice(voiceId);
        changeVoice(voiceId);
        setShowVoiceSelector(false);
    };

    const handleOrbClick = () => {
        if (status === 'ready' || status === 'idle' || status === 'listening') {
            setShowVoiceSelector(!showVoiceSelector);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-300">
            {/* Main content - Fullscreen */}
            <div className="relative w-full h-full flex flex-col overflow-hidden">

                {/* Technical Loading Overlay - Hud Style */}
                {(!isReady && isOpen) && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95">
                        <div className="relative">
                            {/* Circular progress background */}
                            <svg className="w-64 h-64 -rotate-90 transform">
                                <circle
                                    cx="128"
                                    cy="128"
                                    r="120"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="transparent"
                                    className="text-white/5"
                                />
                                <circle
                                    cx="128"
                                    cy="128"
                                    r="120"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray={754}
                                    strokeDashoffset={754 - (754 * (10 - countdown) / 10)}
                                    className="text-teal-500 transition-all duration-1000 ease-linear"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-7xl font-mono font-bold text-white tracking-tighter">
                                    00:{countdown.toString().padStart(2, '0')}
                                </span>
                                <span className="text-[10px] text-teal-400 font-mono mt-2 tracking-[0.3em] uppercase opacity-80 animate-pulse">
                                    Initializing Stream
                                </span>
                            </div>
                        </div>

                        <div className="mt-12 w-64 space-y-4">
                            <div className="flex justify-between text-[10px] text-white/40 font-mono uppercase tracking-widest">
                                <span>Securing Channel</span>
                                <span>{Math.round((10 - countdown) * 10)}%</span>
                            </div>
                            <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-teal-500 transition-all duration-1000 ease-linear"
                                    style={{ width: `${(10 - countdown) * 10}%` }}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                                <p className="text-[9px] text-teal-500/60 font-mono truncate animate-[pulse_2s_infinite]">
                                    {'>'} ACCESS_KEY: ENABLED
                                </p>
                                <p className="text-[9px] text-teal-500/60 font-mono truncate animate-[pulse_2.5s_infinite]">
                                    {'>'} ENCRYPTION_LAYER: 256-BIT_AES
                                </p>
                                <p className="text-[9px] text-teal-500/60 font-mono truncate animate-[pulse_3s_infinite]">
                                    {'>'} AUDIT_PROCOCOL: SST_v3.4
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* HUD Overlay - Top Elements */}
                <div className="absolute top-0 left-0 p-6 flex flex-col items-start gap-4 z-40 pointer-events-none w-full max-w-[250px]">
                    {/* Top Group 1: LIVE Indicator & Setup */}
                    <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center justify-between bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-[12px] border border-white/5 shadow-xl w-full">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                </span>
                                <span className="text-[11px] font-bold text-white uppercase tracking-wider">LIVE</span>
                            </div>
                            <div className="w-[1px] h-3 bg-white/20"></div>
                            <div className="text-[11px] font-mono text-white/70">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                        </div>

                        <div className="flex flex-col px-2">
                            <h2 className="text-white text-sm font-bold tracking-wide flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.6)]"></span>
                                <span className="truncate uppercase drop-shadow-md">ASISTENTE SST</span>
                            </h2>
                            {countdown > 0 && !isReady && (
                                <p className="text-white/60 text-[10px] font-mono tracking-widest uppercase mt-0.5">
                                    {countdown} SECONDS REMAINING
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Top Group 2: Call Info & Status */}
                    <div className="flex flex-col items-start gap-1 w-full">
                        <div className="bg-black/20 backdrop-blur-md px-3 py-2 rounded-[12px] border border-white/5 shadow-xl flex flex-col items-start gap-1 w-full">
                            <div className="flex justify-between items-center w-full">
                                <span className="text-[10px] text-white/60 font-mono tracking-widest">MODEL:</span>
                                <span className="text-[10px] text-white/80 font-mono uppercase tracking-widest">{selectedModel?.split('-')[0] || 'GEMINI'}</span>
                            </div>
                            <div className="text-[10px] text-teal-400 font-mono uppercase tracking-widest font-bold self-end drop-shadow-sm">
                                {statusText === 'Conectando...' ? 'CONNECTING...' : 
                                 statusText === 'Generando Reporte...' ? 'GENERATING REPORT...' :
                                 (isConnected ? 'CONNECTED' : 'DISCONNECTED')}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-white/60 ml-2 mt-0.5">
                            <Monitor className="w-3 h-3" />
                            <span className="text-[10px] font-mono tracking-widest uppercase">VOICE / 16KHz</span>
                        </div>
                    </div>
                </div>

                {/* Video Preview (Main Focus) */}
                <div className="absolute inset-0 z-0 overflow-hidden bg-surface-primary">
                    <video
                        ref={videoRef}
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${isCameraOn || isScreenSharing ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-xl'}`}
                        muted
                        playsInline
                    />
                    
                    {/* Video Effects Overlays */}
                    {(isCameraOn || isScreenSharing) && (
                        <>
                            {/* CRT/Scanline pattern */}
                            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,118,0.02))] bg-[length:100%_2px,3px_100%] opacity-20"></div>
                            
                            {/* Vignette */}
                            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]"></div>

                            {/* Camera Corners/Focus Brackets */}
                            <div className="absolute top-12 left-12 w-8 h-8 border-t-2 border-l-2 border-white/40 rounded-tl-sm pointer-events-none"></div>
                            <div className="absolute top-12 right-12 w-8 h-8 border-t-2 border-r-2 border-white/40 rounded-tr-sm pointer-events-none"></div>
                            <div className="absolute bottom-32 left-12 w-8 h-8 border-b-2 border-l-2 border-white/40 rounded-bl-sm pointer-events-none"></div>
                            <div className="absolute bottom-32 right-12 w-8 h-8 border-b-2 border-r-2 border-white/40 rounded-br-sm pointer-events-none"></div>

                            {/* Thinking Scanner Effect */}
                            {status === 'thinking' && (
                                <div className="absolute top-0 left-0 w-full h-1 bg-teal-400/50 shadow-[0_0_15px_rgba(45,212,191,0.8)] z-10 animate-[scan_2s_ease-in-out_infinite] pointer-events-none"></div>
                            )}
                        </>
                    )}
                </div>

                {/* Voice Orb & Floating UI */}
                <div className="flex-1 flex flex-col items-center justify-center z-10 relative">
                    <div 
                        onClick={handleOrbClick} 
                        className={`cursor-pointer transition-all duration-500 transform ${status === 'speaking' ? 'scale-110' : 'scale-100'}`}
                    >
                        <VoiceOrb
                            status={status === 'ready' ? 'idle' : status}
                            amplitude={audioAmplitude}
                            className="drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                        />
                    </div>
                    
                    {/* Localize Status Description */}
                    <p className="mt-8 text-white/40 text-[10px] font-mono tracking-[0.5em] uppercase select-none">
                        {status === 'speaking' ? 'AI Voice Active' : status === 'listening' ? 'Analyzing Audio' : 'Secure Channel Idle'}
                    </p>

                    {showVoiceSelector && (
                        <div className="absolute top-full mt-8 bg-surface-primary border border-white/10 rounded-xl shadow-2xl p-2 min-w-[200px] z-50 overflow-hidden">
                            <div className="px-3 py-2 border-b border-light/10 text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">
                                Select System Voice
                            </div>
                            <VoiceSelector
                                selectedVoice={selectedVoice}
                                onVoiceChange={handleVoiceChange}
                            />
                        </div>
                    )}
                </div>

                {/* Bottom Main Interaction Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-30 flex flex-col items-center gap-6">
                    
                    {/* Control Bar - Premium Glassmorphism */}
                    <div className="flex items-center justify-center gap-2 md:gap-4 bg-black/60 backdrop-blur-2xl px-4 md:px-8 py-3 md:py-5 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 shadow-2xl transition-all hover:bg-black/70 group">
                        
                        {/* Camera Toggle */}
                        <TooltipAnchor
                            description={isCameraOn ? localize('com_ui_voice_camera_off') : localize('com_ui_voice_camera_on')}
                            render={
                                <button
                                    onClick={toggleCamera}
                                    disabled={isScreenSharing}
                                    className={`p-4 rounded-full transition-all duration-300 transform active:scale-95 ${isCameraOn
                                        ? 'bg-white text-black shadow-lg shadow-white/20'
                                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                        } ${isScreenSharing ? 'opacity-20 cursor-not-allowed' : ''}`}
                                >
                                    {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                                </button>
                            }
                        />

                        {/* Camera Switch */}
                        {isCameraOn && (
                            <TooltipAnchor
                                description={localize('com_ui_switch_camera')}
                                render={
                                    <button
                                        onClick={switchCamera}
                                        className="p-4 rounded-full bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 border border-amber-500/30 transition-all transform active:rotate-180 duration-500 shadow-md shadow-amber-900/20"
                                    >
                                        <RefreshCcw className="w-5 h-5" />
                                    </button>
                                }
                            />
                        )}

                        <div className="w-[1px] h-8 bg-white/10 mx-2"></div>

                        {/* Microphone Toggle (Center Piece) */}
                        <TooltipAnchor
                            description={isMuted ? localize('com_nav_voice_unmute') : localize('com_nav_voice_mute')}
                            render={
                                <button
                                    onClick={toggleMute}
                                    className={`p-5 rounded-full transition-all duration-500 transform active:scale-90 ${isMuted
                                        ? 'bg-red-500/20 text-red-500 border border-red-500/50 backdrop-blur-md'
                                        : 'bg-white text-black shadow-xl shadow-white/10 scale-110 border-4 border-white'
                                        }`}
                                >
                                    {isMuted ? <MicOff className="w-7 h-7" /> : (
                                        <div className="relative">
                                            <Mic className="w-7 h-7" />
                                            {status === 'listening' && (
                                                <span className="absolute -top-3 -right-3 flex h-4 w-4">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500"></span>
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            }
                        />

                        <div className="w-[1px] h-8 bg-white/10 mx-2"></div>

                        {/* Screen Share Toggle */}
                        {supportsScreenShare && (
                            <TooltipAnchor
                                description={isScreenSharing ? localize('com_ui_voice_screen_share_stop') : localize('com_ui_voice_screen_share_start')}
                                render={
                                    <button
                                        onClick={toggleScreenShare}
                                        disabled={isCameraOn}
                                        className={`p-4 rounded-full transition-all duration-300 transform active:scale-95 ${isScreenSharing
                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 border border-blue-400/30'
                                            : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'
                                            } ${isCameraOn ? 'opacity-20 cursor-not-allowed' : ''}`}
                                    >
                                        {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                                    </button>
                                }
                            />
                        )}

                        {/* End Call Button */}
                        <TooltipAnchor
                            description={localize('com_ui_voice_end_call')}
                            render={
                                <button
                                    onClick={handleClose}
                                    className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all duration-300 transform hover:scale-110 active:scale-95 border border-red-400/20"
                                >
                                    <PhoneOff className="w-5 h-5" />
                                </button>
                            }
                        />
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center gap-6 text-[9px] font-mono text-white/30 uppercase tracking-[0.4em] pointer-events-none">
                        <span>Encrypted Protocol SSL-V3</span>
                        <span>•</span>
                        <span>Forensic SST Audit Mode</span>
                        <span>•</span>
                        <span>Biometric Link Active</span>
                    </div>

                    {/* Report Completion Toast */}
                    {reportNotification && (
                        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl shadow-emerald-900/40 border border-emerald-400/30 animate-in slide-in-from-bottom-4 fade-in duration-500">
                            <span className="text-xl">✅</span>
                            <div>
                                <div className="font-bold text-sm">¡Informe Generado!</div>
                                <div className="text-xs text-emerald-100">El informe técnico ha sido enviado al editor.</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Additional CSS Animations */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes scan {
                        0% { top: 0; opacity: 0; }
                        5% { opacity: 1; }
                        95% { opacity: 1; }
                        100% { top: 100%; opacity: 0; }
                    }
                    @keyframes pulse-soft {
                        0%, 100% { opacity: 0.4; }
                        50% { opacity: 1; }
                    }
                `}} />
            </div>
        </div>
    );
};

export default LiveAnalysisModal;
