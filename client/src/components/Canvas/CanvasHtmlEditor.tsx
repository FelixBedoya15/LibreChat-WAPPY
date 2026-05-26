import React, { useState, useEffect, useRef } from 'react';
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
  Plus 
} from 'lucide-react';

interface CanvasHtmlEditorProps {
  initialContent: string;
  onUpdate: (content: string) => void;
  title: string;
  isMaximized?: boolean;
  onRegisterDownload?: (fn: () => void) => void;
}

const SST_COMPONENTS = [
  {
    id: 'risk-card',
    title: 'Tarjeta de Alerta de Riesgo',
    description: 'Tarjeta con neón rojo, alerta parpadeante, descripción del hallazgo y botones interactivos.',
    icon: <Cpu className="h-4 w-4 text-red-500 animate-pulse" />,
    code: `<!-- Tarjeta de Alerta de Riesgo Crítico (SST) -->
<div class="max-w-md mx-auto my-6 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-red-950/40 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)] backdrop-blur-md text-white font-sans transition-all duration-300 hover:scale-[1.02] hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.25)]">
  <div class="flex items-center justify-between mb-4">
    <span class="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold bg-red-500/20 border border-red-500/30 text-red-400 rounded-full">
      <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
      RIESGO CRÍTICO DETECTADO
    </span>
    <span class="text-[10px] font-mono text-slate-400">ID: SST-9021</span>
  </div>
  
  <h3 class="text-lg font-extrabold text-white mb-2 leading-snug tracking-tight">Trabajo en Alturas - Bloque C</h3>
  <p class="text-xs text-slate-300 mb-6 leading-relaxed">Se ha detectado una línea de vida con desgaste abrasivo severo en el andamio del nivel 4. Suspensión temporal de actividades requerida de inmediato hasta reemplazo del equipo.</p>
  
  <div class="flex items-center gap-3 p-3.5 bg-white/5 border border-white/5 rounded-xl mb-6">
    <div class="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
      <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
    </div>
    <div class="min-w-0">
      <div class="text-[10px] font-bold text-slate-300">Acción Requerida</div>
      <div class="text-[10px] text-red-400 font-semibold truncate">Reemplazar arnés y línea de vida.</div>
    </div>
  </div>
  
  <div class="flex gap-2">
    <button onclick="alert('Notificando al supervisor de SST de inmediato...')" class="flex-1 py-2.5 px-4 text-xs font-extrabold text-center bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none outline-none">
      Notificar de Emergencia
    </button>
    <button onclick="this.closest('.max-w-md').style.display='none'" class="py-2.5 px-4 text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors cursor-pointer outline-none">
      Ignorar
    </button>
  </div>
</div>`
  },
  {
    id: 'dashboard',
    title: 'Dashboard Widget de SST',
    description: 'Cuadrícula interactiva de 3 KPIs (Días sin accidentes, EPP entregado y ejecución de inspecciones).',
    icon: <Layers className="h-4 w-4 text-teal-500" />,
    code: `<!-- Panel de Control / Dashboard SST -->
<div class="max-w-3xl mx-auto my-6 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl text-white font-sans">
  <div class="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
    <div>
      <h3 class="text-base font-extrabold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">Panel de Control SST</h3>
      <p class="text-[10px] text-slate-400 mt-0.5">Indicadores Clave de Desempeño Corporativo</p>
    </div>
    <span class="px-2.5 py-1 text-[9px] font-bold bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg">EN LÍNEA</span>
  </div>
  
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <!-- Stat 1: Días sin accidentes -->
    <div class="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between hover:border-emerald-500/30 transition-all group duration-300">
      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Días sin Accidentes</div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-3xl font-black text-emerald-400 group-hover:scale-105 transition-transform inline-block">245</span>
        <span class="text-[10px] text-emerald-400/70 font-semibold">días</span>
      </div>
      <div class="text-[9px] text-slate-500 mt-3 font-medium">Record Corporativo: 320 días</div>
    </div>
    
    <!-- Stat 2: EPP Entregados -->
    <div class="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between hover:border-blue-500/30 transition-all group duration-300">
      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">EPP Entregados</div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-3xl font-black text-blue-400 group-hover:scale-105 transition-transform inline-block">98.4%</span>
      </div>
      <div class="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
        <div class="bg-blue-400 h-full rounded-full" style="width: 98.4%"></div>
      </div>
    </div>
    
    <!-- Stat 3: Inspecciones -->
    <div class="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between hover:border-rose-500/30 transition-all group duration-300">
      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Inspecciones Plan.</div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-3xl font-black text-rose-400 group-hover:scale-105 transition-transform inline-block">12 / 12</span>
      </div>
      <div class="text-[9px] text-rose-400/85 mt-3 font-semibold flex items-center gap-1">
        <svg class="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        100% ejecutado este mes
      </div>
    </div>
  </div>
</div>`
  },
  {
    id: 'report-form',
    title: 'Formulario de Condiciones',
    description: 'Formulario de reporte de incidentes, actos y condiciones inseguras con campos adaptados y botón hover.',
    icon: <Plus className="h-4 w-4 text-emerald-500 animate-bounce" />,
    code: `<!-- Formulario de Reporte de Condiciones (SST) -->
<div class="max-w-md mx-auto my-6 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl text-white font-sans">
  <h3 class="text-base font-extrabold mb-1">Reporte de Actos y Condiciones Inseguras</h3>
  <p class="text-[10px] text-slate-400 mb-6">Ayúdanos a mantener un entorno de trabajo seguro. Tu reporte es confidencial.</p>
  
  <form onsubmit="event.preventDefault(); alert('¡Gracias! Reporte de seguridad enviado al comité de SST exitosamente.'); this.reset();" class="space-y-4">
    <div>
      <label class="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Ubicación del Suceso</label>
      <input type="text" placeholder="Ej: Planta de Producción, Almacén, Oficinas..." required class="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors" />
    </div>
    
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Tipo de Peligro</label>
        <select required class="w-full h-9 px-2 bg-slate-900 border border-white/10 rounded-xl text-[11px] text-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors">
          <option value="fisico">Físico (Ruido, Iluminación)</option>
          <option value="quimico">Químico (Sustancias, Derrames)</option>
          <option value="biomecanico">Ergonómico o Biomecánico</option>
          <option value="locativo">Locativo (Pisos, Escaleras)</option>
          <option value="electrico">Eléctrico</option>
        </select>
      </div>
      <div>
        <label class="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Nivel de Riesgo</label>
        <select required class="w-full h-9 px-2 bg-slate-900 border border-white/10 rounded-xl text-[11px] text-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors">
          <option value="bajo">Bajo - Tolerable</option>
          <option value="medio">Medio - Requiere Atención</option>
          <option value="alto">Alto - Peligro Inmediato</option>
        </select>
      </div>
    </div>
    
    <div>
      <label class="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Descripción Detallada</label>
      <textarea rows="3" placeholder="Describe claramente lo observado y cuál es el riesgo potencial..." required class="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors resize-none"></textarea>
    </div>
    
    <button type="submit" class="w-full py-2.5 text-xs font-extrabold text-center bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-600/10 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer border-none outline-none">
      Enviar Reporte de Seguridad
    </button>
  </form>
</div>`
  },
  {
    id: 'action-table',
    title: 'Tabla de Plan de Acción SST',
    description: 'Tabla de actividades con responsables, fechas y badges de estado coloridos.',
    icon: <Eye className="h-4 w-4 text-blue-500" />,
    code: `<!-- Tabla de Plan de Acción SST -->
<div class="max-w-3xl mx-auto my-6 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl text-white font-sans overflow-hidden">
  <div class="flex items-center justify-between mb-6">
    <h3 class="text-sm font-extrabold">Plan de Acción y Acciones Correctivas (SST)</h3>
    <span class="text-[10px] bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 font-mono text-slate-400">Mayo 2026</span>
  </div>
  
  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse text-xs">
      <thead>
        <tr class="border-b border-white/10 text-slate-400">
          <th class="py-3 px-4 font-bold uppercase tracking-wider">Actividad / Hallazgo</th>
          <th class="py-3 px-4 font-bold uppercase tracking-wider">Responsable</th>
          <th class="py-3 px-4 font-bold uppercase tracking-wider">Fecha Límite</th>
          <th class="py-3 px-4 font-bold uppercase tracking-wider">Estado</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5 text-slate-200">
        <tr class="hover:bg-white/5 transition-colors">
          <td class="py-3 px-4 font-semibold">Simulacro de Evacuación Anual</td>
          <td class="py-3 px-4">Brigada de Emergencia</td>
          <td class="py-3 px-4 font-mono text-slate-400">2026-05-30</td>
          <td class="py-3 px-4">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">Pendiente</span>
          </td>
        </tr>
        <tr class="hover:bg-white/5 transition-colors">
          <td class="py-3 px-4 font-semibold">Recarga de Extintores</td>
          <td class="py-3 px-4">Humberto Bedoya (SST)</td>
          <td class="py-3 px-4 font-mono text-slate-400">2026-05-15</td>
          <td class="py-3 px-4">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Completado</span>
          </td>
        </tr>
        <tr class="hover:bg-white/5 transition-colors">
          <td class="py-3 px-4 font-semibold">Ergonomía: Adquisición de Sillas</td>
          <td class="py-3 px-4">Recursos Humanos</td>
          <td class="py-3 px-4 font-mono text-slate-400">2026-06-10</td>
          <td class="py-3 px-4">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">En revisión</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`
  },
  {
    id: 'emergency-banner',
    title: 'Banderola de Alerta Emergencia',
    description: 'Barra horizontal de urgencia en degradado rojo/naranja con acceso directo a llamada y animación vibrante.',
    icon: <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />,
    code: `<!-- Banderola de Alerta de Emergencia (SST) -->
<div class="max-w-3xl mx-auto my-6 p-4 rounded-xl bg-gradient-to-r from-red-650 via-amber-600 to-red-650 border border-red-500/40 shadow-lg text-white font-sans flex flex-col sm:flex-row items-center justify-between gap-4" style="animation: pulse 3s infinite;">
  <div class="flex items-center gap-3">
    <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
      <svg class="w-5 h-5 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
    </div>
    <div class="text-center sm:text-left">
      <h4 class="text-xs font-black uppercase tracking-wider">LÍNEA DE ATENCIÓN DE EMERGENCIAS</h4>
      <p class="text-[10px] text-white/80 mt-0.5 font-medium">Llama de inmediato a la Brigada ante cualquier incidente crítico o derrame.</p>
    </div>
  </div>
  
  <div class="flex items-center gap-2">
    <a href="tel:123" class="px-4 py-2 text-[10px] font-black bg-white text-red-600 hover:bg-slate-100 rounded-lg shadow transition-colors whitespace-nowrap decoration-none">
      LLAMAR A BRIGADA (Ext. 4000)
    </a>
    <button onclick="this.closest('.max-w-3xl').style.display='none'" class="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer border-none bg-transparent">
      <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
  </div>
</div>`
  }
];

