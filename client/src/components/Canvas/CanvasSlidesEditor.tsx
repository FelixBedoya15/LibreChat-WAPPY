import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import pptxgen from 'pptxgenjs';
import { 
  Plus, 
  Trash2, 
  Layout, 
  MonitorPlay, 
  Palette, 
  Download, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Target,
  LogOut,
  Maximize2,
  Table2,
  BarChart3,
  Link2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Camera,
  X,
  Upload,
  Video
} from 'lucide-react';
import CanvasWorkspaceBridge from './CanvasWorkspaceBridge';


interface Slide {
  title: string;
  bullets: string[];
  theme?: 'cobalt' | 'forest' | 'sunset' | 'charcoal';
  layout?: 'title' | 'bullets' | 'split' | 'media' | 'table' | 'chart';
  imageUrl?: string;
  tableHtml?: string;
  chartConfig?: {
    type: 'bar' | 'line' | 'pie';
    data: Array<{ label: string; val: number }>;
    title: string;
  };
}

interface CanvasSlidesEditorProps {
  initialContent: string | Slide[];
  onUpdate: (content: string) => void;
  title: string;
  isMaximized?: boolean;
  onRegisterDownload?: (fn: () => void) => void;
}

/**
 * Extracts and parses a JSON array from noisy/conversational strings.
 */
function extractJsonArray(str: string): any[] | null {
  if (!str) return null;
  
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // Continue to extract
  }

  const startIdx = str.indexOf('[');
  const endIdx = str.lastIndexOf(']');
  
  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
    return null;
  }
  
  const candidate = str.slice(startIdx, endIdx + 1);
  
  try {
    const parsed = JSON.parse(candidate);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    try {
      let cleaned = candidate
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(?:^|\s)\/\/.*$/gm, '');
      
      cleaned = cleaned
        .replace(/,\s*\]/g, ']')
        .replace(/,\s*\}/g, '}');
        
      const parsedCleaned = JSON.parse(cleaned);
      if (Array.isArray(parsedCleaned)) return parsedCleaned;
    } catch (err) {
      console.error('Failed both standard and cleaned JSON extraction for slides:', err);
    }
  }
  
  return null;
}

const THEMES = {
  cobalt: {
    bg: 'bg-gradient-to-br from-slate-900 to-blue-950',
    text: 'text-white',
    accent: 'text-blue-400',
    border: 'border-blue-500/30',
    header: 'bg-blue-600',
  },
  forest: {
    bg: 'bg-gradient-to-br from-emerald-950 to-slate-900',
    text: 'text-white',
    accent: 'text-emerald-400',
    border: 'border-emerald-500/30',
    header: 'bg-emerald-600',
  },
  sunset: {
    bg: 'bg-gradient-to-br from-amber-950 to-rose-950',
    text: 'text-white',
    accent: 'text-rose-400',
    border: 'border-rose-500/30',
    header: 'bg-rose-600',
  },
  charcoal: {
    bg: 'bg-gradient-to-br from-neutral-900 to-neutral-950',
    text: 'text-white',
    accent: 'text-teal-400',
    border: 'border-neutral-500/30',
    header: 'bg-teal-600',
  },
};

interface SlideEditableTextProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  tagName?: 'h1' | 'h2' | 'div' | 'span';
}

const SlideEditableText: React.FC<SlideEditableTextProps> = ({
  value,
  onChange,
  placeholder = '',
  className = '',
  tagName = 'div',
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      if (ref.current.innerHTML !== value) {
        ref.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (ref.current) {
      onChange(ref.current.innerHTML);
    }
  };

  const handleBlur = () => {
    if (ref.current) {
      onChange(ref.current.innerHTML);
    }
  };

  const Tag = tagName;

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleBlur}
      className={`outline-none focus:ring-1 focus:ring-teal-500/30 rounded px-1 transition-all ${className} relative empty:before:content-[attr(data-placeholder)] empty:before:text-white/40 empty:before:pointer-events-none empty:before:absolute`}
      data-placeholder={placeholder}
      style={{ minWidth: '40px' }}
    />
  );
};

