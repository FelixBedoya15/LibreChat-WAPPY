import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layout, MonitorPlay, Palette, Download, Sparkles } from 'lucide-react';

interface Slide {
  title: string;
  bullets: string[];
  theme?: 'cobalt' | 'forest' | 'sunset' | 'charcoal';
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
 * Deals with markdown wrapping (e.g. ```json ... ```) and trailing commas/comments.
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

const CanvasSlidesEditor: React.FC<CanvasSlidesEditorProps> = ({ initialContent, onUpdate, title, isMaximized = false, onRegisterDownload }) => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(true);

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

  // Export as beautiful print presentation PDF / HTML
  const handleDownloadPdf = () => {
    const slidesHtml = slides.map((slide, idx) => {
      const activeTheme = THEMES[slide.theme || 'cobalt'];
      
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
      onRegisterDownload(handleDownloadPdf);
    }
  }, [onRegisterDownload, slides, title]);

  const activeSlide = slides[activeIndex];
  const activeTheme = activeSlide ? THEMES[activeSlide.theme || 'cobalt'] : THEMES.cobalt;

  if (!isMaximized) {
    return (
      <div className="flex-1 flex flex-col h-full bg-surface-secondary/40 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider px-1">Diapositivas</div>
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
                {/* Visual mini-slide representation */}
                <div className={`h-28 w-full rounded-xl ${slideTheme.bg} p-4 flex flex-col justify-between overflow-hidden shadow-inner`}>
                  <div className={`text-xs font-bold ${slideTheme.text} leading-snug`}>{slide.title}</div>
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
      </div>
    );
  }

  return (
    <div className="flex h-full bg-surface-primary text-text-primary overflow-hidden">
      {/* Slides Thumbnail Sidebar - ONLY visible when maximized (expanded) */}
      {isMaximized && (
        <div className="w-48 sm:w-56 md:w-64 border-r flex-shrink-0 border-border-medium bg-surface-secondary flex flex-col justify-between">
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
                  {/* Visual mini-slide representation */}
                  <div className={`h-16 w-full rounded-lg ${slideTheme.bg} p-2 flex flex-col justify-between overflow-hidden shadow-inner`}>
                    <div className={`text-[8px] font-bold ${slideTheme.text} truncate`}>{slide.title}</div>
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
          <div className="p-3 border-t border-border-medium bg-surface-primary flex flex-col gap-2">
            <button
              onClick={addSlide}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Diapositiva</span>
            </button>
            <button
              onClick={deleteSlide}
              disabled={slides.length <= 1}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold border border-border-medium hover:bg-surface-hover disabled:opacity-40 rounded-xl transition-colors"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
              <span>Eliminar Activa</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Slide Editor */}
      <div className="flex-1 flex flex-col bg-surface-secondary/40 overflow-hidden">
        {activeSlide ? (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
            {/* Live Interactive Slide Preview */}
            <div className={`aspect-[16/9] w-full rounded-2xl shadow-xl border ${activeTheme.bg} ${activeTheme.border} p-8 flex flex-col justify-between relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Layout className="h-24 w-24" />
              </div>
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-mono font-bold tracking-widest text-white/50 uppercase">Diapositiva {activeIndex + 1} / {slides.length}</span>
                <span className="text-xs font-mono font-bold tracking-widest text-white/50 uppercase">{title}</span>
              </div>
              
              <div className="my-auto space-y-6 z-10">
                {/* Inline Editable Title */}
                <input
                  type="text"
                  value={activeSlide.title}
                  onChange={(e) => updateSlide(activeIndex, { title: e.target.value })}
                  className={`w-full bg-transparent border-none outline-none font-bold text-3xl md:text-4xl ${activeTheme.text} placeholder-white/40 focus:border-b border-white/20 pb-1`}
                  placeholder="Introduce el título de la diapositiva..."
                />

                {/* Bullets presentation list with elegant custom scrollbar */}
                <div className="max-h-[16rem] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  <ul className={`list-disc pl-6 space-y-3 text-lg md:text-xl font-medium ${activeTheme.text}/90`}>
                    {activeSlide.bullets.map((bullet, bIdx) => (
                      <li key={bIdx}>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => updateBullet(bIdx, e.target.value)}
                          className="w-full bg-transparent border-none outline-none focus:border-b border-white/20 pb-0.5"
                          placeholder="Escribe el punto clave..."
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-semibold text-white/40 z-10 border-t border-white/5 pt-4">
                <span>Wappy Canvas Presentation</span>
                <span>SST Pro</span>
              </div>
            </div>

            {/* Collapsible toggle pill & Settings - ONLY visible when maximized (expanded) */}
            {isMaximized && (
              <>
                {/* Collapsible toggle pill/button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border-medium bg-surface-primary hover:bg-surface-hover text-text-secondary text-xs font-semibold shadow-sm transition-all transform hover:scale-105 active:scale-95"
                  >
                    <Layout className="h-3.5 w-3.5 text-blue-500" />
                    <span>{showSettings ? 'Ocultar Opciones de Edición' : 'Mostrar Opciones de Edición'}</span>
                  </button>
                </div>

                {/* Slide Configuration Settings */}
                {showSettings && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-primary border border-border-medium rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Bullet points editor list */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-secondary uppercase">Puntos Clave (Viñetas)</span>
                        <button
                          onClick={addBullet}
                          className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Agregar punto</span>
                        </button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {activeSlide.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                            <input
                              type="text"
                              value={bullet}
                              onChange={(e) => updateBullet(bIdx, e.target.value)}
                              className="flex-1 h-9 px-3 text-xs bg-surface-secondary border border-border-medium rounded-lg outline-none focus:border-blue-500 transition-colors"
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

                    {/* Slide Custom Theme Color Picker */}
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
                                  ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20' 
                                  : 'border-border-medium hover:bg-surface-hover'
                              }`}
                            >
                              <div className={`h-4 w-4 rounded-full ${themeObj.bg} border border-white/20`} />
                              <span className="capitalize">{tKey}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-border-medium/60 flex items-center justify-between">
                        <span className="text-xs text-text-tertiary flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-yellow-500" /> Preservación de formato landscape</span>
                        <button
                          onClick={handleDownloadPdf}
                          className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Descargar Diapositivas</span>
                        </button>
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
    </div>
  );
};

export default CanvasSlidesEditor;
