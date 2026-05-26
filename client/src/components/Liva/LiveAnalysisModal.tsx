import { useState, useEffect, useCallback, useRef, useMemo, type FC } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { X, Mic, MicOff, Video, VideoOff, RefreshCcw, Monitor, MonitorOff, PhoneOff, Smartphone, Camera } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import store from '~/store';
import VoiceOrb from '../Voice/VoiceOrb';
import VoiceSelector from '../Voice/VoiceSelector';
import { useLiveAnalysisSession } from '~/hooks/useLiveAnalysisSession';
import { useLocalize } from '~/hooks';

declare global {
    interface Window {
        Pose: any;
        drawConnectors: any;
        drawLandmarks: any;
        POSE_CONNECTIONS: any;
    }
}

const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
    });
};

interface LiveAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId?: string;
    onConversationIdUpdate?: (newId: string) => void;
    onTextReceived?: (text: string) => void;
    onReportReceived?: (html: string, kpi?: any, messageId?: string) => void;
    onConversationUpdated?: () => void;
    selectedModel?: string;
}

const LiveAnalysisModal: FC<LiveAnalysisModalProps> = ({ isOpen, onClose, conversationId, onConversationIdUpdate, onTextReceived, onReportReceived, onConversationUpdated, selectedModel }) => {
    const localize = useLocalize();
    const [neckAngle, setNeckAngle] = useState<number | null>(null);
    const [trunkAngle, setTrunkAngle] = useState<number | null>(null);
    const [armAngle, setArmAngle] = useState<number | null>(null);
    const [isMediaPipeLoaded, setIsMediaPipeLoaded] = useState(false);
    const [isPoseActive, setIsPoseActive] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const poseRef = useRef<any>(null);
    const badPostureStartRef = useRef<number | null>(null);
    const lastSnapshotTimeRef = useRef<number>(0);

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

    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [manualCapturedPhotos, setManualCapturedPhotos] = useState<string[]>([]);
    const [isFlashActive, setIsFlashActive] = useState(false);

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

    // Audio Refs
    const nextStartTimeRef = useRef<number>(0);
    const outputAnalyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Toast control Ref
    const prevHasReport = useRef(false);

    // ==================== HELPER FUNCTIONS & CALLBACKS ====================

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

    const scheduleAudio = useCallback((buffer: AudioBuffer) => {
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
    }, []);

    const handleAudioReceived = useCallback((audioData: string) => {
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
    }, [scheduleAudio]);

    const sessionOptions = useMemo(() => ({
        conversationId,
        onConversationIdUpdate,
        disableAudio: false,
        initialVoice: voiceLiveAnalysis,
        selectedModel,
        template: selectedTemplate || 'general',
        onAudioReceived: (audioData: string) => {
            handleAudioReceived(audioData);
        },
        onTextReceived: (text: string) => {
            onTextReceived?.(text);
        },
        onReportReceived: (html: string, messageId?: string, evaluatedFrames?: string[]) => {
            setHasReceivedReport(true); // Toast is triggered by useEffect watching this

            const dateStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = new Date().toLocaleTimeString('es-ES');
            
            // Prefer the EXACT frames the AI evaluated. Provide the base64 prefix so the <img> tag works.
            let snapshots = snapshotsRef.current;
            if (evaluatedFrames && evaluatedFrames.length > 0) {
                // Backend sends raw base64. Frontend needs the data URL scheme to render in <img>
                snapshots = evaluatedFrames.map(b64 => `data:image/jpeg;base64,${b64}`);
            }

            // Build evidence gallery (up to 4 images if backend evaluated them)
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

            onReportReceived?.(finalHtml, kpi, messageId);

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
    }), [conversationId, onConversationIdUpdate, voiceLiveAnalysis, onTextReceived, onReportReceived, hasReceivedReport, selectedModel, selectedTemplate, handleAudioReceived, captureSnapshot]);

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
        sendEvidenceImage,
    } = useLiveAnalysisSession(sessionOptions);

    const onPoseResults = useCallback((results: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!results.poseLandmarks) return;

        // 1. Draw glowing neon HUD skeleton
        ctx.save();
        
        // Neon cyan connections glow
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        if (window.drawConnectors && window.POSE_CONNECTIONS) {
            window.drawConnectors(ctx, results.poseLandmarks, window.POSE_CONNECTIONS, {
                color: '#06b6d4',
                lineWidth: 3
            });
        }

        // Neon emerald joints glow
        ctx.shadowColor = '#10b981';
        if (window.drawLandmarks) {
            window.drawLandmarks(ctx, results.poseLandmarks, {
                color: '#10b981',
                fillColor: '#06b6d4',
                lineWidth: 2,
                radius: 4
            });
        }
        ctx.restore();

        // 2. Ergo calculations (cervical and trunk angles)
        const landmarks = results.poseLandmarks;
        const leftEar = landmarks[7];
        const rightEar = landmarks[8];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftElbow = landmarks[13];
        const rightElbow = landmarks[14];

        // Side visibility check
        const leftVisible = (leftEar?.visibility ?? 0) > 0.5 && (leftShoulder?.visibility ?? 0) > 0.5 && (leftHip?.visibility ?? 0) > 0.5;
        const rightVisible = (rightEar?.visibility ?? 0) > 0.5 && (rightShoulder?.visibility ?? 0) > 0.5 && (rightHip?.visibility ?? 0) > 0.5;

        let activeEar = null;
        let activeShoulder = null;
        let activeHip = null;
        let activeElbow = null;

        if (leftVisible && (!rightVisible || (leftShoulder.visibility ?? 0) > (rightShoulder.visibility ?? 0))) {
            activeEar = leftEar;
            activeShoulder = leftShoulder;
            activeHip = leftHip;
            activeElbow = leftElbow;
        } else if (rightVisible) {
            activeEar = rightEar;
            activeShoulder = rightShoulder;
            activeHip = rightHip;
            activeElbow = rightElbow;
        } else {
            activeEar = leftEar || rightEar;
            activeShoulder = leftShoulder || rightShoulder;
            activeHip = leftHip || rightHip;
            activeElbow = leftElbow || rightElbow;
        }

        if (activeShoulder && activeEar && activeHip) {
            // Cervical angle (flexion from vertical)
            const neckDx = activeShoulder.x - activeEar.x;
            const neckDy = activeShoulder.y - activeEar.y;
            const neckRad = Math.atan2(Math.abs(neckDx), Math.abs(neckDy));
            const neckDeg = Math.round(neckRad * (180 / Math.PI));

            // Trunk angle (flexion from vertical)
            const trunkDx = activeShoulder.x - activeHip.x;
            const trunkDy = activeHip.y - activeShoulder.y;
            const trunkRad = Math.atan2(Math.abs(trunkDx), Math.abs(trunkDy));
            const trunkDeg = Math.round(trunkRad * (180 / Math.PI));

            setNeckAngle(neckDeg);
            setTrunkAngle(trunkDeg);

            // Arm angle (abduction from spine)
            let armDeg = 0;
            if (activeElbow) {
                const v1 = { x: activeHip.x - activeShoulder.x, y: activeHip.y - activeShoulder.y };
                const v2 = { x: activeElbow.x - activeShoulder.x, y: activeElbow.y - activeShoulder.y };
                const dot = v1.x * v2.x + v1.y * v2.y;
                const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
                const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
                if (mag1 * mag2 > 0) {
                    const cosAngle = dot / (mag1 * mag2);
                    armDeg = Math.round(Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI));
                }
            }
            setArmAngle(armDeg);

            // Posture threshold tracking for Auto-Snapshot
            const now = Date.now();
            if (neckDeg > 20 || trunkDeg > 20) {
                if (badPostureStartRef.current === null) {
                    badPostureStartRef.current = now;
                } else {
                    const duration = now - badPostureStartRef.current;
                    if (duration >= 3000) { // 3 seconds of sustained bad posture
                        if (now - lastSnapshotTimeRef.current >= 15000) { // 15 seconds cooldown
                            lastSnapshotTimeRef.current = now;
                            badPostureStartRef.current = null; // reset
                            
                            // Capture snapshot
                            const dataUrl = captureSnapshot();
                            if (dataUrl) {
                                // Trigger flash
                                setIsFlashActive(true);
                                setTimeout(() => setIsFlashActive(false), 150);

                                setManualCapturedPhotos((prev) => [...prev, dataUrl]);

                                const base64 = dataUrl.split(',')[1];
                                sendEvidenceImage(base64);

                                // Send telemetry data directly to Gemini session!
                                sendTextMessage(`[Auto-Alerta Biomecánica] Se ha capturado una evidencia de postura ergonómica crítica sostenida. Telemetría detectada: Flexión Cervical ${neckDeg}°, Flexión de Tronco ${trunkDeg}°, Abducción de Brazo ${armDeg}°. Por favor, audita este riesgo ergonómico cuantitativo en el informe técnico.`);
                            }
                        }
                    }
                }
            } else {
                badPostureStartRef.current = null;
            }
        }
    }, [captureSnapshot, sendEvidenceImage, sendTextMessage]);

    // ==================== CONTROLLER HELPER FUNCTIONS ====================

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

    const startSendingFrames = () => {
        if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = setInterval(() => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
                sendVideoFrame(videoRef.current);
            }
        }, 500); // Keep 2 FPS for analysis
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

    const handleManualCapture = useCallback(() => {
        const dataUrl = captureSnapshot();
        if (!dataUrl) return;

        // Trigger visual flash
        setIsFlashActive(true);
        setTimeout(() => setIsFlashActive(false), 150);

        // Save locally for carousel
        setManualCapturedPhotos((prev) => [...prev, dataUrl]);

        // Send to backend via WS (extract base64 payload from data URL)
        const base64 = dataUrl.split(',')[1];
        sendEvidenceImage(base64);
    }, [captureSnapshot, sendEvidenceImage]);

    const handleClose = () => {
        stopMediaTracks();
        disconnect();
        setSelectedTemplate(null);
        setManualCapturedPhotos([]);
        onClose();
    };

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

    // ==================== EFFECTS (REACT LIFE CYCLE) ====================

    useEffect(() => {
        // Check if getDisplayMedia is supported
        if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
            setSupportsScreenShare(true);
        }
    }, []);

    // Load MediaPipe scripts on demand when 'biomecanico_mediapipe' is selected
    useEffect(() => {
        if (!isOpen || selectedTemplate !== 'biomecanico_mediapipe') return;

        let active = true;
        console.log('[LiveAnalysisModal] selectedTemplate is biomecanico_mediapipe. Loading MediaPipe...');
        setStatusText('Loading MediaPipe Pose...');

        const loadAll = async () => {
            try {
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
                
                if (active) {
                    console.log('[LiveAnalysisModal] MediaPipe Pose successfully loaded!');
                    setIsMediaPipeLoaded(true);
                    setStatusText('MediaPipe Ready');
                }
            } catch (err) {
                console.error('[LiveAnalysisModal] Error loading MediaPipe Pose scripts:', err);
                if (active) {
                    setStatusText('MediaPipe Load Error');
                }
            }
        };

        loadAll();

        return () => {
            active = false;
        };
    }, [isOpen, selectedTemplate]);

    // Initialize and handle MediaPipe Pose instance
    useEffect(() => {
        if (!isMediaPipeLoaded || !isCameraOn || selectedTemplate !== 'biomecanico_mediapipe') {
            if (poseRef.current) {
                try {
                    poseRef.current.close();
                } catch (e) {
                    console.error('Error closing poseRef:', e);
                }
                poseRef.current = null;
            }
            setIsPoseActive(false);
            return;
        }

        console.log('[LiveAnalysisModal] Initializing MediaPipe Pose instance...');
        
        try {
            const pose = new window.Pose({
                locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
            });

            pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            pose.onResults((results: any) => {
                onPoseResults(results);
            });

            poseRef.current = pose;
            setIsPoseActive(true);
            console.log('[LiveAnalysisModal] Pose instance ready!');
        } catch (e) {
            console.error('Error creating Pose instance:', e);
        }

        return () => {
            if (poseRef.current) {
                try {
                    poseRef.current.close();
                } catch (e) {
                    console.error('Error closing poseRef on cleanup:', e);
                }
                poseRef.current = null;
            }
            setIsPoseActive(false);
        };
    }, [isMediaPipeLoaded, isCameraOn, selectedTemplate, onPoseResults]);

    // Process frames at 15 FPS
    useEffect(() => {
        if (!isPoseActive || !videoRef.current) return;

        let active = true;
        let lastFrameTime = 0;
        const fpsInterval = 1000 / 15; // Limit to 15 FPS

        const poseLoop = async () => {
            if (!active) return;

            const now = Date.now();
            const elapsed = now - lastFrameTime;

            if (elapsed >= fpsInterval) {
                lastFrameTime = now - (elapsed % fpsInterval);

                const video = videoRef.current;
                if (video && video.readyState >= 2 && poseRef.current) {
                    const canvas = canvasRef.current;
                    if (canvas && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                    }

                    try {
                        await poseRef.current.send({ image: video });
                    } catch (e) {
                        console.error('[LiveAnalysisModal] Pose send error:', e);
                    }
                }
            }

            requestAnimationFrame(poseLoop);
        };

        requestAnimationFrame(poseLoop);

        return () => {
            active = false;
        };
    }, [isPoseActive]);

    // Amplitude meter updating audioAmplitude
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

    // Trigger toast ONLY when hasReceivedReport flips to true (not on every render)
    useEffect(() => {
        if (hasReceivedReport && !prevHasReport.current) {
            prevHasReport.current = true;
            setReportNotification(true);
            const timer = setTimeout(() => setReportNotification(false), 8000);
            return () => clearTimeout(timer);
        }
    }, [hasReceivedReport]);

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

    // Connect on mount if open and template selected
    useEffect(() => {
        if (!isOpen || !selectedTemplate) return;

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
    }, [isOpen, selectedTemplate]);

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

                let templateGuide = "";
                if (selectedTemplate === 'alturas') {
                    templateGuide = "Tu enfoque de auditoría hoy es TRABAJO EN ALTURAS. Guíame a través de la revisión del arnés, los puntos de anclaje, líneas de vida y conectores.";
                } else if (selectedTemplate === 'eléctrico') {
                    templateGuide = "Tu enfoque de auditoría hoy es RIESGO ELÉCTRICO. Guíame a través del estado de tableros eléctricos, cableado expuesto y el protocolo LOTO (bloqueo/etiquetado).";
                } else if (selectedTemplate === '5s') {
                    templateGuide = "Tu enfoque de auditoría hoy es ORDEN Y ASEO (METODOLOGÍA 5S). Guíame a través de la clasificación, el orden, la limpieza, estandarización y disciplina del área.";
                } else if (selectedTemplate === 'biomecanico_estandar') {
                    templateGuide = "Tu enfoque de auditoría hoy es RIESGO BIOMECÁNICO CUALITATIVO (GTC 45 / ERGONOMÍA). Guíame a través de la evaluación de posturas prolongadas, levantamiento manual de cargas, movimientos repetitivos y disponibilidad de puestos ergonómicos.";
                } else if (selectedTemplate === 'biomecanico_mediapipe') {
                    templateGuide = "Tu enfoque de auditoría hoy es RIESGO BIOMECÁNICO CUANTITATIVO CON MEDIAPIPE (RULA / REBA). Guíame interpretando los datos cuantitativos de telemetría articular (ángulos del cuello y del tronco) que te enviaré en tiempo real y que se muestran en mi pantalla.";
                } else {
                    templateGuide = "Tu enfoque de auditoría hoy es INSPECCIÓN GENERAL DE SEGURIDAD INDUSTRIAL (ISO 45001 / GTC 45). Guíame de manera general para auditar el área de trabajo.";
                }

                sendTextMessage(`
                    Actúa como un Auditor Líder Experto en Seguridad y Salud en el Trabajo (SST/HSE) certificado.
                    
                    CONTEXTO:
                    Estás realizando una inspección técnica formal basada en la evidencia visual que estás viendo AHORA MISMO en el video.
                    ${templateGuide}

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
    }, [isConnected, isOpen, isReady, sendTextMessage, captureSnapshot, selectedTemplate]);

    if (!isOpen) return null;

    if (!selectedTemplate) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50/98 backdrop-blur-md transition-all duration-300">
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
                    {/* Wappy Design Light BG Gradients */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-slate-100/50 via-white to-teal-50/30 opacity-70"></div>
                    
                    {/* Top Close Button */}
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-3 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all z-50 shadow-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content Container */}
                    <div className="relative z-10 max-w-4xl w-full flex flex-col items-center gap-8 my-auto">
                        <div className="text-center space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-mono uppercase tracking-[0.2em] shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                HSE Command Center
                            </div>
                            <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-teal-900 to-slate-950 tracking-tight pb-1 drop-shadow-sm">
                                ANÁLISIS EN VIVO
                            </h1>
                            <p className="text-slate-600 text-sm md:text-base max-w-lg mx-auto font-medium">
                                Seleccione una plantilla de inspección técnica especializada. La IA adaptará sus directrices y su enfoque en tiempo real.
                            </p>
                        </div>

                        {/* Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">
                            {/* Card 1: General */}
                            <div 
                                onClick={() => setSelectedTemplate('general')}
                                className="group relative cursor-pointer bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-emerald-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(16,185,129,0.08)] flex flex-col justify-between min-h-[180px]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex justify-between items-start z-10">
                                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform shadow-sm">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded">ISO 45001</span>
                                </div>
                                <div className="mt-4 z-10">
                                    <h3 className="text-slate-800 text-lg font-bold group-hover:text-emerald-600 transition-colors">Inspección General</h3>
                                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">Evaluación amplia de orden, aseo, señalización, ergonomía y condiciones de seguridad industrial estándar.</p>
                                </div>
                            </div>

                            {/* Card 2: Alturas */}
                            <div 
                                onClick={() => setSelectedTemplate('alturas')}
                                className="group relative cursor-pointer bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-cyan-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(6,182,212,0.08)] flex flex-col justify-between min-h-[180px]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex justify-between items-start z-10">
                                    <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-xl text-cyan-600 group-hover:scale-110 transition-transform shadow-sm">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded">SST ALTURA</span>
                                </div>
                                <div className="mt-4 z-10">
                                    <h3 className="text-slate-800 text-lg font-bold group-hover:text-cyan-600 transition-colors">Trabajo en Alturas</h3>
                                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">Enfoque arneses, líneas de vida, puntos de anclaje, conectores y estado de plataformas de elevación.</p>
                                </div>
                            </div>

                            {/* Card 3: Eléctrico */}
                            <div 
                                onClick={() => setSelectedTemplate('eléctrico')}
                                className="group relative cursor-pointer bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-amber-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(245,158,11,0.08)] flex flex-col justify-between min-h-[180px]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex justify-between items-start z-10">
                                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-600 group-hover:scale-110 transition-transform shadow-sm">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded">LOTO / ENERGÍA</span>
                                </div>
                                <div className="mt-4 z-10">
                                    <h3 className="text-slate-800 text-lg font-bold group-hover:text-amber-600 transition-colors">Riesgo Eléctrico</h3>
                                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">Tableros eléctricos, cableado expuesto, bloqueo y etiquetado (LOTO) y EPP dieléctrico.</p>
                                </div>
                            </div>

                            {/* Card 4: 5S */}
                            <div 
                                onClick={() => setSelectedTemplate('5s')}
                                className="group relative cursor-pointer bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-teal-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(20,184,166,0.08)] flex flex-col justify-between min-h-[180px]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex justify-between items-start z-10">
                                    <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl text-teal-600 group-hover:scale-110 transition-transform shadow-sm">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded">ORDEN & ASEO</span>
                                </div>
                                <div className="mt-4 z-10">
                                    <h3 className="text-slate-800 text-lg font-bold group-hover:text-teal-600 transition-colors">Metodología 5S</h3>
                                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">Clasificación, orden, limpieza, estandarización y disciplina en plantas, almacenes y áreas de trabajo.</p>
                                </div>
                            </div>

                            {/* Card 5: Biomecánico Estándar */}
                            <div 
                                onClick={() => setSelectedTemplate('biomecanico_estandar')}
                                className="group relative cursor-pointer bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-purple-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(168,85,247,0.08)] flex flex-col justify-between min-h-[180px]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex justify-between items-start z-10">
                                    <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-600 group-hover:scale-110 transition-transform shadow-sm">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded">GTC 45 ERGO</span>
                                </div>
                                <div className="mt-4 z-10">
                                    <h3 className="text-slate-800 text-lg font-bold group-hover:text-purple-600 transition-colors">Riesgo Biomecánico</h3>
                                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">Evaluación cualitativa de posturas, movimientos repetitivos, manejo de cargas y puestos de trabajo ergonómicos.</p>
                                </div>
                            </div>

                            {/* Card 6: Biomecánico MediaPipe */}
                            <div 
                                onClick={() => setSelectedTemplate('biomecanico_mediapipe')}
                                className="group relative cursor-pointer bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-cyan-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(6,182,212,0.12)] flex flex-col justify-between min-h-[180px]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex justify-between items-start z-10">
                                    <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-xl text-cyan-600 group-hover:scale-110 transition-transform shadow-sm">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded">MEDIAPIPE POSE</span>
                                </div>
                                <div className="mt-4 z-10">
                                    <h3 className="text-slate-800 text-lg font-bold group-hover:text-cyan-600 transition-colors">Biomecánico (MediaPipe)</h3>
                                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">Evaluación cuantitativa en tiempo real con esqueleto digital fluorescente, medición de ángulos cervical y tronco en vivo.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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

                {selectedTemplate === 'biomecanico_mediapipe' && isReady && (
                    <div className="absolute top-6 right-6 z-40 w-80 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-white pointer-events-auto">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.6)]"></span>
                                <h3 className="font-mono text-xs font-bold uppercase tracking-wider">Telemetría de Pose</h3>
                            </div>
                            <span className="text-[9px] font-mono text-white/40 uppercase">GTC 45 / RULA</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {/* Cuello Box */}
                            <div className={`p-3 rounded-xl border transition-all duration-300 ${
                                neckAngle !== null && neckAngle > 20 
                                    ? 'bg-red-500/20 border-red-500/50 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                                    : 'bg-white/5 border-white/10 text-white/90'
                            }`}>
                                <div className="text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1">Cervical (Cuello)</div>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl font-mono font-black ${
                                        neckAngle !== null && neckAngle > 20 ? 'text-red-400 animate-pulse' : 'text-cyan-400'
                                    }`}>
                                        {neckAngle !== null ? `${neckAngle}°` : '--'}
                                    </span>
                                    <span className="text-[9px] uppercase font-bold">
                                        {neckAngle !== null && neckAngle > 20 ? 'Alerta' : 'Normal'}
                                    </span>
                                </div>
                                <div className="h-1 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-300 ${
                                            neckAngle !== null && neckAngle > 20 ? 'bg-red-500' : 'bg-cyan-500'
                                        }`}
                                        style={{ width: `${neckAngle !== null ? Math.min(100, (neckAngle / 90) * 100) : 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Tronco Box */}
                            <div className={`p-3 rounded-xl border transition-all duration-300 ${
                                trunkAngle !== null && trunkAngle > 20 
                                    ? 'bg-red-500/20 border-red-500/50 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                                    : 'bg-white/5 border-white/10 text-white/90'
                            }`}>
                                <div className="text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1">Columna (Tronco)</div>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl font-mono font-black ${
                                        trunkAngle !== null && trunkAngle > 20 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                                    }`}>
                                        {trunkAngle !== null ? `${trunkAngle}°` : '--'}
                                    </span>
                                    <span className="text-[9px] uppercase font-bold">
                                        {trunkAngle !== null && trunkAngle > 20 ? 'Riesgo' : 'Seguro'}
                                    </span>
                                </div>
                                <div className="h-1 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-300 ${
                                            trunkAngle !== null && trunkAngle > 20 ? 'bg-red-500' : 'bg-emerald-500'
                                        }`}
                                        style={{ width: `${trunkAngle !== null ? Math.min(100, (trunkAngle / 90) * 100) : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Arm Abduction Box */}
                        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                            <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1">
                                <span>Abducción de Brazos</span>
                                <span className="text-cyan-300 font-bold">{armAngle !== null ? `${armAngle}°` : '--'}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                                    style={{ width: `${armAngle !== null ? Math.min(100, (armAngle / 180) * 100) : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Warnings Alert Box */}
                        {(neckAngle !== null && neckAngle > 20) || (trunkAngle !== null && trunkAngle > 20) ? (
                            <div className="bg-red-500/20 border border-red-500/40 px-3 py-2 rounded-xl flex items-center gap-2 text-red-200 text-xs font-semibold animate-pulse">
                                <span>⚠️</span>
                                <span>¡Postura Crítica Detectada! Grabando evidencia...</span>
                            </div>
                        ) : (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                                <span>Posturas seguras bajo el estándar RULA</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Video Preview (Main Focus) */}
                <div className="absolute inset-0 z-0 overflow-hidden bg-surface-primary">
                    <video
                        ref={videoRef}
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${isCameraOn || isScreenSharing ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-xl'}`}
                        muted
                        playsInline
                    />
                    <canvas
                        ref={canvasRef}
                        className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-500 z-10 ${
                            selectedTemplate === 'biomecanico_mediapipe' && isCameraOn ? 'opacity-100' : 'opacity-0'
                        }`}
                    />
                    
                    {/* Camera Flash Overlay */}
                    {isFlashActive && (
                        <div className="absolute inset-0 bg-white z-20 pointer-events-none animate-flash"></div>
                    )}
                    
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
                    
                    {/* Floating Thumbnail Carousel of captured evidence */}
                    {manualCapturedPhotos.length > 0 && (
                        <div className="flex flex-col items-center gap-2 max-w-full px-4 animate-in slide-in-from-bottom-2 duration-300">
                            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded shadow">
                                Evidencia Capturada ({manualCapturedPhotos.length})
                            </span>
                            <div className="flex items-center gap-2 overflow-x-auto max-w-[90vw] pb-2 scrollbar-none">
                                {manualCapturedPhotos.map((src, idx) => (
                                    <div key={idx} className="relative w-16 h-16 rounded-lg border border-white/20 overflow-hidden shadow-md flex-shrink-0 group hover:border-emerald-500 transition-colors">
                                        <img src={src} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[9px] font-mono text-white font-bold">#{idx + 1}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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

                        {/* Camera Shutter Button */}
                        {(isCameraOn || isScreenSharing) && (
                            <TooltipAnchor
                                description="Capturar Foto de Evidencia"
                                render={
                                    <button
                                        onClick={handleManualCapture}
                                        className="p-4 rounded-full bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300 transform active:scale-90 border border-emerald-400/30"
                                    >
                                        <Camera className="w-5 h-5" />
                                    </button>
                                }
                            />
                        )}

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
                    @keyframes flash-effect {
                        0% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                    .animate-flash {
                        animation: flash-effect 150ms ease-out forwards;
                    }
                ` }} />
            </div>
        </div>
    );
};

export default LiveAnalysisModal;