const CanvasSlidesEditor: React.FC<CanvasSlidesEditorProps> = ({ initialContent, onUpdate, title, isMaximized = false, onRegisterDownload }) => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Presentation Mode States
  const [isPresenting, setIsPresenting] = useState<boolean>(false);
  const [showLaser, setShowLaser] = useState<boolean>(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isBridgeOpen, setIsBridgeOpen] = useState<boolean>(false);

  // NEW states for Image Modal & Formatting
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'url'>('upload');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isCameraActiveRef = useRef<boolean>(false);

  const execCmd = (command: string, arg = '') => {
    document.execCommand(command, false, arg);
  };

  const startCamera = async () => {
    setCameraError(null);
    isCameraActiveRef.current = true;
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' }
      });
      // If camera was stopped while this promise was loading, stop the tracks immediately!
      if (!isCameraActiveRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setCameraError('No se pudo acceder a la cámara. Por favor verifica los permisos.');
    }
  };

  const stopCamera = () => {
    isCameraActiveRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isImageModalOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isImageModalOpen, activeTab]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        saveImageToSlide(dataUrl);
      }
    }
  };

  const saveImageToSlide = (url: string) => {
    const activeSlide = slides[activeIndex];
    const currentLayout = activeSlide?.layout || 'bullets';
    let newLayout = currentLayout;
    if (currentLayout === 'title' || currentLayout === 'bullets') {
      newLayout = 'split';
    }
    
    updateSlide(activeIndex, {
      imageUrl: url,
      layout: newLayout
    });
    
    setIsImageModalOpen(false);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          saveImageToSlide(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          saveImageToSlide(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Load content
  useEffect(() => {
    if (initialContent) {
      if (Array.isArray(initialContent)) {
        setSlides(initialContent);
        return;
      }
      const parsed = extractJsonArray(initialContent);
      if (parsed && Array.isArray(parsed)) {
        setSlides(parsed);
        return;
      } else {
        console.warn('Failed to parse slides content JSON via robust extractor');
      }
    }
    // Fallback default slides
    setSlides([
      {
        title: 'Presentación: Plan de Emergencias',
        bullets: [
          'Objetivos del Sistema de Prevención y Respuesta',
          'Marco Normativo y Legal de Referencia (Decreto 1072)',
          'Estructura del Comité de Emergencias de la Empresa',
        ],
        theme: 'cobalt',
      },
      {
        title: 'Identificación de Amenazas',
        bullets: [
          'Naturales: Terremotos, Tormentas y Desbordamientos',
          'Tecnológicas: Incendios, Derrames Químicos y Fallos Eléctricos',
          'Sociales: Hurtos, Vandalismo y Amenazas de Bomba',
        ],
        theme: 'sunset',
      },
      {
        title: 'Plan de Evacuación y Puntos de Encuentro',
        bullets: [
          'Rutas de Evacuación Principales y Alternas demarcadas',
          'Punto de Encuentro: Zona verde parqueadero principal',
          'Funciones de los Coordinadores de Evacuación por piso',
        ],
        theme: 'forest',
      },
    ]);
  }, [initialContent]);

  // Global keyboard listeners for presentation mode
  useEffect(() => {
    if (!isPresenting) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsPresenting(false);
        setShowLaser(false);
      }
    };

  }, [isPresenting, slides.length]);

  const handleImportTable = (html: string) => {
    updateSlide(activeIndex, {
      layout: 'table',
      tableHtml: html
    });
  };

  const handleImportChart = (config: any) => {
    updateSlide(activeIndex, {
      layout: 'chart',
      chartConfig: config
    });
  };

  const handleImportBullets = (sTitle: string, sBullets: string[]) => {
    const newSlide: Slide = {
      title: sTitle,
      bullets: sBullets,
      theme: 'cobalt',
      layout: 'bullets'
    };
    const updated = [...slides, newSlide];
    setSlides(updated);
    setActiveIndex(updated.length - 1);
    onUpdate(JSON.stringify(updated));
  };

  const renderSvgChart = (config: any) => {
    if (!config || !config.data || config.data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 border border-white/10 rounded-xl bg-black/20 text-white/50 text-xs">
          <span>No hay datos de gráfico configurados.</span>
        </div>
      );
    }

    const { type, data, title } = config;
    const width = 500;
    const height = 240;
    const paddingLeft = 50;
    const paddingRight = 30;
    const paddingTop = 40;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const values = data.map((d: any) => d.val);
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal;

    if (type === 'pie') {
      let total = values.reduce((sum: number, v: number) => sum + v, 0);
      if (total === 0) total = 1;

      let accumulatedAngle = 0;
      const cx = width / 2 - 60;
      const cy = height / 2 + 10;
      const r = 70;

      const colors = [
        '#06b6d4', // cyan
        '#10b981', // emerald
        '#f43f5e', // rose
        '#f59e0b', // amber
        '#8b5cf6', // violet
        '#3b82f6'  // blue
      ];

      return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-64 font-sans select-none">
          <text x={width / 2} y={25} textAnchor="middle" fill="#ffffff" className="text-sm font-bold tracking-wide fill-white drop-shadow">
            {title}
          </text>
          <g>
            {data.map((d: any, idx: number) => {
              const percentage = (d.val / total) * 100;
              const angle = (d.val / total) * 360;
              
              const x1 = cx + r * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
              const y1 = cy + r * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
              accumulatedAngle += angle;
              const x2 = cx + r * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
              const y2 = cy + r * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              const pathData = `
                M ${cx} ${cy}
                L ${x1} ${y1}
                A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}
                Z
              `;

              const color = colors[idx % colors.length];

              return (
                <g key={idx} className="group cursor-pointer">
                  <path
                    d={pathData}
                    fill={color}
                    opacity="0.85"
                    className="transition-all duration-300 hover:opacity-100 hover:scale-[1.03] origin-center"
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                  >
                    <title>{`${d.label}: ${d.val} (${percentage.toFixed(1)}%)`}</title>
                  </path>
                </g>
              );
            })}
          </g>
          
          <g transform={`translate(${width - 150}, ${paddingTop + 10})`}>
            {data.slice(0, 6).map((d: any, idx: number) => {
              const color = colors[idx % colors.length];
              return (
                <g key={idx} transform={`translate(0, ${idx * 22})`}>
                  <rect width={12} height={12} rx={3} fill={color} />
                  <text x={20} y={10} fill="#94a3b8" className="text-[10px] fill-slate-400 font-medium">
                    {d.label.length > 15 ? d.label.slice(0, 15) + '..' : d.label} ({d.val})
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      );
    }

    const getX = (index: number) => {
      if (data.length <= 1) return paddingLeft + chartWidth / 2;
      return paddingLeft + (index / (data.length - 1)) * chartWidth;
    };

    const getY = (val: number) => {
      const ratio = range === 0 ? 0.5 : (val - minVal) / range;
      return height - paddingBottom - ratio * chartHeight;
    };

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-64 font-sans select-none">
        <defs>
          <linearGradient id="neonCyanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
          </linearGradient>
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <text x={width / 2} y={25} textAnchor="middle" fill="#ffffff" className="text-sm font-bold tracking-wide fill-white drop-shadow">
          {title}
        </text>

        {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
          const yVal = minVal + r * range;
          const y = getY(yVal);
          return (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={width - paddingRight} 
                y2={y} 
                stroke="#334155" 
                strokeWidth="0.5" 
                strokeDasharray="4 4" 
              />
              <text 
                x={paddingLeft - 8} 
                y={y + 3} 
                textAnchor="end" 
                fill="#64748b" 
                className="text-[9px] fill-slate-500 font-semibold"
              >
                {yVal.toFixed(0)}
              </text>
            </g>
          );
        })}

        <line 
          x1={paddingLeft} 
          y1={height - paddingBottom} 
          x2={width - paddingRight} 
          y2={height - paddingBottom} 
          stroke="#475569" 
          strokeWidth="1.5" 
        />

        {type === 'bar' && (
          <g>
            {data.map((d: any, idx: number) => {
              const x = paddingLeft + (idx / data.length) * chartWidth + (chartWidth / data.length) * 0.15;
              const barWidth = (chartWidth / data.length) * 0.7;
              const y = getY(d.val);
              const h = height - paddingBottom - y;

              return (
                <g key={idx} className="group cursor-pointer">
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={h}
                    rx={Math.min(barWidth / 2, 4)}
                    fill="url(#neonCyanGrad)"
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                    className="transition-all duration-300 hover:fill-cyan-400 hover:fill-opacity-35"
                    filter="url(#neonGlow)"
                  >
                    <title>{`${d.label}: ${d.val}`}</title>
                  </rect>
                  
                  <text
                    x={x + barWidth / 2}
                    y={height - paddingBottom + 16}
                    textAnchor="middle"
                    fill="#94a3b8"
                    className="text-[9px] fill-slate-400 font-semibold truncate"
                    style={{ maxWidth: barWidth }}
                  >
                    {d.label.length > 10 ? d.label.slice(0, 9) + '..' : d.label}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {type === 'line' && (
          <g>
            {(() => {
              let pathD = '';
              data.forEach((d: any, idx: number) => {
                const x = getX(idx);
                const y = getY(d.val);
                if (idx === 0) pathD += `M ${x} ${y}`;
                else pathD += ` L ${x} ${y}`;
              });

              return (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  filter="url(#neonGlow)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })()}

            {(() => {
              if (data.length === 0) return null;
              let pathD = `M ${getX(0)} ${height - paddingBottom}`;
              data.forEach((d: any, idx: number) => {
                pathD += ` L ${getX(idx)} ${getY(d.val)}`;
              });
              pathD += ` L ${getX(data.length - 1)} ${height - paddingBottom} Z`;

              return (
                <path
                  d={pathD}
                  fill="url(#neonCyanGrad)"
                  opacity="0.25"
                />
              );
            })()}

            {data.map((d: any, idx: number) => {
              const x = getX(idx);
              const y = getY(d.val);

              return (
                <g key={idx} className="group cursor-pointer">
                  <circle
                    cx={x}
                    cy={y}
                    r={4.5}
                    fill="#ffffff"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    className="transition-all duration-200 group-hover:r-6 cursor-pointer"
                  >
                    <title>{`${d.label}: ${d.val}`}</title>
                  </circle>

                  <text
                    x={x}
                    y={height - paddingBottom + 16}
                    textAnchor="middle"
                    fill="#94a3b8"
                    className="text-[9px] fill-slate-400 font-semibold"
                  >
                    {d.label.length > 10 ? d.label.slice(0, 9) + '..' : d.label}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>
    );
  };

  const renderSlideContent = (slide: Slide, isPresentationMode = false) => {
    const layout = slide.layout || 'bullets';
    const curTheme = THEMES[slide.theme || 'cobalt'];

    switch (layout) {
      case 'title':
        return (
          <div className="flex-1 flex flex-col justify-center items-center text-center my-auto p-4 animate-in fade-in duration-300">
            {isPresentationMode ? (
              <h1 
                className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight max-w-4xl drop-shadow"
                dangerouslySetInnerHTML={{ __html: slide.title }}
              />
            ) : (
              <SlideEditableText
                key={`title-${activeIndex}`}
                value={slide.title}
                onChange={(val) => updateSlide(activeIndex, { title: val })}
                className={`w-full bg-transparent border-none outline-none font-extrabold text-4xl text-center ${curTheme.text} placeholder-white/40 pb-1`}
                placeholder="Introduce el título de portada..."
                tagName="h1"
              />
            )}
            <div className="h-1 w-24 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full mt-6 opacity-80" />
          </div>
        );

      case 'split':
        return (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center my-auto w-full p-2 md:p-4 animate-in fade-in duration-300">
            <div 
              onClick={() => !isPresentationMode && setIsImageModalOpen(true)}
              className={`relative group rounded-2xl overflow-hidden aspect-[4/3] border border-white/10 shadow-lg bg-black/25 flex items-center justify-center ${!isPresentationMode ? 'cursor-pointer hover:border-teal-500/50 transition-colors' : ''}`}
            >
              {slide.imageUrl ? (
                <img 
                  src={slide.imageUrl} 
                  alt="" 
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" 
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1590402449133-79848541a540?q=80&w=600&auto=format&fit=crop';
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-white/30 text-xs gap-2 p-6 text-center">
                  <Layout className="h-10 w-10 text-white/20 animate-pulse" />
                  <span>Sin Imagen Asignada.</span>
                  {!isPresentationMode && <span className="text-[10px] text-teal-400">Haz clic aquí para agregar imagen.</span>}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
            </div>

            <div className="space-y-4">
              {isPresentationMode ? (
                <h2 
                  className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-sm"
                  dangerouslySetInnerHTML={{ __html: slide.title }}
                />
              ) : (
                <SlideEditableText
                  key={`title-${activeIndex}`}
                  value={slide.title}
                  onChange={(val) => updateSlide(activeIndex, { title: val })}
                  className={`w-full bg-transparent border-none outline-none font-bold text-2xl md:text-3xl ${curTheme.text} placeholder-white/40 pb-1`}
                  placeholder="Introduce el título..."
                  tagName="h2"
                />
              )}
              
              {isPresentationMode ? (
                <ul className="space-y-3 text-lg md:text-2xl font-medium text-slate-200/90 pl-5 list-disc marker:text-emerald-400">
                  {slide.bullets.map((bullet, bIdx) => (
                    <li 
                      key={bIdx} 
                      className="leading-relaxed hover:text-white transition-colors"
                      dangerouslySetInnerHTML={{ __html: bullet }}
                    />
                  ))}
                </ul>
              ) : (
                <div className="max-h-[12rem] overflow-y-auto pr-1">
                  <ul className={`list-disc pl-5 space-y-2 text-base md:text-lg font-medium ${curTheme.text}/90`}>
                    {slide.bullets.map((bullet, bIdx) => (
                      <li key={bIdx}>
                        <SlideEditableText
                          key={`bullet-${activeIndex}-${bIdx}`}
                          value={bullet}
                          onChange={(val) => updateBullet(bIdx, val)}
                          className="w-full bg-transparent border-none outline-none pb-0.5"
                          placeholder="Escribe el punto clave..."
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );

      case 'media':
        return (
          <div 
            onClick={() => !isPresentationMode && setIsImageModalOpen(true)}
            className={`absolute inset-0 flex flex-col justify-end p-8 md:p-12 bg-cover bg-center rounded-2xl overflow-hidden animate-in fade-in duration-300 ${!isPresentationMode ? 'cursor-pointer' : ''}`} 
            style={{
              backgroundImage: slide.imageUrl ? `url("${slide.imageUrl}")` : 'url("https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1200&auto=format&fit=crop")',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />

            {!isPresentationMode && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageModalOpen(true);
                }}
                className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-900/80 border border-white/10 text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-lg backdrop-blur-sm"
              >
                <Camera className="h-3.5 w-3.5 text-teal-400" />
                <span>Cambiar Imagen</span>
              </button>
            )}

            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-2xl bg-slate-950/40 border border-white/10 p-6 md:p-8 rounded-2xl backdrop-blur-md shadow-2xl space-y-3.5 animate-in slide-in-from-bottom-6 duration-300"
            >
              {isPresentationMode ? (
                <h2 
                  className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow"
                  dangerouslySetInnerHTML={{ __html: slide.title }}
                />
              ) : (
                <SlideEditableText
                  key={`title-${activeIndex}`}
                  value={slide.title}
                  onChange={(val) => updateSlide(activeIndex, { title: val })}
                  className="w-full bg-transparent border-none outline-none font-bold text-2xl md:text-3xl text-white placeholder-white/40 pb-1"
                  placeholder="Introduce el título..."
                  tagName="h2"
                />
              )}
              
              {isPresentationMode ? (
                <ul className="space-y-2 text-base md:text-xl font-medium text-slate-200/90 pl-5 list-disc marker:text-teal-400">
                  {slide.bullets.map((bullet, bIdx) => (
                    <li 
                      key={bIdx} 
                      className="leading-relaxed hover:text-white transition-colors"
                      dangerouslySetInnerHTML={{ __html: bullet }}
                    />
                  ))}
                </ul>
              ) : (
                <div className="max-h-[8rem] overflow-y-auto pr-1">
                  <ul className="list-disc pl-5 space-y-1.5 text-sm md:text-base font-medium text-white/90">
                    {slide.bullets.map((bullet, bIdx) => (
                      <li key={bIdx}>
                        <SlideEditableText
                          key={`bullet-${activeIndex}-${bIdx}`}
                          value={bullet}
                          onChange={(val) => updateBullet(bIdx, val)}
                          className="w-full bg-transparent border-none outline-none pb-0.5"
                          placeholder="Escribe el punto clave..."
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="flex-1 flex flex-col justify-center my-auto w-full p-2 md:p-6 space-y-4 animate-in fade-in duration-300">
            {isPresentationMode ? (
              <h2 
                className="text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-2 text-center drop-shadow-sm"
                dangerouslySetInnerHTML={{ __html: slide.title }}
              />
            ) : (
              <SlideEditableText
                key={`title-${activeIndex}`}
                value={slide.title}
                onChange={(val) => updateSlide(activeIndex, { title: val })}
                className={`w-full bg-transparent border-none outline-none font-bold text-xl md:text-2xl text-center ${curTheme.text} placeholder-white/40 pb-1`}
                placeholder="Introduce el título de la tabla..."
                tagName="h2"
              />
            )}

            {slide.tableHtml ? (
              <div 
                className="max-h-[16rem] overflow-y-auto border border-white/10 rounded-xl shadow-lg bg-black/25 p-4 scrollbar-thin animate-in zoom-in-95 duration-300"
                dangerouslySetInnerHTML={{ __html: slide.tableHtml }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-white/20 rounded-xl bg-black/10 text-white/45 text-xs text-center gap-2 p-6">
                <Table2 className="h-10 w-10 text-white/20 animate-pulse" />
                <span>No hay celdas de tabla importadas.</span>
                {!isPresentationMode && <span className="text-[10px] text-teal-400 font-semibold">Usa el botón "Conectar Lienzos" para traer datos de Excel.</span>}
              </div>
            )}
          </div>
        );

      case 'chart':
        return (
          <div className="flex-1 flex flex-col justify-center my-auto w-full p-2 md:p-6 space-y-4 animate-in fade-in duration-300">
            {isPresentationMode ? (
              <h2 
                className="text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-2 text-center drop-shadow-sm"
                dangerouslySetInnerHTML={{ __html: slide.title }}
              />
            ) : (
              <SlideEditableText
                key={`title-${activeIndex}`}
                value={slide.title}
                onChange={(val) => updateSlide(activeIndex, { title: val })}
                className={`w-full bg-transparent border-none outline-none font-bold text-xl md:text-2xl text-center ${curTheme.text} placeholder-white/40 pb-1`}
                placeholder="Introduce el título del gráfico..."
                tagName="h2"
              />
            )}

            <div className="flex-1 flex items-center justify-center p-4 rounded-xl bg-black/20 border border-white/10 shadow-lg relative min-h-[220px]">
              {slide.chartConfig ? (
                renderSvgChart(slide.chartConfig)
              ) : (
                <div className="flex flex-col items-center justify-center text-white/45 text-xs text-center gap-2 p-6">
                  <BarChart3 className="h-10 w-10 text-white/20 animate-pulse" />
                  <span>No hay datos de gráfico configurados.</span>
                  {!isPresentationMode && <span className="text-[10px] text-teal-400 font-semibold">Usa el botón "Conectar Lienzos" para importar un gráfico de Excel.</span>}
                </div>
              )}
            </div>
          </div>
        );

      case 'bullets':
      default:
        return (
          <div className="my-auto space-y-6 z-10 animate-in fade-in duration-350">
            {isPresentationMode ? (
              <h1 
                className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-8 drop-shadow-sm"
                dangerouslySetInnerHTML={{ __html: slide.title }}
              />
            ) : (
              <SlideEditableText
                key={`title-${activeIndex}`}
                value={slide.title}
                onChange={(val) => updateSlide(activeIndex, { title: val })}
                className={`w-full bg-transparent border-none outline-none font-bold text-3xl md:text-4xl ${curTheme.text} placeholder-white/40 pb-1`}
                placeholder="Introduce el título de la diapositiva..."
                tagName="h1"
              />
            )}

            {isPresentationMode ? (
              <ul className="space-y-6 text-xl md:text-3xl font-medium text-slate-200/90 pl-6 list-disc marker:text-emerald-400">
                {slide.bullets.map((bullet, bIdx) => (
                  <li 
                    key={bIdx} 
                    className="leading-relaxed hover:text-white transition-colors duration-300"
                    dangerouslySetInnerHTML={{ __html: bullet }}
                  />
                ))}
              </ul>
            ) : (
              <div className="max-h-[16rem] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                <ul className={`list-disc pl-6 space-y-3 text-lg md:text-xl font-medium ${curTheme.text}/90`}>
                  {slide.bullets.map((bullet, bIdx) => (
                    <li key={bIdx}>
                      <SlideEditableText
                        key={`bullet-${activeIndex}-${bIdx}`}
                        value={bullet}
                        onChange={(val) => updateBullet(bIdx, val)}
                        className="w-full bg-transparent border-none outline-none pb-0.5"
                        placeholder="Escribe el punto clave..."
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
    }
  };

  const updateSlide = (idx: number, updatedFields: Partial<Slide>) => {
    const updated = slides.map((slide, sIdx) => 
      sIdx === idx ? { ...slide, ...updatedFields } : slide
    );
    setSlides(updated);
    onUpdate(JSON.stringify(updated));
  };

  const addSlide = () => {
    const newSlide: Slide = {
      title: 'Nueva Diapositiva',
      bullets: ['Punto clave 1', 'Punto clave 2'],
      theme: 'cobalt',
    };
    const updated = [...slides, newSlide];
    setSlides(updated);
    setActiveIndex(updated.length - 1);
    onUpdate(JSON.stringify(updated));
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    const updated = slides.filter((_, idx) => idx !== activeIndex);
    setSlides(updated);
    setActiveIndex(Math.max(0, activeIndex - 1));
    onUpdate(JSON.stringify(updated));
  };

  const updateBullet = (bulletIdx: number, val: string) => {
    const activeSlide = slides[activeIndex];
    if (!activeSlide) return;
    const updatedBullets = activeSlide.bullets.map((b, bIdx) => 
      bIdx === bulletIdx ? val : b
    );
    updateSlide(activeIndex, { bullets: updatedBullets });
  };

  const addBullet = () => {
    const activeSlide = slides[activeIndex];
    if (!activeSlide) return;
    updateSlide(activeIndex, { bullets: [...activeSlide.bullets, 'Nuevo punto clave'] });
  };

  const deleteBullet = (bulletIdx: number) => {
    const activeSlide = slides[activeIndex];
    if (!activeSlide || activeSlide.bullets.length <= 1) return;
    const updatedBullets = activeSlide.bullets.filter((_, bIdx) => bIdx !== bulletIdx);
    updateSlide(activeIndex, { bullets: updatedBullets });
  };

  const handleDownloadPptx = () => {
    const pptx = new pptxgen();
    pptx.title = title || 'Presentación';
    pptx.layout = 'LAYOUT_16x9';

    const pptxThemes = {
      cobalt: { bg: '0F172A', text: 'FFFFFF', accent: '3B82F6' },
      forest: { bg: '022C22', text: 'FFFFFF', accent: '10B981' },
      sunset: { bg: '451A03', text: 'FFFFFF', accent: 'F43F5E' },
      charcoal: { bg: '171717', text: 'FFFFFF', accent: '14B8A6' },
    };

    const stripHtml = (htmlStr: string) => {
      if (!htmlStr) return '';
      return htmlStr
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&middot;/g, "·")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
    };

    slides.forEach((slide, idx) => {
      const pSlide = pptx.addSlide();
      const themeName = slide.theme || 'cobalt';
      const themeColors = pptxThemes[themeName] || pptxThemes.cobalt;

      pSlide.background = { fill: themeColors.bg };

      // Header info
      pSlide.addText(`${title} - Diapositiva ${idx + 1}`, {
        x: 0.5,
        y: 0.3,
        w: '90%',
        h: 0.3,
        fontSize: 10,
        color: themeColors.accent,
        bold: true,
      });

      const layout = slide.layout || 'bullets';
      const cleanTitle = stripHtml(slide.title);

      if (layout === 'title') {
        pSlide.addText(cleanTitle, {
          x: 1.0,
          y: 2.2,
          w: 8.0,
          h: 2.0,
          fontSize: 40,
          color: themeColors.text,
          bold: true,
          align: 'center',
        });
        pSlide.addShape(pptx.shapes.RECTANGLE, {
          x: 4.5,
          y: 4.5,
          w: 1.0,
          h: 0.05,
          fill: { color: themeColors.accent },
        });
      } else if (layout === 'split') {
        if (slide.imageUrl) {
          pSlide.addImage({
            path: slide.imageUrl,
            x: 0.5,
            y: 1.2,
            w: 4.2,
            h: 4.5,
          });
        } else {
          pSlide.addShape(pptx.shapes.RECTANGLE, {
            x: 0.5,
            y: 1.2,
            w: 4.2,
            h: 4.5,
            fill: { color: '22252A' },
          });
          pSlide.addText('Sin Imagen', {
            x: 0.5,
            y: 3.2,
            w: 4.2,
            h: 0.5,
            fontSize: 14,
            color: '888888',
            align: 'center',
          });
        }

        pSlide.addText(cleanTitle, {
          x: 5.2,
          y: 1.2,
          w: 4.3,
          h: 1.0,
          fontSize: 26,
          color: themeColors.text,
          bold: true,
        });

        const bulletObjects = slide.bullets.map((b) => ({
          text: stripHtml(b),
          options: { bullet: true, color: themeColors.text, fontSize: 16 },
        }));

        if (bulletObjects.length > 0) {
          pSlide.addText(bulletObjects, {
            x: 5.2,
            y: 2.3,
            w: 4.3,
            h: 3.4,
          });
        }
      } else if (layout === 'media') {
        if (slide.imageUrl) {
          pSlide.background = { fill: '000000' };
          pSlide.addImage({
            path: slide.imageUrl,
            x: 0,
            y: 0,
            w: 10.0,
            h: 5.625,
          });
        }

        pSlide.addShape(pptx.shapes.RECTANGLE, {
          x: 0.8,
          y: 2.5,
          w: 8.4,
          h: 2.5,
          fill: { color: '000000', transparency: 40 },
        });

        pSlide.addText(cleanTitle, {
          x: 1.2,
          y: 2.7,
          w: 7.6,
          h: 0.6,
          fontSize: 28,
          color: 'FFFFFF',
          bold: true,
        });

        const bulletObjects = slide.bullets.map((b) => ({
          text: stripHtml(b),
          options: { bullet: true, color: 'FFFFFF', fontSize: 16 },
        }));

        if (bulletObjects.length > 0) {
          pSlide.addText(bulletObjects, {
            x: 1.2,
            y: 3.5,
            w: 7.6,
            h: 1.3,
          });
        }
      } else if (layout === 'table') {
        pSlide.addText(cleanTitle, {
          x: 0.5,
          y: 0.8,
          w: 9.0,
          h: 0.8,
          fontSize: 26,
          color: themeColors.text,
          bold: true,
        });

        const rows: string[][] = [];
        if (slide.tableHtml) {
          const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
          const tdRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g;
          let trMatch;
          while ((trMatch = trRegex.exec(slide.tableHtml)) !== null) {
            const rowData: string[] = [];
            let tdMatch;
            const innerHtml = trMatch[1];
            while ((tdMatch = tdRegex.exec(innerHtml)) !== null) {
              rowData.push(stripHtml(tdMatch[1]).trim());
            }
            if (rowData.length > 0) {
              rows.push(rowData);
            }
          }
        }

        if (rows.length > 0) {
          const formattedRows = rows.map((row) =>
            row.map((cell) => ({
              text: cell,
              options: {
                color: themeColors.text,
                fontSize: 11,
                fill: { color: themeColors.bg },
                border: { pt: 1, color: '444444' },
                align: 'center' as const,
              },
            }))
          );
          pSlide.addTable(formattedRows, {
            x: 0.5,
            y: 1.8,
            w: 9.0,
            h: 3.5,
          });
        } else {
          pSlide.addText('Sin datos de tabla', {
            x: 0.5,
            y: 2.5,
            w: 9.0,
            h: 1.0,
            fontSize: 16,
            color: '888888',
            align: 'center',
          });
        }
      } else if (layout === 'chart') {
        pSlide.addText(cleanTitle, {
          x: 0.5,
          y: 0.8,
          w: 9.0,
          h: 0.8,
          fontSize: 26,
          color: themeColors.text,
          bold: true,
        });

        if (slide.chartConfig && slide.chartConfig.data) {
          const chartData = slide.chartConfig.data;
          const labels = chartData.map((d) => d.label);
          const values = chartData.map((d) => d.val);

          const chartDataForPptx = [
            {
              name: slide.chartConfig.title || 'Métricas',
              labels: labels,
              values: values,
            },
          ];

          let pptxChartType = pptx.ChartType.bar;
          if (slide.chartConfig.type === 'line') pptxChartType = pptx.ChartType.line;
          if (slide.chartConfig.type === 'pie') pptxChartType = pptx.ChartType.pie;

          pSlide.addChart(pptxChartType, chartDataForPptx, {
            x: 1.0,
            y: 1.8,
            w: 8.0,
            h: 3.5,
            showLegend: true,
            legendPos: 'b',
            title: slide.chartConfig.title,
            titleColor: themeColors.text,
            titleFontSize: 12,
          });
        } else {
          pSlide.addText('Sin datos de gráfico', {
            x: 0.5,
            y: 2.5,
            w: 9.0,
            h: 1.0,
            fontSize: 16,
            color: '888888',
            align: 'center',
          });
        }
      } else {
        pSlide.addText(cleanTitle, {
          x: 0.5,
          y: 1.0,
          w: 9.0,
          h: 0.8,
          fontSize: 32,
          color: themeColors.text,
          bold: true,
        });

        const bulletObjects = slide.bullets.map((b) => ({
          text: stripHtml(b),
          options: { bullet: true, color: themeColors.text, fontSize: 18 },
        }));

        if (bulletObjects.length > 0) {
          pSlide.addText(bulletObjects, {
            x: 0.5,
            y: 2.0,
            w: 9.0,
            h: 3.2,
          });
        }
      }
    });

    const cleanFileName = `${title.replace(/[^a-zA-Z0-9-_]/g, '_') || 'presentacion'}.pptx`;
    pptx.writeFile({ fileName: cleanFileName });
  };

  const handleDownloadPdf = () => {
    const slidesHtml = slides.map((slide, idx) => {
      let themeBgCss = '';
      if (slide.theme === 'forest') {
        themeBgCss = 'background: linear-gradient(135deg, #022c22 0%, #0f172a 100%); color: #fff;';
      } else if (slide.theme === 'sunset') {
        themeBgCss = 'background: linear-gradient(135deg, #451a03 0%, #4c0519 100%); color: #fff;';
      } else if (slide.theme === 'charcoal') {
        themeBgCss = 'background: linear-gradient(135deg, #171717 0%, #0a0a0a 100%); color: #fff;';
      } else {
        themeBgCss = 'background: linear-gradient(135deg, #0f172a 0%, #082f49 100%); color: #fff;';
      }

      return `
        <div class="slide-page" style="page-break-after:always; width: 100%; height: 100vh; display: flex; flex-direction: column; justify-content: center; box-sizing: border-box; padding: 60px; ${themeBgCss}">
          <div style="font-size: 14px; opacity: 0.5; margin-bottom: 20px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase;">
            ${title} &middot; Diapositiva ${idx + 1}
          </div>
          <h1 style="font-size: 42px; line-height: 1.2; margin: 0 0 40px 0; font-family: 'Outfit', 'Inter', sans-serif; font-weight: 800; border-bottom: 3px solid rgba(255,255,255,0.1); padding-bottom: 20px;">
            ${slide.title}
          </h1>
          <ul style="font-size: 24px; line-height: 1.6; margin: 0; padding-left: 20px; font-family: 'Inter', sans-serif;">
            ${slide.bullets.map(b => `<li style="margin-bottom: 18px;">${b}</li>`).join('')}
          </ul>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Outfit:wght@800&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
          .slide-page { position: relative; overflow: hidden; }
          @media print {
            .slide-page { height: 100vh; page-break-after: always !important; }
            @page { size: landscape; margin: 0; }
          }
        </style>
      </head>
      <body>
        ${slidesHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  useEffect(() => {
    if (onRegisterDownload) {
      onRegisterDownload(handleDownloadPptx);
    }
  }, [onRegisterDownload, slides, title]);

  const activeSlide = slides[activeIndex];
  const activeTheme = activeSlide ? THEMES[activeSlide.theme || 'cobalt'] : THEMES.cobalt;

  // Handle clics on left/right screen in full presentation
  const handlePresentationClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width * 0.7) {
      // Go Next
      setActiveIndex((prev) => Math.min(slides.length - 1, prev + 1));
    } else if (x < rect.width * 0.3) {
      // Go Prev
      setActiveIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (showLaser) {
      setLaserPos({ x: e.clientX, y: e.clientY });
    }
  };

  // Render Portal for Cinematic full screen presentation mode
  const renderPresentationPortal = () => {
    if (!isPresenting || !activeSlide) return null;
    const curTheme = THEMES[activeSlide.theme || 'cobalt'];

    return createPortal(
      <div 
        className={`fixed inset-0 z-[99999999] flex flex-col justify-between p-10 md:p-16 select-none cursor-none ${curTheme.bg} animate-in fade-in duration-300`}
        onMouseMove={handleMouseMove}
        onClick={handlePresentationClick}
      >
        {/* Glow lights in backgrounds (WAPPY rules) */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Laser pointer element */}
        {showLaser && (
          <div 
            className="pointer-events-none fixed z-[99999999] -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ease-out"
            style={{ left: laserPos.x, top: laserPos.y }}
          >
            <div className="absolute inset-0 w-8 h-8 -m-4 rounded-full bg-rose-500/20 blur-md animate-pulse shadow-[0_0_15px_#f43f5e]" />
            <div className="absolute inset-0 w-6 h-6 -m-3 rounded-full border border-rose-500 bg-rose-500/30 shadow-[0_0_10px_#f43f5e]" />
            <div className="absolute inset-0 w-2.5 h-2.5 -m-1 rounded-full bg-white shadow-[0_0_5px_#fff]" />
          </div>
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 z-10">
          <span className="text-sm font-mono font-bold tracking-widest text-white/50 uppercase">
            Diapositiva {activeIndex + 1} de {slides.length}
          </span>
          <span className="text-sm font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent truncate max-w-xs sm:max-w-md">
            {title}
          </span>
        </div>

        {/* Central Core Content (Fluid text animation with transition layout) */}
        <div className="my-auto max-w-5xl mx-auto w-full z-10 py-8 flex flex-col relative h-[65vh] justify-center">
          {renderSlideContent(activeSlide, true)}
        </div>

        {/* Floating Bottom Navigation Bar (Glassmorphism + Progress bar) */}
        <div 
          className="relative z-20 mx-auto bg-slate-900/80 border border-white/10 p-4 rounded-2xl backdrop-blur-md shadow-2xl flex items-center justify-between w-full max-w-xl cursor-default"
          onClick={(e) => e.stopPropagation()} // Stop navigation click
        >
          {/* Progress bar filled */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 rounded-t-2xl overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300"
              style={{ width: `${((activeIndex + 1) / slides.length) * 100}%` }}
            />
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeIndex === 0}
              className="p-2 rounded-xl border border-white/5 bg-white/5 text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all cursor-pointer"
              title="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-slate-300 px-2 select-none">
              {activeIndex + 1} / {slides.length}
            </span>
            <button
              onClick={() => setActiveIndex((prev) => Math.min(slides.length - 1, prev + 1))}
              disabled={activeIndex === slides.length - 1}
              className="p-2 rounded-xl border border-white/5 bg-white/5 text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all cursor-pointer"
              title="Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {/* Virtual Laser Pointer Toggle */}
            <button
              onClick={() => {
                setShowLaser(!showLaser);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                showLaser 
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 ring-1 ring-rose-500/20 shadow-lg shadow-rose-500/10' 
                  : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
              }`}
              title="Puntero Láser"
            >
              <Target className={`h-4 w-4 ${showLaser ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">Láser</span>
            </button>

            {/* Exit button */}
            <button
              onClick={() => {
                setIsPresenting(false);
                setShowLaser(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white/5 border border-white/5 text-slate-300 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 rounded-xl transition-all cursor-pointer"
              title="Salir"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const renderImageModal = () => {
    if (!isImageModalOpen || !activeSlide) return null;

    return createPortal(
      <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl text-white flex flex-col gap-5 overflow-hidden animate-in zoom-in-95 duration-200">
          
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-white/5 pb-3.5 z-10">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-teal-400" />
              <h3 className="text-base font-extrabold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Agregar Imagen a Diapositiva
              </h3>
            </div>
            <button
              onClick={() => {
                setIsImageModalOpen(false);
                stopCamera();
              }}
              className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-none outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex bg-slate-950/80 border border-white/5 p-1 rounded-2xl z-10">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer border-none outline-none flex items-center justify-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Cargar PC</span>
            </button>
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer border-none outline-none flex items-center justify-center gap-1.5 ${
                activeTab === 'camera'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              <Video className="h-3.5 w-3.5" />
              <span>Tomar Foto</span>
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer border-none outline-none flex items-center justify-center gap-1.5 ${
                activeTab === 'url'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>Enlace URL</span>
            </button>
          </div>

          <div className="z-10 min-h-[200px] flex flex-col justify-center">
            {activeTab === 'upload' && (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all gap-3 bg-slate-950/40 text-center ${
                  isDragging 
                    ? 'border-teal-400 bg-teal-500/5' 
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="p-3 bg-teal-500/10 text-teal-400 rounded-full border border-teal-500/20">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">Arrastra tu archivo aquí o</p>
                  <p className="text-[10px] text-slate-400 mt-1">Soporta formatos PNG, JPG, WEBP de alta resolución</p>
                </div>
                <label className="mt-2 px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95">
                  Seleccionar Archivo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {activeTab === 'camera' && (
              <div className="flex flex-col items-center gap-4">
                {cameraError ? (
                  <div className="text-xs text-rose-400 font-semibold p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl w-full text-center">
                    {cameraError}
                  </div>
                ) : (
                  <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute inset-4 border border-white/5 pointer-events-none rounded-xl" />
                    <div className="absolute top-1/2 left-4 right-4 h-px bg-white/5 pointer-events-none" />
                    <div className="absolute left-1/2 top-4 bottom-4 w-px bg-white/5 pointer-events-none" />
                    
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2 py-1 bg-rose-600/80 border border-rose-500/20 text-white rounded-lg text-[9px] font-bold tracking-wider uppercase animate-pulse">
                      <div className="h-1.5 w-1.5 bg-white rounded-full" />
                      <span>REC</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={capturePhoto}
                  disabled={!!cameraError || !stream}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-extrabold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-2xl shadow-lg border-none outline-none transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  <span>Capturar Foto</span>
                </button>
              </div>
            )}

            {activeTab === 'url' && (
              <div className="flex flex-col gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Enlace Web de Imagen</label>
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://ejemplo.com/mi-imagen.png"
                    className="w-full h-10 px-3 text-xs bg-slate-950 border border-white/10 rounded-xl outline-none focus:border-teal-500 text-white placeholder-slate-500 transition-colors font-sans"
                  />
                </div>
                
                <button
                  onClick={() => {
                    if (inputUrl.trim()) {
                      saveImageToSlide(inputUrl.trim());
                    }
                  }}
                  className="w-full py-2.5 px-4 text-xs font-extrabold bg-teal-600 hover:bg-teal-700 text-white rounded-2xl shadow-md border-none outline-none transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Confirmar Enlace
                </button>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Reduced workspace view (standard layout)
  if (!isMaximized) {
    return (
      <div className="flex-1 flex flex-col h-full bg-surface-secondary/40 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        <div className="flex items-center justify-between px-1 shrink-0">
          <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Diapositivas</div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsBridgeOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-extrabold border border-teal-500/20 bg-teal-500/10 text-teal-400 hover:bg-teal-500/15 rounded-xl transition-all duration-300 cursor-pointer"
              title="Conectar Lienzos"
            >
              <Link2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Conectar</span>
            </button>
            <button
              onClick={() => setIsPresenting(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md shadow-teal-600/10 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-teal-500/20"
            >
              <MonitorPlay className="h-3.5 w-3.5" />
              <span>Presentar</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 max-w-md mx-auto w-full pb-8">
          {slides.map((slide, idx) => {
            const slideTheme = THEMES[slide.theme || 'cobalt'];
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-full text-left rounded-2xl border p-3 transition-all relative overflow-hidden group bg-surface-primary shadow-sm ${
                  isActive 
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md scale-[1.01]' 
                    : 'border-border-medium hover:border-border-hover hover:scale-[1.01]'
                }`}
              >
                <div className={`h-28 w-full rounded-xl ${slideTheme.bg} p-4 flex flex-col justify-between overflow-hidden shadow-inner`}>
                  <div 
                    className={`text-xs font-bold ${slideTheme.text} leading-snug`}
                    dangerouslySetInnerHTML={{ __html: slide.title }}
                  />
                  <div className="space-y-1.5 my-auto pt-2">
                    {slide.bullets.slice(0, 2).map((_, bIdx) => (
                      <div key={bIdx} className="h-1 w-2/3 bg-white/20 rounded-full" />
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-semibold text-text-secondary px-0.5">
                  <span>Slide {idx + 1}</span>
                  <span className="capitalize opacity-60">{slide.theme}</span>
                </div>
              </button>
            );
          })}
        </div>
        {renderPresentationPortal()}
      </div>
    );
  }

  // Maximized expanded workspace view
  return (
    <div className="flex h-full bg-surface-primary text-text-primary overflow-hidden relative">
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {isMaximized && sidebarOpen && (
        <div 
          className="sm:hidden absolute inset-0 bg-black/30 backdrop-blur-[2px] z-[440] transition-opacity duration-300 animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Slides Thumbnail Sidebar */}
      {isMaximized && (
        <div 
          className={`flex-shrink-0 border-r border-border-medium bg-surface-secondary flex flex-col justify-between transition-all duration-300 absolute inset-y-0 left-0 z-[450] sm:relative sm:z-0 ${
            sidebarOpen ? 'w-48 sm:w-56 md:w-64' : 'w-0 overflow-hidden border-r-0'
          }`}
        >
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider px-1">Diapositivas</div>
            {slides.map((slide, idx) => {
              const slideTheme = THEMES[slide.theme || 'cobalt'];
              const isActive = idx === activeIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full text-left rounded-xl border p-2 transition-all relative overflow-hidden group ${
                    isActive 
                      ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' 
                      : 'border-border-medium hover:border-border-hover bg-surface-primary'
                  }`}
                >
                  <div className={`h-16 w-full rounded-lg ${slideTheme.bg} p-2 flex flex-col justify-between overflow-hidden shadow-inner`}>
                    <div 
                      className={`text-[8px] font-bold ${slideTheme.text} truncate`}
                      dangerouslySetInnerHTML={{ __html: slide.title }}
                    />
                    <div className="space-y-0.5">
                      {slide.bullets.slice(0, 2).map((_, bIdx) => (
                        <div key={bIdx} className="h-1 w-2/3 bg-white/20 rounded-full" />
                      ))}
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-text-secondary px-0.5">
                    <span>Slide {idx + 1}</span>
                    <span className="capitalize opacity-60">{slide.theme}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sidebar Actions */}
          <div className="p-3 border-t border-border-medium bg-surface-primary flex flex-col gap-2 shrink-0">
            {/* New Present button in maximized sidebar actions */}
            <button
              onClick={() => setIsPresenting(true)}
              className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-md shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-teal-600 hover:bg-teal-700 text-white w-full border-teal-500/20 shadow-teal-500/10"
              aria-label="Iniciar Presentación"
            >
              <div className="relative flex-shrink-0 flex items-center justify-center text-white">
                <MonitorPlay className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-sm font-bold tracking-wide text-white">
                  Iniciar Presentación
                </span>
              </div>
            </button>

            <button
              onClick={() => setIsBridgeOpen(true)}
              className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-teal-500/30 hover:bg-teal-50/10 text-teal-600 w-full"
              aria-label="Conectar Lienzos"
            >
              <div className="relative flex-shrink-0 flex items-center justify-center text-teal-600">
                <Link2 className="h-4 w-4 text-teal-600" />
              </div>
              <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-sm font-bold tracking-wide text-teal-600">
                  Conectar Lienzos
                </span>
              </div>
            </button>

            <button
              onClick={addSlide}
              className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary w-full"
              aria-label="Nueva Diapositiva"
            >
              <div className="relative flex-shrink-0 flex items-center justify-center text-text-primary">
                <Plus className="h-4 w-4 text-text-primary" />
              </div>
              <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-sm font-bold tracking-wide text-text-primary">
                  Nueva Diapositiva
                </span>
              </div>
            </button>

            <button
              onClick={deleteSlide}
              disabled={slides.length <= 1}
              className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-red-500/20 hover:bg-red-50 text-red-600 disabled:hover:bg-surface-primary disabled:border-red-500/20 disabled:text-red-600 w-full"
              aria-label="Eliminar Activa"
            >
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-500" />
              </div>
              <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-sm font-bold tracking-wide">
                  Eliminar Activa
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button for Sidebar - ONLY visible when maximized */}
      {isMaximized && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`absolute top-1/2 -translate-y-1/2 z-[460] h-14 w-5 bg-surface-primary border border-border-medium hover:bg-surface-hover shadow-md rounded-r-lg flex items-center justify-center transition-all duration-300 ${
            sidebarOpen 
              ? 'left-[191px] sm:left-[223px] md:left-[255px]' 
              : 'left-0 border-l-0'
          }`}
          title={sidebarOpen ? 'Contraer Panel Lateral' : 'Expandir Panel Lateral'}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-3.5 w-3.5 text-text-secondary" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-text-secondary" />
          )}
        </button>
      )}

      {/* Main Slide Editor */}
      <div className="flex-1 flex flex-col bg-surface-secondary/40 overflow-hidden">
        {activeSlide ? (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
            {/* Rich Text Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-surface-primary/80 border border-border-medium rounded-2xl shadow-sm backdrop-blur-md z-20 shrink-0">
              <div className="flex flex-wrap items-center gap-1">
                {/* Text Formatting Group */}
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCmd('bold')}
                  className="p-2 text-text-secondary hover:text-teal-600 hover:bg-teal-50/10 rounded-xl transition-all cursor-pointer"
                  title="Negrita"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCmd('italic')}
                  className="p-2 text-text-secondary hover:text-teal-600 hover:bg-teal-50/10 rounded-xl transition-all cursor-pointer"
                  title="Cursiva"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCmd('underline')}
                  className="p-2 text-text-secondary hover:text-teal-600 hover:bg-teal-50/10 rounded-xl transition-all cursor-pointer"
                  title="Subrayado"
                >
                  <Underline className="h-4 w-4" />
                </button>

                <div className="h-4 w-px bg-border-medium mx-1" />

                {/* Alignment Group */}
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCmd('justifyLeft')}
                  className="p-2 text-text-secondary hover:text-teal-600 hover:bg-teal-50/10 rounded-xl transition-all cursor-pointer"
                  title="Alinear a la Izquierda"
                >
                  <AlignLeft className="h-4 w-4" />
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCmd('justifyCenter')}
                  className="p-2 text-text-secondary hover:text-teal-600 hover:bg-teal-50/10 rounded-xl transition-all cursor-pointer"
                  title="Centrar"
                >
                  <AlignCenter className="h-4 w-4" />
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCmd('justifyRight')}
                  className="p-2 text-text-secondary hover:text-teal-600 hover:bg-teal-50/10 rounded-xl transition-all cursor-pointer"
                  title="Alinear a la Derecha"
                >
                  <AlignRight className="h-4 w-4" />
                </button>

                <div className="h-4 w-px bg-border-medium mx-1" />

                {/* Lists Group */}
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCmd('insertUnorderedList')}
                  className="p-2 text-text-secondary hover:text-teal-600 hover:bg-teal-50/10 rounded-xl transition-all cursor-pointer"
                  title="Lista de Viñetas"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCmd('insertOrderedList')}
                  className="p-2 text-text-secondary hover:text-teal-600 hover:bg-teal-50/10 rounded-xl transition-all cursor-pointer"
                  title="Lista Numerada"
                >
                  <ListOrdered className="h-4 w-4" />
                </button>

                <div className="h-4 w-px bg-border-medium mx-1" />

                {/* Headings Group */}
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCmd('formatBlock', '<h1>')}
                  className="p-2 text-text-secondary hover:text-teal-600 hover:bg-teal-50/10 rounded-xl transition-all font-bold text-xs cursor-pointer"
                  title="Título Principal (H1)"
                >
                  <Heading1 className="h-4 w-4" />
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCmd('formatBlock', '<h2>')}
                  className="p-2 text-text-secondary hover:text-teal-600 hover:bg-teal-50/10 rounded-xl transition-all font-bold text-xs cursor-pointer"
                  title="Subtítulo (H2)"
                >
                  <Heading2 className="h-4 w-4" />
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const size = prompt('Ingresa tamaño de letra (1-7):', '4');
                    if (size) execCmd('fontSize', size);
                  }}
                  className="px-2 py-1 text-[11px] font-extrabold text-text-secondary hover:text-teal-600 hover:bg-teal-50/10 rounded-xl transition-all flex items-center gap-0.5 cursor-pointer"
                  title="Tamaño de Letra"
                >
                  <span>Tamaño</span>
                </button>

                <div className="h-4 w-px bg-border-medium mx-1" />

                {/* Add Link */}
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const url = prompt('Ingresa la URL del enlace:');
                    if (url) execCmd('createLink', url);
                  }}
                  className="p-2 text-text-secondary hover:text-teal-600 hover:bg-teal-50/10 rounded-xl transition-all cursor-pointer"
                  title="Insertar Enlace"
                >
                  <Link2 className="h-4 w-4" />
                </button>
              </div>

              {/* Multimedia Group */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsImageModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/15 rounded-xl transition-all duration-300 cursor-pointer"
                  title="Agregar Imagen (PC / Cámara)"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Imagen / Foto</span>
                </button>
              </div>
            </div>

            {/* Live Interactive Slide Preview */}
            <div className={`aspect-[16/9] w-full rounded-2xl shadow-xl border ${activeTheme.bg} ${activeTheme.border} p-8 flex flex-col justify-between relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Layout className="h-24 w-24" />
              </div>
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-mono font-bold tracking-widest text-white/50 uppercase">Diapositiva {activeIndex + 1} / {slides.length}</span>
                <span className="text-xs font-mono font-bold tracking-widest text-white/50 uppercase">{title}</span>
              </div>
              
              <div className="my-auto w-full flex-1 flex flex-col justify-center z-10 relative overflow-hidden">
                {renderSlideContent(activeSlide, false)}
              </div>

              <div className="flex justify-between items-center text-xs font-semibold text-white/40 z-10 border-t border-white/5 pt-4">
                <span>Wappy Canvas Presentation</span>
                <span>SST Pro</span>
              </div>
            </div>

            {/* Collapsible toggle pill & Settings */}
            {isMaximized && (
              <>
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary"
                    aria-label={showSettings ? 'Ocultar Opciones' : 'Mostrar Opciones'}
                  >
                    <div className="relative flex-shrink-0 flex items-center justify-center text-text-primary">
                      <Layout className="h-4 w-4 text-text-primary" />
                    </div>
                    <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[250px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                      <span className="text-sm font-bold tracking-wide text-text-primary">
                        {showSettings ? 'Ocultar Opciones' : 'Mostrar Opciones'}
                      </span>
                    </div>
                  </button>
                </div>

                {showSettings && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-primary border border-border-medium rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-4">
                      {/* Slide Layout Selector */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-text-secondary uppercase block">Diseño de Diapositiva (Layout)</span>
                        <div className="grid grid-cols-3 gap-2">
                          {(['title', 'bullets', 'split', 'media', 'table', 'chart'] as const).map((l) => (
                            <button
                              key={l}
                              onClick={() => updateSlide(activeIndex, { layout: l })}
                              className={`py-1.5 px-1 text-[10px] font-bold border rounded-xl capitalize transition-all ${
                                (activeSlide.layout || 'bullets') === l
                                  ? 'border-teal-500 bg-teal-500/5 ring-1 ring-teal-500/20 text-teal-600'
                                  : 'border-border-medium hover:bg-surface-hover text-text-secondary'
                              }`}
                            >
                              {l === 'title' ? 'Título' : l === 'bullets' ? 'Viñetas' : l === 'split' ? 'Split' : l === 'media' ? 'Imagen' : l === 'table' ? 'Tabla' : 'Gráfico'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Image URL Input if split or media layout */}
                      {((activeSlide.layout === 'split' || activeSlide.layout === 'media') && (
                        <div className="space-y-1.5 animate-in fade-in duration-200">
                          <label className="block text-[10px] font-bold text-text-secondary uppercase">URL de Imagen de Fondo/Lateral</label>
                          <input
                            type="text"
                            value={activeSlide.imageUrl || ''}
                            onChange={(e) => updateSlide(activeIndex, { imageUrl: e.target.value })}
                            placeholder="https://ejemplo.com/imagen.png"
                            className="w-full h-9 px-3 text-xs bg-surface-secondary border border-border-medium rounded-lg outline-none focus:border-teal-500 transition-colors"
                          />
                        </div>
                      ))}

                      {/* Default bullets configuration list */}
                      {(activeSlide.layout === 'bullets' || activeSlide.layout === 'split' || activeSlide.layout === 'media' || !activeSlide.layout) && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-text-secondary uppercase">Puntos Clave (Viñetas)</span>
                            <button
                              onClick={addBullet}
                              className="flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:underline"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Agregar punto</span>
                            </button>
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                            {activeSlide.bullets.map((bullet, bIdx) => (
                              <div key={bIdx} className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                                <input
                                  type="text"
                                  value={bullet}
                                  onChange={(e) => updateBullet(bIdx, e.target.value)}
                                  className="flex-1 h-9 px-3 text-xs bg-surface-secondary border border-border-medium rounded-lg outline-none focus:border-teal-500 transition-colors"
                                />
                                <button
                                  onClick={() => deleteBullet(bIdx)}
                                  disabled={activeSlide.bullets.length <= 1}
                                  className="p-2 text-text-tertiary hover:text-red-500 disabled:opacity-40 transition-colors"
                                  title="Eliminar punto"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <span className="text-xs font-bold text-text-secondary uppercase block">Estilos y Temas de Color</span>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((tKey) => {
                          const themeObj = THEMES[tKey];
                          const isSelected = activeSlide.theme === tKey;
                          return (
                            <button
                              key={tKey}
                              onClick={() => updateSlide(activeIndex, { theme: tKey })}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                isSelected 
                                  ? 'border-teal-500 bg-teal-500/5 ring-1 ring-teal-500/20' 
                                  : 'border-border-medium hover:bg-surface-hover'
                              }`}
                            >
                              <div className={`h-4 w-4 rounded-full ${themeObj.bg} border border-white/20`} />
                              <span className="capitalize">{tKey}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-border-medium/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-tertiary flex items-center gap-1.5 font-medium">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Descargar PowerPoint
                          </span>
                          <button
                            onClick={handleDownloadPptx}
                            className="group flex flex-shrink-0 items-center justify-center h-10 px-3 transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold"
                            aria-label="Descargar PowerPoint (.pptx)"
                          >
                            <Download className="h-4 w-4 mr-1.5" />
                            <span className="text-xs font-extrabold">PPTX</span>
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-tertiary flex items-center gap-1.5 font-medium">
                            <MonitorPlay className="h-3.5 w-3.5 text-teal-500" /> Exportar PDF (Imprimir)
                          </span>
                          <button
                            onClick={handleDownloadPdf}
                            className="group flex flex-shrink-0 items-center justify-center h-10 px-3 transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-border-medium hover:bg-surface-hover text-text-secondary font-bold"
                            aria-label="Exportar PDF / Imprimir"
                          >
                            <span className="text-xs font-bold">PDF</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-sm text-text-tertiary font-medium">Cargando diapositiva activa...</span>
          </div>
        )}
      </div>
      {renderPresentationPortal()}
      {renderImageModal()}
      {isBridgeOpen && (
        <CanvasWorkspaceBridge
          onClose={() => setIsBridgeOpen(false)}
          onImportTable={handleImportTable}
          onImportChart={handleImportChart}
          onImportBullets={handleImportBullets}
          activeFileType="presentation"
        />
      )}
    </div>
  );
};

export default CanvasSlidesEditor;
