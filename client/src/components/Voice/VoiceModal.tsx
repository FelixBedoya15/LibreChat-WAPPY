import { useState, useEffect, useCallback, useRef, useMemo, type FC } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { Mic, MicOff, Video, VideoOff, RefreshCcw, Monitor, MonitorOff, PhoneOff, Smartphone } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import store from '~/store';
import VoiceOrb from './VoiceOrb';
import VoiceSelector from './VoiceSelector';
import { useVoiceSession } from '~/hooks/useVoiceSession';
import { useLocalize } from '~/hooks';

interface VoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId?: string;
    onConversationIdUpdate?: (newId: string) => void;
    onConversationUpdated?: () => void;
    model?: string;
    endpoint?: string;
}

const playStartupSound = () => {
    try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const frequencies = [523.25, 659.25, 783.99, 987.77];
        frequencies.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1 + (i * 0.05));
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + (i * 0.05));
            osc.stop(ctx.currentTime + 1.5);
        });
    } catch (e) {
        console.warn('Startup sound could not be played:', e);
    }
};

const VoiceModal: FC<VoiceModalProps> = ({ isOpen, onClose, conversationId, onConversationIdUpdate, onConversationUpdated, model, endpoint }) => {
    const localize = useLocalize();
    const [voiceChatGeneral, setVoiceChatGeneral] = useRecoilState(store.voiceChatGeneral);
    const [selectedVoice, setSelectedVoice] = useState(voiceChatGeneral);
    const [countdownValue, setCountdownValue] = useState(3);
    const [isReady, setIsReady] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true); // START ON by default
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const setShowModalState = useSetRecoilState(store.showVoiceModal);
    const [showVoiceSelector, setShowVoiceSelector] = useState(false);
    const [audioAmplitude, setAudioAmplitude] = useState(0);
    const [statusText, setStatusText] = useState('');
    // Transcription state: last user speech shown on HUD
    const [lastUserTranscript, setLastUserTranscript] = useState('');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const sessionOptions = useMemo(() => ({
        conversationId,
        onConversationIdUpdate,
        onConversationUpdated,
        initialVoice: voiceChatGeneral,
        model,
        endpoint,
        onAudioReceived: (audioData: string) => {
            handleAudioReceived(audioData);
        },
        onTextReceived: (text: string, isUserTranscription?: boolean) => {
            if (isUserTranscription) {
                // Show user's own speech transcription live in the HUD
                console.log('[VoiceModal] User transcription:', text);
                setLastUserTranscript(text);
            }
            // AI text responses are intentionally not displayed (audio-only UI)
        },

        onStatusChange: (newStatus: string) => {
            console.log('[VoiceModal] Status changed:', newStatus);
            if (newStatus === 'listening') {
                setLastUserTranscript('');
            }
        },
        onError: (error: string) => {
            console.error('[VoiceModal] Error:', error);
            setStatusText(`Error: ${error}`);
        },
    }), [conversationId, onConversationIdUpdate, onConversationUpdated, voiceChatGeneral, model, endpoint]);

    const {
        isConnected,
        isConnecting,
        status,
        connect,
        disconnect,
        sendVideoFrame,
        changeVoice,
        getInputVolume,
        setMuted,
    } = useVoiceSession(sessionOptions);

    const prevIsOpenRef = useRef(isOpen);

    useEffect(() => {
        if (!isOpen) return;
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        setShowModalState(true);
        connect();
        // AUTO-START CAMERA
        setTimeout(() => {
            startCamera('environment');
        }, 500);
        return () => {
            stopMediaTracks();
            disconnect();
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const wasOpen = prevIsOpenRef.current;
        prevIsOpenRef.current = isOpen;
        if (!wasOpen && isOpen && !isConnected && !isConnecting) {
            playStartupSound();
            connect();
        }
        if (isOpen && isConnected && selectedVoice !== voiceChatGeneral) {
            setSelectedVoice(voiceChatGeneral);
            changeVoice(voiceChatGeneral);
        }
    }, [isOpen, isConnected, isConnecting, connect, changeVoice, voiceChatGeneral]);

    // Countdown logic (same as LiveAnalysisModal)
    useEffect(() => {
        if (isOpen && isConnected) {
            setIsReady(false);
            setCountdownValue(3);

            const countdownInterval = setInterval(() => {
                setCountdownValue(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);
                        setIsReady(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(countdownInterval);
        } else {
            setIsReady(false);
        }
    }, [isOpen, isConnected]);

    const handleClose = () => {
        clearAudioQueue();
        stopMediaTracks();
        disconnect();
        setShowModalState(false);
        if (onConversationUpdated && conversationId) {
            onConversationUpdated();
        }
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

    const [supportsScreenShare, setSupportsScreenShare] = useState(false);
    useEffect(() => {
        if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
            setSupportsScreenShare(true);
        }
    }, []);

    const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
        try {
            stopMediaTracks();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15 }, facingMode: mode },
                audio: false
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setIsCameraOn(true);
            startSendingFrames();
        } catch (error) {
            console.error('[VoiceModal] Error starting camera:', error);
            setStatusText('Error accessing camera');
            setIsCameraOn(false);
        }
    };

    const startScreenShare = async () => {
        try {
            stopMediaTracks();
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 10 } },
                audio: false
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            stream.getVideoTracks()[0].onended = () => stopMediaTracks();
            setIsScreenSharing(true);
            startSendingFrames();
        } catch (error) {
            console.error('[VoiceModal] Error starting screen share:', error);
            setIsScreenSharing(false);
        }
    };

    const startSendingFrames = () => {
        videoIntervalRef.current = setInterval(() => {
            if (videoRef.current) { sendVideoFrame(videoRef.current); }
        }, 1000);
    };

    const toggleCamera = () => { isCameraOn ? stopMediaTracks() : startCamera(); };
    const toggleScreenShare = () => { isScreenSharing ? stopMediaTracks() : startScreenShare(); };
    const switchCamera = () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        if (isCameraOn) { stopMediaTracks(); setTimeout(() => startCamera(newMode), 200); }
    };

    const [isPlaying, setIsPlaying] = useState(false);
    const outputAnalyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const nextStartTimeRef = useRef<number>(0);

    useEffect(() => {
        const updateAmplitude = () => {
            let vol = 0;
            if (status === 'speaking' && isPlaying && outputAnalyserRef.current) {
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
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [status, isPlaying, getInputVolume]);

    function handleAudioReceived(audioData: string) {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            }
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
            const binaryString = atob(audioData);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
            const dataView = new DataView(bytes.buffer);
            const float32Data = new Float32Array(len / 2);
            for (let i = 0; i < len / 2; i++) {
                const int16 = dataView.getInt16(i * 2, true);
                float32Data[i] = int16 / 32768.0;
            }
            const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
            audioBuffer.getChannelData(0).set(float32Data);
            scheduleAudio(audioBuffer);
        } catch (error) {
            console.error('[VoiceModal] Error processing audio:', error);
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
        source.onended = () => setIsPlaying(false);
        setIsPlaying(true);
        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += buffer.duration;
    }

    const clearAudioQueue = () => {
        if (audioContextRef.current) {
            audioContextRef.current.suspend().then(() => {
                nextStartTimeRef.current = 0;
                audioContextRef.current?.resume();
            });
        }
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        setMuted(newMuted);
    };

    const handleVoiceChange = (voiceId: string) => {
        setSelectedVoice(voiceId);
        setVoiceChatGeneral(voiceId);
        clearAudioQueue();
        changeVoice(voiceId);
        setShowVoiceSelector(false);
    };

    const handleOrbClick = () => {
        if (status === 'ready' || status === 'idle') {
            setShowVoiceSelector(!showVoiceSelector);
        }
    };

    if (!isOpen) return null;

    const countdown = countdownValue;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-300">
            <div className="relative w-full h-full flex flex-col overflow-hidden">

                {/* ── Technical Loading Overlay ── */}
                {(!isReady && isOpen) && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95">
                        <div className="relative">
                            <svg className="w-64 h-64 -rotate-90 transform">
                                <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                                <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={754} strokeDashoffset={754 - (754 * (3 - countdownValue) / 3)} className="text-teal-500 transition-all duration-1000 ease-linear" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-7xl font-mono font-bold text-white tracking-tighter">00:{countdownValue.toString().padStart(2, '0')}</span>
                                <span className="text-[10px] text-teal-400 font-mono mt-2 tracking-[0.3em] uppercase opacity-80 animate-pulse">Initializing Stream</span>
                            </div>
                        </div>
                        <div className="mt-12 w-64 space-y-4">
                            <div className="flex justify-between text-[10px] text-white/40 font-mono uppercase tracking-widest">
                                <span>Securing Channel</span>
                                <span>{Math.round((3 - countdownValue) * 33.3)}%</span>
                            </div>
                            <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 transition-all duration-1000 ease-linear" style={{ width: `${(3 - countdownValue) * 33.3}%` }} />
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                                <p className="text-[9px] text-teal-500/60 font-mono truncate animate-pulse">{'>'} ACCESS_KEY: ENABLED</p>
                                <p className="text-[9px] text-teal-500/60 font-mono truncate animate-pulse">{'>'} VOICE_ENGINE: GEMINI_LIVE</p>
                                <p className="text-[9px] text-teal-500/60 font-mono truncate animate-pulse">{'>'} PROTOCOL: SST_v3.4</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── HUD Top Bar ── */}
                <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-start z-40 pointer-events-none">
                    {/* Left: LIVE indicator */}
                    <div className="flex flex-col gap-1 md:gap-3">
                        <div className="flex items-center gap-2 md:gap-3 bg-black/40 backdrop-blur-md px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-white/10 shadow-xl">
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                </span>
                                <span className="text-[9px] md:text-[11px] font-bold text-white uppercase tracking-wider">LIVE</span>
                            </div>
                            <div className="w-[1px] h-3 bg-white/20"></div>
                            <div className="text-[9px] md:text-[11px] font-mono text-white/70">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                        </div>
                        <div className="flex flex-col gap-0.5 md:gap-1 px-1">
                            <h2 className="text-white text-[11px] md:text-sm font-bold tracking-wide flex items-center gap-1.5 md:gap-2">
                                <span className="w-1 md:w-1.5 h-1 md:h-1.5 bg-teal-500 rounded-full"></span>
                                <span className="truncate max-w-[120px] md:max-w-none">ASISTENTE SST</span>
                            </h2>
                            <p className="text-white/40 text-[8px] md:text-[10px] font-mono tracking-tighter uppercase">
                                PROCESO: CONVERSACIÓN
                            </p>
                        </div>
                    </div>

                    {/* Center: Status pill */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-8 flex flex-col items-center gap-2">
                        <div className="bg-black/60 backdrop-blur-xl px-6 py-2 rounded-full border border-white/20 shadow-2xl flex items-center gap-3">
                            {status === 'thinking' && <RefreshCcw className="w-4 h-4 text-teal-400 animate-spin" />}
                            <h2 className="text-sm md:text-base font-medium text-white tracking-widest uppercase">
                                {statusText || (status === 'listening' ? localize('com_nav_voice_listening') :
                                    status === 'speaking' ? localize('com_nav_voice_speaking') :
                                        status === 'thinking' ? localize('com_nav_voice_thinking') :
                                            localize('com_nav_voice_ready_label'))}
                            </h2>
                        </div>
                    </div>

                    {/* Right: Model/Session info */}
                    <div className="flex flex-col items-end gap-3 text-right">
                        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-xl flex flex-col items-end">
                            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Model: {model || 'Gemini Live'}</span>
                            <span className="text-[10px] text-teal-500 font-mono uppercase tracking-widest">
                                {isConnected ? 'CONNECTED' : isConnecting ? 'CONNECTING...' : 'OFFLINE'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60">
                            <Monitor className="w-3 h-3" />
                            <span className="text-xs font-mono">VOICE / 16KHz</span>
                        </div>
                    </div>
                </div>

                {/* ── Video Background ── */}
                <div className="absolute inset-0 z-0 overflow-hidden bg-surface-primary">
                    <video
                        ref={videoRef}
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${isCameraOn || isScreenSharing ? 'opacity-100 scale-100' : 'opacity-0 scale-110 blur-xl'}`}
                        muted playsInline
                    />
                    {(isCameraOn || isScreenSharing) && (
                        <>
                            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_2px] opacity-15"></div>
                            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]"></div>
                            <div className="absolute top-12 left-12 w-8 h-8 border-t-2 border-l-2 border-white/40 rounded-tl-sm pointer-events-none"></div>
                            <div className="absolute top-12 right-12 w-8 h-8 border-t-2 border-r-2 border-white/40 rounded-tr-sm pointer-events-none"></div>
                            <div className="absolute bottom-32 left-12 w-8 h-8 border-b-2 border-l-2 border-white/40 rounded-bl-sm pointer-events-none"></div>
                            <div className="absolute bottom-32 right-12 w-8 h-8 border-b-2 border-r-2 border-white/40 rounded-br-sm pointer-events-none"></div>
                            {status === 'thinking' && (
                                <div className="absolute top-0 left-0 w-full h-1 bg-teal-400/50 shadow-[0_0_15px_rgba(45,212,191,0.8)] z-10 animate-[scan_2s_ease-in-out_infinite] pointer-events-none"></div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Center: Voice Orb ── */}
                <div className="flex-1 flex flex-col items-center justify-center z-10 relative">
                    <div
                        onClick={handleOrbClick}
                        className={`cursor-pointer transition-all duration-500 transform ${status === 'speaking' ? 'scale-110' : 'scale-100'}`}
                    >
                        <VoiceOrb status={status === 'ready' ? 'idle' : status} amplitude={audioAmplitude} className="drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]" />
                    </div>

                    {/* ── USER TRANSCRIPTION DISPLAY ── */}
                    {lastUserTranscript && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
                            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 text-center shadow-2xl">
                                <p className="text-[10px] text-teal-400 font-mono uppercase tracking-widest mb-1">Tu transcripción</p>
                                <p className="text-white text-sm font-medium leading-snug">{lastUserTranscript}</p>
                            </div>
                        </div>
                    )}

                    <p className="mt-8 text-white/40 text-[10px] font-mono tracking-[0.5em] uppercase select-none">
                        {status === 'speaking' ? 'AI Voice Active' : status === 'listening' ? 'Analyzing Audio' : 'Secure Channel Idle'}
                    </p>

                    {showVoiceSelector && (
                        <div className="absolute top-full mt-8 bg-surface-primary border border-white/10 rounded-xl shadow-2xl p-2 min-w-[200px] z-50 overflow-hidden">
                            <div className="px-3 py-2 border-b border-light/10 text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">
                                Select System Voice
                            </div>
                            <VoiceSelector selectedVoice={selectedVoice} onVoiceChange={handleVoiceChange} />
                        </div>
                    )}
                </div>

                {/* ── Bottom Control Bar (Glassmorphism) ── */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-30 flex flex-col items-center gap-6">
                    <div className="flex items-center justify-center gap-2 md:gap-4 bg-black/60 backdrop-blur-2xl px-4 md:px-8 py-3 md:py-5 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 shadow-2xl transition-all hover:bg-black/70">

                        {/* Camera */}
                        <TooltipAnchor
                            description={isCameraOn ? localize('com_ui_voice_camera_off') : localize('com_ui_voice_camera_on')}
                            render={
                                <button
                                    onClick={toggleCamera}
                                    disabled={isScreenSharing}
                                    className={`p-3 md:p-4 rounded-full transition-all duration-300 transform active:scale-95 ${isCameraOn ? 'bg-white text-black shadow-lg shadow-white/20' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'} ${isScreenSharing ? 'opacity-20 cursor-not-allowed' : ''}`}
                                >
                                    {isCameraOn ? <Video className="w-4 h-4 md:w-5 md:h-5" /> : <VideoOff className="w-4 h-4 md:w-5 md:h-5" />}
                                </button>
                            }
                        />

                        {/* Camera Switch */}
                        {isCameraOn && (
                            <TooltipAnchor
                                description={localize('com_ui_switch_camera')}
                                render={
                                    <button onClick={switchCamera} className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all transform active:rotate-180 duration-500">
                                        <RefreshCcw className="w-5 h-5" />
                                    </button>
                                }
                            />
                        )}

                        <div className="w-[1px] h-8 bg-white/10 mx-2"></div>

                        {/* Microphone (Center hero button) */}
                        <TooltipAnchor
                            description={isMuted ? localize('com_nav_voice_unmute') : localize('com_nav_voice_mute')}
                            render={
                                <button
                                    onClick={toggleMute}
                                    className={`p-3.5 md:p-5 rounded-full transition-all duration-500 transform active:scale-90 ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50 backdrop-blur-md' : 'bg-white text-black shadow-xl shadow-white/10 scale-105 md:scale-110 border-2 md:border-4 border-white'}`}
                                >
                                    {isMuted ? <MicOff className="w-5 h-5 md:w-7 md:h-7" /> : (
                                        <div className="relative">
                                            <Mic className="w-5 h-5 md:w-7 md:h-7" />
                                            {status === 'listening' && (
                                                <span className="absolute -top-2 md:-top-3 -right-2 md:-right-3 flex h-3 w-3 md:h-4 md:w-4">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 bg-teal-500"></span>
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            }
                        />

                        <div className="w-[1px] h-8 bg-white/10 mx-2"></div>

                        {/* Screen Share */}
                        {supportsScreenShare && (
                            <TooltipAnchor
                                description={isScreenSharing ? localize('com_ui_voice_screen_share_stop') : localize('com_ui_voice_screen_share_start')}
                                render={
                                    <button
                                        onClick={toggleScreenShare}
                                        disabled={isCameraOn}
                                        className={`p-4 rounded-full transition-all duration-300 transform active:scale-95 ${isScreenSharing ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'} ${isCameraOn ? 'opacity-20 cursor-not-allowed' : ''}`}
                                    >
                                        {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                                    </button>
                                }
                            />
                        )}

                        {/* End Call */}
                        <TooltipAnchor
                            description={localize('com_ui_voice_end_call')}
                            render={
                                <button onClick={handleClose} className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all duration-300 transform hover:scale-110 active:scale-95 border border-red-400/20">
                                    <PhoneOff className="w-5 h-5" />
                                </button>
                            }
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-6 text-[9px] font-mono text-white/30 uppercase tracking-[0.4em] pointer-events-none">
                        <span>Encrypted Protocol SSL-V3</span>
                        <span>•</span>
                        <span>Voice Analysis Mode</span>
                        <span>•</span>
                        <span>Secure Channel Active</span>
                    </div>
                </div>

                {/* Scan animation keyframe */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes scan {
                        0% { top: 0; opacity: 0; }
                        5% { opacity: 1; }
                        95% { opacity: 1; }
                        100% { top: 100%; opacity: 0; }
                    }
                `}} />
            </div>
        </div>
    );
};

export default VoiceModal;