const CanvasHtmlEditor: React.FC<CanvasHtmlEditorProps> = ({ 
  initialContent, 
  onUpdate, 
  title, 
  isMaximized = false, 
  onRegisterDownload 
}) => {
  const [code, setCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'split' | 'code' | 'preview'>(isMaximized ? 'split' : 'code');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Safely fallback activeTab to "code" if not maximized or on mobile screen and currently in "split"
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 640;
      if ((!isMaximized || isMobile) && activeTab === 'split') {
        setActiveTab('code');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMaximized, activeTab]);

  // Load content with Tailwind CDN included by default for instant premium styling
  useEffect(() => {
    if (initialContent) {
      setCode(initialContent);
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

  const insertCodeAtCursor = (codeToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    const beforeText = currentText.substring(0, start);
    const afterText = currentText.substring(end);

    const updatedText = beforeText + codeToInsert + afterText;
    
    setCode(updatedText);
    onUpdate(updatedText);

    // Focus and select the newly inserted text smoothly
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + codeToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'canvas-preview'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (onRegisterDownload) {
      onRegisterDownload(handleDownloadHtml);
    }
  }, [onRegisterDownload, code, title]);

  const showSidebar = isMaximized && sidebarOpen;

  return (
    <div className="flex-1 h-full flex overflow-hidden relative bg-surface-primary border border-border-medium rounded-2xl shadow-sm">
      
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
              Componentes Inyectables
            </div>
            
            <div className="space-y-3">
              {SST_COMPONENTS.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => insertCodeAtCursor(comp.code)}
                  className="w-full text-left rounded-xl border border-border-medium/60 p-3 bg-surface-primary hover:border-teal-500/40 hover:shadow-md hover:shadow-teal-500/5 transition-all duration-300 group flex items-start gap-2.5 cursor-pointer animate-in fade-in duration-200"
                >
                  <div className="h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center border border-border-medium/40 shrink-0 group-hover:scale-105 transition-transform">
                    {comp.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-text-primary group-hover:text-teal-600 transition-colors">
                        {comp.title}
                      </h4>
                      <span className="text-[8px] font-bold text-teal-500 bg-teal-500/5 px-1 py-0.2 rounded border border-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        + Insertar
                      </span>
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
            <div className="flex-1 h-full bg-white relative">
              <iframe
                title="Canvas Live View"
                className="w-full h-full border-none bg-white"
                sandbox="allow-scripts"
                srcDoc={code}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvasHtmlEditor;
