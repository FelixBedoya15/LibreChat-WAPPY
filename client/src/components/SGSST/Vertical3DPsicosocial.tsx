import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  BarChart3, 
  Download, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Brain
} from 'lucide-react';
import ExpandableButton from '~/components/Common/ExpandableButton';
import SGSSTLegalBadge from './SGSSTLegalBadge';

// --- Web Audio API Synthesizer (Zero External Dependencies) ---
class WappyAudioEngine {
  private ctx: AudioContext | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  public muted: boolean = false;

  public init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.startDrone();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.setValueAtTime(this.muted ? 0 : 0.015, this.ctx.currentTime);
    }
    return this.muted;
  }

  public playHudClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.015);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.02);
  }

  public playWhoosh() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.22;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3.0;
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.1);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.22);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.23);
  }

  public playOverloadAlarm() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(920, t);
    osc.frequency.setValueAtTime(1840, t + 0.08);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.21);
  }

  private startDrone() {
    if (!this.ctx || this.droneOsc) return;
    try {
      this.droneOsc = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();
      this.droneOsc.type = 'sine';
      this.droneOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
      this.droneGain.gain.setValueAtTime(this.muted ? 0 : 0.015, this.ctx.currentTime);
      this.droneOsc.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);
      this.droneOsc.start();
    } catch {
      // Audio autoplay policy
    }
  }

  public updateStressDrone(ratio: number) {
    if (!this.ctx || !this.droneOsc || this.muted) return;
    const t = this.ctx.currentTime;
    const targetFreq = 55 + ratio * 95;
    this.droneOsc.frequency.setTargetAtTime(targetFreq, t, 0.1);
    if (this.droneGain) {
      this.droneGain.gain.setTargetAtTime(0.015 + ratio * 0.035, t, 0.1);
    }
  }
}

// Global audio engine singleton
const audioEngine = new WappyAudioEngine();

// --- Chapters Definition (Res. 2764 de 2022) ---
export interface ChapterItem {
  id: number;
  phaseLabel: string;
  tabLabel: string;
  title: string;
  description: string;
  stressPreset: number;
  highlight: string;
}

const CHAPTERS_DATA: ChapterItem[] = [
  {
    id: 1,
    phaseLabel: 'FASE 1 DE 5',
    tabLabel: '01 Intral',
    title: '01 · Factores Intralaborales',
    description: 'Demandas cuantitativas, ritmo de trabajo, carga mental y control sobre las tareas evaluadas por la Batería oficial.',
    stressPreset: 25,
    highlight: 'Demandas del Puesto',
  },
  {
    id: 2,
    phaseLabel: 'FASE 2 DE 5',
    tabLabel: '02 Extra',
    title: '02 · Factores Extralaborales',
    description: 'Tiempo fuera del trabajo, relaciones familiares, desplazamiento urbano y contexto socioeconómico del colaborador.',
    stressPreset: 45,
    highlight: 'Entorno & Familia',
  },
  {
    id: 3,
    phaseLabel: 'FASE 3 DE 5',
    tabLabel: '03 Indiv',
    title: '03 · Factores Individuales',
    description: 'Características sociodemográficas, rasgos de personalidad y estilos de afrontamiento ante estresores laborales.',
    stressPreset: 60,
    highlight: 'Afrontamiento',
  },
  {
    id: 4,
    phaseLabel: 'FASE 4 DE 5',
    tabLabel: '04 Fisiol',
    title: '04 · Fisiología del Estrés & Burnout',
    description: 'Activación del eje HPA, cascada sostenida de Cortisol, inhibición de Dopamina, taquicardia y fatiga crónica.',
    stressPreset: 88,
    highlight: 'Eje HPA & Cortisol',
  },
  {
    id: 5,
    phaseLabel: 'FASE 5 DE 5',
    tabLabel: '05 PVE',
    title: '05 · Protocolo de Intervención & PVE',
    description: 'Desconexión laboral (Ley 2191), primeros auxilios psicológicos y Programa de Vigilancia Epidemiológica Psicosocial.',
    stressPreset: 10,
    highlight: 'Intervención Primaria',
  },
];

