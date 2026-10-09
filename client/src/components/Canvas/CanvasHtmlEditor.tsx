import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRecoilState } from 'recoil';
import store from '~/store';
import { saveAs } from 'file-saver';
import { 
  Eye, 
  Code2, 
  Download, 
  Play, 
  Split, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Cpu, 
  Plus,
  Lock,
  Maximize,
  Minimize,
  ExternalLink,
  RotateCw
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { PREMIUM_SST_COMPONENTS } from './sstTemplates';

interface CanvasHtmlEditorProps {
  initialContent: string;
  onUpdate: (content: string) => void;
  title: string;
  isMaximized?: boolean;
  onRegisterDownload?: (fn: () => void) => void;
}

const renderIcon = (type: string, colorClass: string) => {
  switch (type) {
    case 'Cpu':
      return <Cpu className={`h-4 w-4 ${colorClass}`} />;
    case 'Layers':
      return <Layers className={`h-4 w-4 ${colorClass}`} />;
    case 'Plus':
      return <Plus className={`h-4 w-4 ${colorClass}`} />;
    case 'Eye':
      return <Eye className={`h-4 w-4 ${colorClass}`} />;
    case 'Sparkles':
      return <Sparkles className={`h-4 w-4 ${colorClass}`} />;
    default:
      return <Cpu className={`h-4 w-4 ${colorClass}`} />;
  }
};

/**
 * Limpia bloques de código o etiquetas residuales generadas por el LLM
 */
function cleanHtmlContent(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
  cleaned = cleaned.replace(/^```(?:html|xml)?\s*\n?([\s\S]*?)\n?```$/i, '$1').trim();
  return cleaned;
}

/**
 * Inyecta shims seguros y estilos base para que presentaciones interactivas (Reveal.js, Swiper, custom sliders)
 * y páginas HTML se rendericen de forma impecable sin excepciones dentro del iframe en vista previa.
 */
function preparePreviewHtml(html: string): string {
  if (!html) return '';
  let content = cleanHtmlContent(html);

  // Sanitizar cualquier SVG con path orgánico decorativo que use fill="currentColor" para evitar que pinte en negro
  content = content.replace(/(<svg[^>]*>[\s\S]*?<path[^>]*?)fill="currentColor"/gi, '$1fill="rgba(255,255,255,0.25)"');

  const hasHtml = /<html[^>]*>/i.test(content);
  const hasHead = /<head[^>]*>/i.test(content);

  const safeShim = `
<script>
(function() {
  // 1. Shims resilientes para librerías comunes (Tailwind, Lucide, Chart.js)
  // Evita 'ReferenceError: tailwind is not defined' si un bloqueador de anuncios o lentitud de red bloquea el CDN
  if (typeof window.tailwind === 'undefined') {
    window.tailwind = { config: {} };
  }
  if (typeof window.lucide === 'undefined') {
    window.lucide = {
      createIcons: function() {
        try {
          if (document.querySelectorAll) {
            var iconEls = document.querySelectorAll('[data-lucide], i[class*="lucide-"]');
          }
        } catch(e) {}
      }
    };
  }
  if (typeof window.Chart === 'undefined') {
    window.Chart = function() {
      return {
        destroy: function() {},
        update: function() {},
        resize: function() {},
        data: { datasets: [] }
      };
    };
  }

  // 2. Polyfill seguro y robusto para localStorage / sessionStorage en iframe sandboxed
  var _createMockStorage = function() {
    var _memStore = {};
    return {
      getItem: function(k) { return Object.prototype.hasOwnProperty.call(_memStore, k) ? _memStore[k] : null; },
      setItem: function(k, v) { _memStore[k] = String(v); },
      removeItem: function(k) { delete _memStore[k]; },
      clear: function() { _memStore = {}; },
      key: function(i) { return Object.keys(_memStore)[i] || null; },
      get length() { return Object.keys(_memStore).length; }
    };
  };

  try {
    var _testK = '__wappy_test__';
    window.localStorage.setItem(_testK, _testK);
    window.localStorage.removeItem(_testK);
  } catch (e) {
    try {
      var _mockLocal = _createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: _mockLocal,
        configurable: true,
        writable: true
      });
    } catch (errDef) {
      try { window.localStorage = _createMockStorage(); } catch (errAssign) {}
    }
  }

  try {
    var _sKey = '__wappy_stest__';
    window.sessionStorage.setItem(_sKey, _sKey);
    window.sessionStorage.removeItem(_sKey);
  } catch (e) {
    try {
      var _mockSession = _createMockStorage();
      Object.defineProperty(window, 'sessionStorage', {
        value: _mockSession,
        configurable: true,
        writable: true
      });
    } catch (errDef) {
      try { window.sessionStorage = _createMockStorage(); } catch (errAssign) {}
    }
  }

  // 3. Polyfill seguro para history.pushState / history.replaceState
  try {
    var _origPush = window.history.pushState;
    window.history.pushState = function() {
      try {
        if (_origPush) return _origPush.apply(window.history, arguments);
      } catch (err) {}
    };
    var _origReplace = window.history.replaceState;
    window.history.replaceState = function() {
      try {
        if (_origReplace) return _origReplace.apply(window.history, arguments);
      } catch (err) {}
    };
  } catch (e) {}

  // 4. Wrapper defensivo de fetch para URLs relativas y credenciales en iframe con origen opaco/null
  try {
    var _origFetch = window.fetch;
    if (typeof _origFetch === 'function') {
      window.fetch = function(url, init) {
        try {
          var targetUrl = url;
          if (typeof targetUrl === 'string' && targetUrl.startsWith('/')) {
            var base = (window.location.origin && window.location.origin !== 'null')
              ? window.location.origin
              : (window.parent && window.parent.location && window.parent.location.origin ? window.parent.location.origin : '');
            if (base) {
              targetUrl = base + targetUrl;
            }
          }
          if (init && init.credentials === 'include' && (!window.location.origin || window.location.origin === 'null')) {
            var newInit = Object.assign({}, init);
            delete newInit.credentials;
            return _origFetch.call(this, targetUrl, newInit);
          }
          return _origFetch.call(this, targetUrl, init);
        } catch (fetchErr) {
          console.warn('[Canvas Sandbox Fetch Safe Warning]:', fetchErr.message);
          return _origFetch.apply(this, arguments);
        }
      };
    }
  } catch (e) {}

  // 5. Manejador global de excepciones para evitar que un error no capturado congele la interfaz
  window.addEventListener('error', function(e) {
    console.warn('[Canvas Sandbox Script Warning]:', e.message, 'en', e.filename, ':', e.lineno);
  });
  window.addEventListener('unhandledrejection', function(e) {
    console.warn('[Canvas Sandbox Unhandled Rejection]:', e.reason);
  });

  // 6. Disparador de eventos de resize, iconos y readiness para reactivar scripts interactivos
  function _kickstartApp() {
    try {
      if (typeof window.lucide !== 'undefined' && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
      window.dispatchEvent(new Event('resize'));
    } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _kickstartApp);
  } else {
    setTimeout(_kickstartApp, 50);
    setTimeout(_kickstartApp, 250);
    setTimeout(_kickstartApp, 600);
  }
})();
</script>
`;

  const responsiveBaseStyle = `
<style id="__canvas_preview_responsive_base__">
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100%;
    box-sizing: border-box;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    max-width: 100vw;
    -webkit-text-size-adjust: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.5;
  }

  /* Blindaje responsive para celular: evitar desbordamiento horizontal */
  *, *::before, *::after {
    box-sizing: border-box;
  }
  img, canvas, svg, video {
    max-width: 100%;
  }
  table {
    max-width: 100%;
  }

  /* Reset base moderno para botones, inputs y controles que evita aspecto plano de 1995 si hay retraso de red */
  button, [type='button'], [type='reset'], [type='submit'] {
    font-family: inherit;
    border-radius: 0.5rem;
    padding: 0.45rem 0.9rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid #cbd5e1;
    background-color: #f1f5f9;
    color: #0f172a;
    transition: all 0.2s ease-in-out;
  }
  button:hover, [type='button']:hover {
    background-color: #e2e8f0;
  }
  input[type='text'], input[type='number'], input[type='date'], input[type='email'], select, textarea {
    font-family: inherit;
    border: 1px solid #cbd5e1;
    border-radius: 0.5rem;
    padding: 0.45rem 0.75rem;
    outline: none;
    background-color: #ffffff;
    color: #0f172a;
    transition: border-color 0.2s ease-in-out;
  }
  input:focus, select:focus, textarea:focus {
    border-color: #0d9488;
    box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.2);
  }

  /* Utilidades base en caso de retraso o bloqueo de Tailwind CDN - SIN selectores de subcadena como [class*="hidden"] */
  .hidden {
    display: none !important;
  }
  .overflow-hidden {
    overflow: hidden !important;
  }
  .overflow-x-auto {
    overflow-x: auto !important;
  }
  .overflow-y-auto {
    overflow-y: auto !important;
  }
  input[type="file"]#logo-upload-input {
    display: none !important;
  }
  .absolute {
    position: absolute !important;
  }
  .relative {
    position: relative !important;
  }
  .inset-0 {
    top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important;
  }
  .opacity-10 {
    opacity: 0.1 !important;
  }
  .pointer-events-none {
    pointer-events: none !important;
  }

  /* Blindaje contra 'bola negra': Garantiza que banners y SVGs decorativos de fondo NUNCA se muestren en negro sólido */
  .gradient-banner {
    background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%) !important;
    color: #ffffff !important;
    position: relative !important;
    overflow: hidden !important;
    border-radius: 1.5rem !important;
  }
  .gradient-banner svg,
  .opacity-10 svg,
  svg[viewBox="0 0 200 200"] {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    max-height: 100% !important;
    opacity: 0.15 !important;
    fill: rgba(255, 255, 255, 0.25) !important;
    color: rgba(255, 255, 255, 0.25) !important;
    pointer-events: none !important;
    z-index: 0 !important;
  }
  .gradient-banner path,
  .opacity-10 path,
  svg[viewBox="0 0 200 200"] path {
    fill: rgba(255, 255, 255, 0.25) !important;
  }
</style>
`;

  // Scripts de primera parte (First-Party) alojados localmente en WAPPY con fallback automático al CDN público
  const localCoreScripts = `
<script src="/assets/tailwind-cdn.js"></script>
<script src="/assets/lucide.min.js"></script>
<script src="/assets/chart.min.js"></script>
<script>
  if (!window.tailwind) {
    document.write('<script src="https://cdn.tailwindcss.com"><\\/script>');
  }
  if (!window.lucide) {
    document.write('<script src="https://unpkg.com/lucide@latest"><\\/script>');
  }
  if (!window.Chart) {
    document.write('<script src="https://cdn.jsdelivr.net/npm/chart.js"><\\/script>');
  }
</script>
`;

  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(content);
  const viewportMeta = hasViewport ? '' : '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">\n';

  if (!hasHtml) {
    content = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  ${localCoreScripts}
  ${safeShim}
  ${responsiveBaseStyle}
</head>
<body>
  ${content}
</body>
</html>`;
  } else if (hasHead) {
    content = content.replace(/<head[^>]*>/i, (match) => `${match}\n${viewportMeta}${localCoreScripts}${safeShim}\n${responsiveBaseStyle}`);
  } else {
    content = content.replace(/<html[^>]*>/i, (match) => `${match}\n<head>\n${viewportMeta}${localCoreScripts}${safeShim}\n${responsiveBaseStyle}\n</head>`);
  }

  return content;
}

const CanvasHtmlEditor: React.FC<CanvasHtmlEditorProps> = ({ 
  initialContent, 
  onUpdate, 
  title, 
  isMaximized = false, 
  onRegisterDownload 
}) => {
  const { user } = useAuthContext();
  const isPro = user?.role === 'ADMIN' || user?.role === 'USER_PRO';
  const [code, setCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'split' | 'code' | 'preview'>(isMaximized ? 'split' : 'preview');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const [isCanvasMaximized, setIsCanvasMaximized] = useRecoilState<boolean>(store.canvasMaximized);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);

    // Si entra a pantalla completa, maximiza también el canvas general
    if (nextState) {
      setIsCanvasMaximized(true);
    }

    const el = iframeContainerRef.current || containerRef.current;
    if (nextState) {
      try {
        if (el?.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        }
      } catch (_) {
        // En iOS Safari / navegadores que no soportan Fullscreen API en divs, el modo CSS fixed cubre el 100% de la pantalla
      }
    } else {
      try {
        if (document.fullscreenElement) {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          }
        }
      } catch (_) {}
    }
  };

  // Safely fallback activeTab to "preview" if not maximized or on mobile screen and currently in "split"
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 640;
      if ((!isMaximized || isMobile) && activeTab === 'split') {
        setActiveTab('preview');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMaximized, activeTab]);

  // Load content with Tailwind CDN included by default for instant premium styling
  useEffect(() => {
    if (initialContent) {
      setCode(cleanHtmlContent(initialContent));
    } else {
      setCode(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Plantilla Informativa SST</title>
  <!-- Tailwind CSS CDN for premium utility styling -->
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: .9; transform: scale(0.99); }
    }
  </style>
</head>
<body class="p-6 sm:p-12">
  <div class="max-w-xl text-center bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
    <div class="w-16 h-16 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
      <svg class="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
      </svg>
    </div>
    <h1 class="text-2xl font-black bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-3">
      Prototipo de Código WAPPY
    </h1>
    <p class="text-xs text-slate-400 leading-relaxed mb-6">
      Bienvenido al sandbox interactivo de prototipos en HTML. Inserta componentes premium de SST desde la barra lateral izquierda y observa cómo cobran vida en tiempo real en la vista previa.
    </p>
    <div class="inline-flex gap-2">
      <span class="h-2 w-2 rounded-full bg-teal-500 animate-ping"></span>
      <span class="text-[10px] text-teal-400 font-bold uppercase tracking-widest">Listo para Inyectar</span>
    </div>
  </div>
</body>
</html>`);
    }
  }, [initialContent]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCode(val);
    onUpdate(val);
  };

  const handleDownloadHtml = useCallback(async () => {
    try {
      const rawContent = code || initialContent || '';
      if (!rawContent) return;
      const prepared = preparePreviewHtml(rawContent);
      const safeTitle = (title || 'aplicativo-sst')
        .replace(/[/\\?%*:|"<>]/g, '_')
        .trim();
      const fileName = safeTitle.endsWith('.html') ? safeTitle : `${safeTitle}.html`;
      const blob = new Blob([prepared], { type: 'text/html;charset=utf-8' });

      // 1. En móviles (iOS Safari / Android), verificar si el navegador soporta compartir archivos directamente (Guardar en Archivos / AirDrop / WhatsApp)
      if (typeof navigator !== 'undefined' && navigator.canShare && typeof File !== 'undefined') {
        try {
          const file = new File([blob], fileName, { type: 'text/html' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: title || 'Aplicativo SST',
            });
            return;
          }
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') {
            return; // Cancelado por el usuario en el share sheet
          }
          console.warn('Native share failed, falling back to saveAs:', shareErr);
        }
      }

      // 2. Descarga multi-navegador con saveAs de file-saver
      saveAs(blob, fileName);
    } catch (err) {
      console.error('Error al descargar HTML:', err);
      try {
        const rawContent = code || initialContent || '';
        const prepared = preparePreviewHtml(rawContent);
        const safeTitle = (title || 'aplicativo-sst').replace(/[/\\?%*:|"<>]/g, '_').trim();
        const fileName = safeTitle.endsWith('.html') ? safeTitle : `${safeTitle}.html`;
        const blob = new Blob([prepared], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (_) {}
        }, 5000);
      } catch (fallbackErr) {
        console.error('Fallback download failed:', fallbackErr);
      }
    }
  }, [code, initialContent, title]);

  const handleOpenInNewTab = () => {
    const prepared = preparePreviewHtml(code);
    const blob = new Blob([prepared], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const previewDoc = React.useMemo(() => {
    return preparePreviewHtml(code);
  }, [code]);

  useEffect(() => {
    if (onRegisterDownload) {
      onRegisterDownload(handleDownloadHtml);
    }
  }, [onRegisterDownload, code, title]);

  const showSidebar = isMaximized && sidebarOpen;

  return (
    <div ref={containerRef} className="flex-1 h-full flex overflow-hidden relative bg-surface-primary border border-border-medium rounded-2xl shadow-sm">
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {isMaximized && sidebarOpen && (
        <div 
          className="sm:hidden absolute inset-0 bg-black/30 backdrop-blur-[2px] z-[440] transition-opacity duration-300 animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Left Column: SST Component Library Sidebar */}
      {isMaximized && (
        <div 
          className={`flex-shrink-0 border-r border-border-medium bg-surface-secondary flex flex-col transition-all duration-300 absolute inset-y-0 left-0 z-[450] sm:relative sm:z-0 ${
            sidebarOpen ? 'w-[280px] sm:w-[320px]' : 'w-0 overflow-hidden border-r-0'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-border-medium flex items-center justify-between shrink-0 bg-surface-primary">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-teal-600 animate-pulse" />
              <span className="text-sm font-bold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">Biblioteca SST</span>
            </div>
            <span className="text-[10px] bg-teal-500/10 text-teal-600 px-2 py-0.5 rounded-full font-bold">HTML5</span>
          </div>

          {/* scrolling list of codes to insert */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
            <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-1 mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-yellow-500" />
              Aplicativos Inyectables
            </div>
            
            <div className="space-y-3">
              {PREMIUM_SST_COMPONENTS.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => {
                    if (!isPro) {
                      alert('Este aplicativo premium es exclusivo para usuarios Pro de Wappy. Por favor actualice su suscripción.');
                      return;
                    }
                    if (code && code.trim() !== '' && !code.includes('Prototipo de Código WAPPY')) {
                      if (!window.confirm(`¿Deseas reemplazar el código actual por el aplicativo "${comp.title}"? Se perderán las modificaciones no guardadas.`)) {
                        return;
                      }
                    }
                    setCode(comp.code);
                    onUpdate(comp.code);
                  }}
                  className="w-full text-left rounded-xl border border-border-medium/60 p-3 bg-surface-primary hover:border-teal-500/40 hover:shadow-md hover:shadow-teal-500/5 transition-all duration-300 group flex items-start gap-2.5 cursor-pointer animate-in fade-in duration-200"
                >
                  <div className="h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center border border-border-medium/40 shrink-0 group-hover:scale-105 transition-transform">
                    {renderIcon(comp.iconType, comp.color)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-text-primary group-hover:text-teal-600 transition-colors">
                        {comp.title}
                      </h4>
                      {!isPro ? (
                        <span className="flex items-center gap-1 text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                          <Lock className="h-2 w-2" />
                          PRO
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold text-teal-500 bg-teal-500/5 px-1 py-0.2 rounded border border-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                          + Insertar
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-1 leading-snug line-clamp-2">
                      {comp.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button for Sidebar - ONLY visible when maximized */}
      {isMaximized && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`absolute top-1/2 -translate-y-1/2 z-[460] h-14 w-5 bg-surface-primary border border-border-medium hover:bg-surface-hover shadow-md rounded-r-lg flex items-center justify-center transition-all duration-300 ${
            sidebarOpen 
              ? 'left-[279px] sm:left-[319px]' 
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

      {/* Right Column: Code Editor & Iframe Preview Container */}
      <div className="flex-1 flex flex-col h-full bg-surface-primary text-text-primary overflow-hidden">
        {/* Editor Menu & Controls */}
        <div className="flex items-center justify-between p-3 border-b border-border-medium bg-surface-secondary">
          {/* Split/Code/Preview tabs switcher */}
          <div className="flex items-center gap-1 bg-surface-primary border border-border-medium rounded-xl p-1 shadow-sm">
            {isMaximized && (
              <button
                onClick={() => setActiveTab('split')}
                className={`hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:-rotate-1 ${
                  activeTab === 'split' ? 'bg-surface-secondary text-text-primary shadow-inner font-extrabold' : 'text-text-secondary hover:bg-surface-hover'
                }`}
              >
                <Split className="h-3.5 w-3.5" />
                <span>Dividido</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:-rotate-1 ${
                activeTab === 'code' ? 'bg-surface-secondary text-text-primary shadow-inner font-extrabold' : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Código</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:-rotate-1 ${
                activeTab === 'preview' ? 'bg-surface-secondary text-text-primary shadow-inner font-extrabold' : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Vista Previa</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {(activeTab === 'preview' || activeTab === 'split') && (
              <>
                <button
                  onClick={() => setIframeKey((prev) => prev + 1)}
                  className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary"
                  title="Recargar vista previa"
                >
                  <div className="relative flex-shrink-0 flex items-center justify-center text-text-primary">
                    <RotateCw className="h-4 w-4 text-text-primary" />
                  </div>
                  <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                    <span className="text-sm font-bold tracking-wide text-text-primary">
                      Recargar
                    </span>
                  </div>
                </button>

                <button
                  onClick={handleOpenInNewTab}
                  className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary"
                  title="Abrir en pestaña nueva (presentación completa)"
                >
                  <div className="relative flex-shrink-0 flex items-center justify-center text-text-primary">
                    <ExternalLink className="h-4 w-4 text-text-primary" />
                  </div>
                  <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                    <span className="text-sm font-bold tracking-wide text-text-primary">
                      Abrir en pestaña
                    </span>
                  </div>
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary"
                  title={isFullscreen ? 'Salir Pantalla Completa' : 'Pantalla Completa'}
                >
                  <div className="relative flex-shrink-0 flex items-center justify-center text-text-primary">
                    {isFullscreen ? <Minimize className="h-4 w-4 text-text-primary" /> : <Maximize className="h-4 w-4 text-text-primary" />}
                  </div>
                  <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                    <span className="text-sm font-bold tracking-wide text-text-primary">
                      {isFullscreen ? 'Salir Pantalla Completa' : 'Pantalla Completa'}
                    </span>
                  </div>
                </button>
              </>
            )}

            <button
              onClick={handleDownloadHtml}
              className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary"
              aria-label="Descargar HTML"
            >
              <div className="relative flex-shrink-0 flex items-center justify-center text-text-primary">
                <Download className="h-4 w-4 text-text-primary" />
              </div>
              <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-sm font-bold tracking-wide text-text-primary">
                  Descargar HTML
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Main Workspace splits */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side: Code Editor */}
          {(activeTab === 'split' || activeTab === 'code') && (
            <div className="flex-1 h-full relative border-r border-border-medium">
              <textarea
                ref={textareaRef}
                value={code}
                onChange={handleCodeChange}
                className="w-full h-full p-4 font-mono text-xs bg-slate-950 text-slate-200 resize-none outline-none leading-relaxed overflow-auto scrollbar-thin"
                spellCheck="false"
                placeholder="Introduce tu código HTML/CSS/JS aquí..."
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400 rounded-lg shadow select-none">
                <Play className="h-3 w-3 text-emerald-400 animate-pulse" />
                <span>Auto-refreshing</span>
              </div>
            </div>
          )}

          {/* Right Side: Iframe Live Preview */}
          {(activeTab === 'split' || activeTab === 'preview') && (
            <div
              ref={iframeContainerRef}
              className={`flex-1 h-full min-h-0 min-w-0 bg-white relative flex flex-col overflow-hidden ${
                isFullscreen
                  ? 'fixed inset-0 z-[99999999] h-screen w-screen'
                  : ''
              }`}
            >
              {isFullscreen && (
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                  <button
                    onClick={toggleFullscreen}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700 shadow-2xl font-bold text-xs active:scale-95 transition-all hover:bg-slate-800"
                    title="Salir de pantalla completa"
                  >
                    <Minimize className="h-4 w-4 text-teal-400" />
                    <span>Salir Pantalla Completa</span>
                  </button>
                </div>
              )}
              <iframe
                key={iframeKey}
                title="Canvas Live View"
                className="w-full h-full flex-1 border-none bg-white min-h-0 min-w-0"
                sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads allow-pointer-lock"
                allow="fullscreen; presentation; clipboard-read; clipboard-write; autoplay"
                srcDoc={previewDoc}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvasHtmlEditor;