export interface Vertical3DPsicosocialProps {
  initialStress?: number;
  onExportReport?: (data: { stress: number; chapter: number }) => void;
  onAnalyzeAi?: (stress: number) => void;
  className?: string;
}

export default function Vertical3DPsicosocial({
  initialStress = 15,
  onExportReport,
  onAnalyzeAi,
  className = '',
}: Vertical3DPsicosocialProps) {
  const [stress, setStress] = useState<number>(initialStress);
  const [activeChapter, setActiveChapter] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const coreUniformsRef = useRef<{ uTime: { value: number }; uStress: { value: number }; uBpm: { value: number } } | null>(null);
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const prevMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lightsRef = useRef<{ cyan: any; red: any; ring: any } | null>(null);

  // Derived Biometrics
  const ratio = stress / 100;
  const bpm = Math.round(62 + ratio * 76);
  const cortisol = Math.round(15 + ratio * 77);
  const dopamina = 100 - cortisol;

  // Level classification according to Res. 2764/2022
  let riskBadge = { label: 'SIN RIESGO', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', sub: 'Homeostasis celular' };
  if (stress >= 20 && stress < 45) {
    riskBadge = { label: 'BAJO', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', sub: 'Adaptación normal' };
  } else if (stress >= 45 && stress < 70) {
    riskBadge = { label: 'MEDIO', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', sub: 'Tensión moderada' };
  } else if (stress >= 70 && stress < 85) {
    riskBadge = { label: 'ALTO', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', sub: 'Fatiga acumulada' };
  } else if (stress >= 85) {
    riskBadge = { label: 'MUY ALTO', color: 'bg-rose-500/30 text-rose-300 border-rose-500/50 animate-pulse', sub: 'Riesgo de Burnout' };
  }

  // Update uniforms and audio on stress change
  useEffect(() => {
    if (coreUniformsRef.current) {
      coreUniformsRef.current.uStress.value = ratio;
      coreUniformsRef.current.uBpm.value = bpm;
    }
    if (lightsRef.current) {
      lightsRef.current.cyan.intensity = 2.5 * (1.0 - ratio * 0.7);
      lightsRef.current.red.intensity = 0.1 + ratio * 3.5;
      if (lightsRef.current.ring?.material?.color) {
        lightsRef.current.ring.material.color.set(ratio > 0.65 ? 0xef4444 : 0x00d4ff);
      }
    }
    audioEngine.updateStressDrone(ratio);
    if (stress >= 85) {
      audioEngine.playOverloadAlarm();
    }
  }, [stress, ratio, bpm]);

  // Load Three.js dynamically and initialize scene
  useEffect(() => {
    let isCancelled = false;
    let renderer: any = null;
    let animationFrameId: number;

    const initScene = (THREE: any) => {
      if (!containerRef.current || isCancelled) return;
      const el = containerRef.current;
      el.innerHTML = '';

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x020409, 0.15);

      const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100);
      camera.position.set(0, 0, 7.2);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      el.appendChild(renderer.domElement);

      // Lights
      const ambientLight = new THREE.AmbientLight(0x0c192e, 1.2);
      scene.add(ambientLight);

      const lightCyan = new THREE.PointLight(0x00d4ff, 2.5, 20);
      lightCyan.position.set(4, 3, 5);
      scene.add(lightCyan);

      const lightRed = new THREE.PointLight(0xef4444, 0.1, 20);
      lightRed.position.set(-4, -3, 3);
      scene.add(lightRed);

      // Shaders
      const vertexShader = `
        uniform float uTime;
        uniform float uStress;
        uniform float uBpm;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vNoise;

        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        float snoise(vec3 v){
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + 1.0 * C.xxx;
          vec3 x2 = x0 - i2 + 2.0 * C.xxx;
          vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
          i = mod(i, 289.0);
          vec4 p = permute(permute(permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z.xxxx);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
          vNormal = normal;
          vPosition = position;
          float pulse = sin(uTime * (uBpm / 60.0) * 6.28318) * 0.09 * (1.0 + uStress * 1.8);
          float noise = snoise(position * (1.2 + uStress * 3.5) + vec3(uTime * (0.8 + uStress * 3.8)));
          vNoise = noise;
          vec3 newPos = position + normal * (noise * (0.16 + uStress * 0.7) + pulse);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
        }
      `;

      const fragmentShader = `
        uniform float uTime;
        uniform float uStress;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vNoise;

        void main() {
          vec3 cyanZen = vec3(0.0, 0.83, 1.0);
          vec3 tealZen = vec3(0.05, 0.58, 0.53);
          vec3 redStress = vec3(0.94, 0.27, 0.27);
          vec3 magentaStress = vec3(0.7, 0.1, 0.8);

          vec3 colorZen = mix(cyanZen, tealZen, vPosition.y * 0.3 + 0.5);
          vec3 colorStress = mix(redStress, magentaStress, vPosition.x * 0.4 + 0.5);
          vec3 baseColor = mix(colorZen, colorStress, uStress);

          vec3 viewDir = normalize(-vPosition);
          float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.2);
          float spark = pow(max(vNoise, 0.0), 2.8) * (1.0 + uStress * 3.2);
          vec3 sparkColor = mix(vec3(0.8, 1.0, 1.0), vec3(1.0, 0.8, 0.2), uStress);

          vec3 finalColor = baseColor + (spark * sparkColor) + (fresnel * baseColor * 1.6);
          gl_FragColor = vec4(finalColor, 0.55 + fresnel * 0.4);
        }
      `;

      const uniforms = {
        uTime: { value: 0 },
        uStress: { value: ratio },
        uBpm: { value: bpm },
      };
      coreUniformsRef.current = uniforms;

      // 1. Mesh Core
      const coreGeom = new THREE.IcosahedronGeometry(1.85, 4);
      const coreMat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        wireframe: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
      });
      const neuronalCore = new THREE.Mesh(coreGeom, coreMat);
      scene.add(neuronalCore);

      // 2. Synaptic Particle Cloud
      const pCount = 650;
      const pGeom = new THREE.BufferGeometry();
      const pos = new Float32Array(pCount * 3);
      const col = new Float32Array(pCount * 3);

      for (let i = 0; i < pCount * 3; i += 3) {
        const rad = 2.2 + Math.random() * 2.0;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        pos[i] = rad * Math.sin(phi) * Math.cos(theta);
        pos[i + 1] = rad * Math.sin(phi) * Math.sin(theta);
        pos[i + 2] = rad * Math.cos(phi);
        col[i] = 0.0;
        col[i + 1] = 0.83;
        col[i + 2] = 1.0;
      }
      pGeom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      pGeom.setAttribute('color', new THREE.BufferAttribute(col, 3));

      const pMat = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const synapticParticles = new THREE.Points(pGeom, pMat);
      scene.add(synapticParticles);

      // 3. Ring
      const ringGeom = new THREE.RingGeometry(2.8, 2.85, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
      });
      const orbitalRing = new THREE.Mesh(ringGeom, ringMat);
      orbitalRing.rotation.x = Math.PI / 2.4;
      scene.add(orbitalRing);

      lightsRef.current = { cyan: lightCyan, red: lightRed, ring: orbitalRing };

      // Animation Loop
      const clock = new THREE.Clock();
      const animate = () => {
        if (isCancelled) return;
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();
        uniforms.uTime.value = elapsedTime;

        currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
        currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;

        neuronalCore.rotation.y = currentRotationRef.current.y + elapsedTime * 0.15;
        neuronalCore.rotation.x = currentRotationRef.current.x + Math.sin(elapsedTime * 0.5) * 0.1;

        synapticParticles.rotation.y = -elapsedTime * 0.08;
        synapticParticles.rotation.x = elapsedTime * 0.04;
        orbitalRing.rotation.z = elapsedTime * 0.2;

        renderer.render(scene, camera);
      };
      animate();

      // Resize observer
      const resizeObserver = new ResizeObserver(() => {
        if (!el || !renderer) return;
        const w = el.clientWidth;
        const h = el.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      resizeObserver.observe(el);
    };

    // Script loader
    if (typeof window !== 'undefined') {
      if ((window as any).THREE) {
        initScene((window as any).THREE);
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.async = true;
        script.onload = () => {
          if (!isCancelled && (window as any).THREE) {
            initScene((window as any).THREE);
          }
        };
        document.head.appendChild(script);
      }
    }

    return () => {
      isCancelled = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (renderer) renderer.dispose();
    };
  }, []);

  // Pointer interactions
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    audioEngine.init();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - prevMousePosRef.current.x;
    const dy = e.clientY - prevMousePosRef.current.y;
    targetRotationRef.current.y += dx * 0.007;
    targetRotationRef.current.x += dy * 0.007;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleSelectChapter = (chap: ChapterItem) => {
    audioEngine.playWhoosh();
    setActiveChapter(chap.id);
    setStress(chap.stressPreset);
  };

  const handleToggleAudio = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  const currentChapter = CHAPTERS_DATA.find((c) => c.id === activeChapter) || CHAPTERS_DATA[0];

  return (
    <div className={`flex items-center justify-center min-h-[780px] p-2 sm:p-4 bg-[#020409] ${className}`}>
      {/* Ambient background glows */}
      <div className="fixed -top-24 -left-24 w-80 h-80 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />
      <div className="fixed -bottom-24 -right-24 w-80 h-80 rounded-full bg-teal-500/10 blur-[100px] pointer-events-none" />

      {/* 9:16 Vertical Smartphone Shell */}
      <div className="relative w-full max-w-[420px] aspect-[9/16] min-h-[760px] max-h-[920px] rounded-[38px] border border-cyan-500/30 bg-gradient-to-b from-[#0c192e]/90 via-[#050a14]/95 to-[#020409] shadow-[0_0_60px_rgba(0,212,255,0.12)] overflow-hidden flex flex-col justify-between backdrop-blur-xl select-none">
        
        {/* Cyber Grid & Laser Scanline Beam */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(13,148,136,0.05) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }}
        />
        <div 
          className="absolute left-0 right-0 h-[2px] pointer-events-none transition-all"
          style={{
            top: `${15 + (stress * 0.7)}%`,
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.3) 25%, #00d4ff 50%, rgba(13,148,136,0.3) 75%, transparent 100%)',
            boxShadow: stress > 75 ? '0 0 20px #ef4444, 0 0 40px #f43f5e' : '0 0 16px #00d4ff, 0 0 32px #0d9488'
          }}
        />

        {/* Tactical Corner Brackets */}
        <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400 drop-shadow-[0_0_4px_#00d4ff] pointer-events-none" />
        <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400 drop-shadow-[0_0_4px_#00d4ff] pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400 drop-shadow-[0_0_4px_#00d4ff] pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400 drop-shadow-[0_0_4px_#00d4ff] pointer-events-none" />

        {/* ================= HEADER HUD ================= */}
        <header className="relative z-20 pt-4 px-5 pb-2 border-b border-white/10 flex flex-col gap-1.5 bg-[#0c192e]/40 backdrop-blur-md">
          {/* Top Bar: Telemetry + Audio toggle */}
          <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300/80 tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span>WAPPY // BIO-NEURO 3D</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleToggleAudio}
                className="hover:text-cyan-200 transition-colors flex items-center gap-1 text-[10px]"
                title={isMuted ? 'Activar Efectos' : 'Silenciar'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                <span className={isMuted ? 'text-rose-400' : 'text-cyan-300'}>{isMuted ? 'MUTED' : 'SFX ON'}</span>
              </button>
              <span className="text-white/30">|</span>
              <span className="text-lime-300 font-bold">9:16 LIVE</span>
            </div>
          </div>

          {/* Main Title & Legal Badge */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-cyan-200 to-teal-400 bg-clip-text text-transparent">
                Riesgo Psicosocial
              </h1>
              <p className="text-[11px] text-cyan-400/80 font-mono tracking-tight flex items-center gap-1">
                <span>Batería MinTrabajo</span>
                <span className="text-white/30">•</span>
                <span className="text-amber-400">Eje HPA</span>
              </p>
            </div>

            {/* Grupo 1 Semántico: SGSSTLegalBadge Oficial Res. 2764 de 2022 / Estándar 3.1.6 */}
            <div className="shrink-0 scale-90 sm:scale-100 origin-right">
              <SGSSTLegalBadge 
                standardCode="3.1.6" 
                label="Res. 2764/22" 
                tooltip="Evaluación y vigilancia de factores psicosociales (Resolución 2764 de 2022)"
              />
            </div>
          </div>
        </header>

        {/* ================= 3D CANVAS STAGE ================= */}
        <div 
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="relative flex-1 w-full overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          {/* Holographic Radar overlay SVG */}
          <div className="absolute top-3 right-3 w-14 h-14 pointer-events-none opacity-40">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#00d4ff" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="#00d4ff" strokeWidth="0.8" opacity="0.6" />
              <line x1="50" y1="4" x2="50" y2="96" stroke="#00d4ff" strokeWidth="0.5" opacity="0.4" />
              <line x1="4" y1="50" x2="96" y2="50" stroke="#00d4ff" strokeWidth="0.5" opacity="0.4" />
            </svg>
          </div>

          {/* Interactive Drag prompt */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none text-center">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-[9px] font-mono text-cyan-200/70 tracking-widest uppercase backdrop-blur-sm">
              Arrastra para rotar sinapsis 3D
            </span>
          </div>

          {/* Overload Alert Strobe */}
          <div 
            className="absolute inset-0 bg-red-600/25 pointer-events-none transition-opacity duration-300"
            style={{ opacity: stress >= 85 ? 0.35 : stress >= 70 ? 0.12 : 0 }}
          />
        </div>

        {/* ================= BIOMETRIC REAL-TIME METRICS ================= */}
        <section className="relative z-20 px-4 py-2 bg-gradient-to-b from-[#0c192e]/60 to-[#020409]/90 border-t border-b border-white/10 backdrop-blur-md flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            {/* Metric 1: BPM */}
            <div className="p-2 rounded-xl border border-cyan-500/20 bg-black/30 flex flex-col justify-between">
              <span className="text-[9px] font-mono uppercase text-cyan-400 tracking-wider">Frecuencia</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold font-mono text-white tabular-nums">{bpm}</span>
                <span className="text-[9px] font-mono text-white/50">BPM</span>
              </div>
              <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-300" 
                  style={{ width: `${Math.min(100, (bpm / 140) * 100)}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Cortisol vs Dopamina */}
            <div className="p-2 rounded-xl border border-teal-500/20 bg-black/30 flex flex-col justify-between">
              <span className="text-[9px] font-mono uppercase text-teal-400 tracking-wider">Cortisol / Dopa</span>
              <div className="flex items-baseline justify-between mt-0.5 text-xs font-mono font-bold">
                <span className="text-rose-400 tabular-nums">{cortisol}%</span>
                <span className="text-white/30">:</span>
                <span className="text-cyan-300 tabular-nums">{dopamina}%</span>
              </div>
              <div className="w-full h-1.5 bg-cyan-950 rounded-full overflow-hidden mt-1 flex">
                <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${cortisol}%` }} />
                <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${dopamina}%` }} />
              </div>
            </div>

            {/* Metric 3: Res. 2764 Level */}
            <div className="p-2 rounded-xl border border-amber-500/20 bg-black/30 flex flex-col justify-between">
              <span className="text-[9px] font-mono uppercase text-amber-400 tracking-wider">Nivel Batería</span>
              <div className="mt-0.5">
                <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${riskBadge.color}`}>
                  {riskBadge.label}
                </span>
              </div>
              <span className="text-[8px] font-mono text-white/50 mt-1 truncate">{riskBadge.sub}</span>
            </div>
          </div>

          {/* Interactive Stress Slider */}
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-white/80">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Carga Mental & Estrés:</span>
              </span>
              <span className="font-bold text-lime-400 tabular-nums text-xs">
                {stress}% · {riskBadge.label}
              </span>
            </div>
            <input 
              type="range" 
              min={0} 
              max={100} 
              value={stress}
              onChange={(e) => {
                audioEngine.init();
                setStress(parseInt(e.target.value, 10));
              }}
              className="w-full h-5 accent-lime-400 cursor-pointer"
            />
          </div>
        </section>

        {/* ================= 5-CHAPTER SELECTOR (RES. 2764) ================= */}
        <section className="relative z-20 px-4 py-2 flex flex-col gap-1.5 bg-[#070d18]/90">
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300/70">
            <span>CAPÍTULOS TÉCNICOS (RES. 2764/2022)</span>
            <span className="text-lime-300 font-bold">{currentChapter.phaseLabel}</span>
          </div>

          <div className="grid grid-cols-5 gap-1">
            {CHAPTERS_DATA.map((c) => {
              const active = c.id === activeChapter;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectChapter(c)}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-mono font-bold tracking-tight border transition-all duration-200 ${
                    active
                      ? 'border-lime-400 bg-lime-400/20 text-lime-300 shadow-[0_0_10px_rgba(199,243,3,0.2)]'
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-300'
                  }`}
                >
                  {c.tabLabel}
                </button>
              );
            })}
          </div>

          <div className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] flex items-start gap-2.5 transition-all duration-300">
            <div className="p-1.5 rounded-lg bg-lime-400/10 text-lime-400 border border-lime-400/30 shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white leading-snug truncate">
                {currentChapter.title}
              </h4>
              <p className="text-[10px] text-white/70 leading-relaxed mt-0.5 line-clamp-2">
                {currentChapter.description}
              </p>
            </div>
          </div>
        </section>

        {/* ================= FOOTER: WAPPY 14-GROUP EXPANDABLE BUTTONS ================= */}
        <footer className="relative z-20 p-3 bg-[#020409] border-t border-white/10 flex items-center justify-between gap-2">
          {/* Grupo 6: Generar / Analizar IA con Sparkles (Purple) */}
          <ExpandableButton
            icon={<Sparkles className="w-4 h-4" />}
            label="Diagnóstico IA"
            variant="purple"
            size="sm"
            onClick={() => {
              audioEngine.playHudClick();
              if (onAnalyzeAi) onAnalyzeAi(stress);
            }}
          />

          {/* Grupo 12: Analíticas / Historial (Orange) */}
          <ExpandableButton
            icon={<BarChart3 className="w-4 h-4" />}
            label="Biométrica"
            variant="orange"
            size="sm"
            onClick={() => audioEngine.playHudClick()}
          />

          {/* Grupo 10: Exportar / Descargar PDF (Green) */}
          <ExpandableButton
            icon={<Download className="w-4 h-4" />}
            label="Informe PDF"
            variant="green"
            size="sm"
            className="ml-auto"
            onClick={() => {
              audioEngine.playWhoosh();
              if (onExportReport) onExportReport({ stress, chapter: activeChapter });
            }}
          />

          {/* Grupo 5: Reset Zen / Homeóstasis (Cyan) */}
          <ExpandableButton
            icon={<RotateCcw className="w-4 h-4" />}
            label="Zen (0%)"
            variant="cyan"
            size="sm"
            onClick={() => {
              audioEngine.playHudClick();
              setStress(5);
            }}
          />
        </footer>
      </div>
    </div>
  );
}
