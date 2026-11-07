import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Globe,
  HeartPulse,
  Palette,
  UserCheck,
  Cpu,
  ShieldAlert,
  Car,
  FlaskConical,
  FileEdit,
  Scale,
  Heart,
  Activity,
  CloudSun,
  MapPin,
  GitFork,
  Clapperboard,
  Bot,
  Brain,
  Bell,
  Sparkles,
  Plus,
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Wand2,
  Check,
  Zap,
  ShieldCheck,
  HardHat,
  Users,
  Stethoscope,
  ClipboardCheck,
  BarChart3,
  BookOpen,
  AlertTriangle,
  QrCode,
  FileText,
  Clock,
  Hand,
  MousePointer2,
  Move,
  Sliders,
  Repeat,
  GitMerge,
  Lock,
  Hammer,
  Terminal,
  Puzzle,
  Search,
} from 'lucide-react';
import {
  TRIGGER_NODES,
  EXTRACTOR_NODES,
  INPUT_CONNECTOR_NODES,
  HITO_APP_NODES,
  OUTPUT_ACTION_NODES,
  SKILL_RULE_SUBAGENT_NODES,
  AI_ENGINE_MODELS,
  MEMORY_NODES,
  HITOS_8_FILTER_TABS,
  DEFAULT_CONSTRUCTION_APP_IDS,
  isWorkflowNodeUnderConstruction,
  getNodeDefById,
  getPresetFieldsForNode,
  normalizeTriggersList,
  normalizeExtractorsList,
  normalizeMemoriesList,
  type WorkflowNodesConfig,
  type CanvasNodePosition,
  type CanvasWireEdge,
  type CanvasNodeConfig,
  type CanvasCustomUserNode,
} from './workflowNodesCatalog';

/* ═══════════════════════════════════════════════════════════════════════════
   1. LOGOS SVG OFICIALES Y ICONOS DE HERRAMIENTAS WAPPY (Imagen 1 y 3)
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderOfficialNodeSvg(nodeId: string, sizeClass = 'w-7 h-7'): React.ReactNode {
  const id = (nodeId || '').toLowerCase();

  // Google Drive / Extraer de Drive (Logo Oficial Tricolor/Cuatricolor)
  if (id.includes('google_drive') || id.includes('drive_folder') || id.includes('extract_drive')) {
    return (
      <svg viewBox="0 0 87.3 78" className={sizeClass}>
        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
      </svg>
    );
  }

  // Google Sheets (Logo Oficial Verde con Celdas)
  if (id.includes('google_sheets')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <path fill="#0F9D58" d="M29,6H14c-2.2,0-4,1.8-4,4v28c0,2.2,1.8,4,4,4h20c2.2,0,4-1.8,4-4V15L29,6z" />
        <path fill="#87CEAC" d="M29,6v9h9L29,6z" />
        <path fill="#FFFFFF" d="M16,21v14h16V21H16z M23,33h-5v-3h5V33z M23,28h-5v-3h5V28z M30,33h-5v-3h5V33z M30,28h-5v-3h5V28z" />
      </svg>
    );
  }

  // Google Docs (Logo Oficial Azul)
  if (id.includes('google_docs')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <path fill="#4285F4" d="M29,6H14c-2.2,0-4,1.8-4,4v28c0,2.2,1.8,4,4,4h20c2.2,0,4-1.8,4-4V15L29,6z" />
        <path fill="#A0C2F9" d="M29,6v9h9L29,6z" />
        <path fill="#FFFFFF" d="M16,23h16v2H16V23z M16,28h16v2H16V28z M16,33h11v2H16V33z" />
      </svg>
    );
  }

  // Google Slides (Logo Oficial Ámbar)
  if (id.includes('google_slides')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <path fill="#F4B400" d="M29,6H14c-2.2,0-4,1.8-4,4v28c0,2.2,1.8,4,4,4h20c2.2,0,4-1.8,4-4V15L29,6z" />
        <path fill="#F9D978" d="M29,6v9h9L29,6z" />
        <rect x="15" y="21" width="18" height="12" rx="1.5" fill="#FFFFFF" />
      </svg>
    );
  }

  // Google Gmail / Correo Entrante / Email Report (Logo Oficial M Cuatricolor)
  if (id.includes('gmail') || id.includes('email_report') || id.includes('trigger_email')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z" />
        <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z" />
        <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" />
        <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z" />
        <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z" />
      </svg>
    );
  }

  // Tenshi IA / Notificación Directa WAPPY + Tenshi (Avatar 3D Oficial de Tenshi en WAPPY)
  if (id.includes('trigger_tenshi') || id.includes('tenshi') || id.includes('wappy_notification')) {
    return (
      <img
        src="/assets/tenshi.png"
        alt="Tenshi IA"
        className={`${sizeClass} object-contain drop-shadow-sm select-none pointer-events-none scale-125`}
      />
    );
  }

  // Google Calendar (Logo Oficial Calendario 31)
  if (id.includes('google_calendar')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <rect x="6" y="6" width="36" height="36" rx="6" fill="#4285F4" />
        <rect x="13" y="13" width="22" height="22" rx="2" fill="#FFFFFF" />
        <path fill="#EA4335" d="M35,42h-6v-7h7v6C36,41.6,35.6,42,35,42z" />
        <path fill="#34A853" d="M13,35h22v7H13V35z" />
        <path fill="#FBBC04" d="M35,13h7v22h-7V13z" />
        <text x="24" y="28.5" textAnchor="middle" fill="#1a73e8" fontSize="12" fontWeight="900" fontFamily="sans-serif">31</text>
      </svg>
    );
  }

  // Microsoft OneDrive / Extraer OneDrive
  if (id.includes('onedrive') || id.includes('one_drive')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <path fill="#0078D4" d="M38.5,24.2c-0.7-5.8-5.6-10.2-11.6-10.2c-4.6,0-8.6,2.6-10.5,6.5c-0.7-0.2-1.5-0.3-2.3-0.3 c-4.9,0-8.9,3.9-9.1,8.8C2.7,30.2,1,32.6,1,35.4C1,39.1,4,42,7.7,42h29.8c4.7,0,8.5-3.8,8.5-8.5C46,28.8,42.7,24.9,38.5,24.2z" />
      </svg>
    );
  }

  // Google NotebookLM
  if (id.includes('notebooklm') || id.includes('rag_documental')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <rect x="6" y="6" width="36" height="36" rx="10" fill="#0F172A" />
        <path d="M14 31C14 21 24 15 34 19" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M14 35C16 26 25 21 34 25" stroke="#A855F7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M16 38C19 31 26 28 34 31" stroke="#34D399" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  // Google Antigravity Cloud 24/7 (antigravity.google.com + Nube)
  if (id.includes('antigravity_cloud')) {
    return (
      <svg viewBox="0 0 28 28" fill="none" className={sizeClass}>
        <path
          d="M11.5 4 4.5 19l3-1.3L11.5 9.2l4 8.5 3 1.3L11.5 4z"
          stroke="#0284c7"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8.3 15h6.4" stroke="#0284c7" strokeWidth="2.1" strokeLinecap="round" />
        <path
          d="M17.5 23.5h5.2a2.8 2.8 0 0 0 .4-5.57 3.8 3.8 0 0 0-7.2-1.18A2.5 2.5 0 0 0 17.5 23.5z"
          fill="#38bdf8"
          stroke="#0284c7"
          strokeWidth="1.4"
        />
      </svg>
    );
  }

  // Google Antigravity Local (Mac/PC) + MCP / Carpeta en mi PC
  if (id.includes('antigravity') || id.includes('extract_pc_folder')) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${sizeClass} text-orange-500`}
      >
        <path d="M12 3 4 20l3.5-1.5L12 9l4.5 9.5L20 20 12 3z" />
        <path d="M8.5 15.5h7" />
      </svg>
    );
  }

  // Modelos WAPPY Cloud IA / Google Gemini
  if (id.includes('wappy_gemini') || id.includes('gemini')) {
    return (
      <svg viewBox="0 0 24 24" className={sizeClass}>
        <defs>
          <linearGradient id="wappyGeminiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4285F4" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
        </defs>
        <path
          fill="url(#wappyGeminiGrad)"
          d="M12 2C12.6 7.2 16.8 11.4 22 12C16.8 12.6 12.6 16.8 12 22C11.4 16.8 7.2 12.6 2 12C7.2 11.4 11.4 7.2 12 2Z"
        />
      </svg>
    );
  }

  // Google Flow (Veo / Imagen)
  if (id.includes('google_flow')) {
    return <Clapperboard className={`${sizeClass} text-purple-500`} />;
  }

  // ── Iconos Exactos del Menú de Herramientas de Chat WAPPY (Imagen 3) ──
  if (id.includes('web_search') || id === 'google') {
    return <Globe className={`${sizeClass} text-blue-500`} />;
  }
  if (id.includes('somos_sst') || id.includes('sgsst_db_audit') || id.includes('medlineplus') || id.includes('examenes_medicos') || id.includes('extract_sst_app') || id.includes('memory_company')) {
    return <HeartPulse className={`${sizeClass} text-rose-500`} />;
  }
  if (id.includes('extract_sst_workers')) {
    return <Users className={`${sizeClass} text-teal-600`} />;
  }
  if (id.includes('memory_antiduplicate')) {
    return <Clock className={`${sizeClass} text-amber-500`} />;
  }
  if (id.includes('memory_procedural')) {
    return <Scale className={`${sizeClass} text-teal-600`} />;
  }
  if (id.includes('canvas') || id.includes('dictamen')) {
    return <Palette className={`${sizeClass} text-fuchsia-500`} />;
  }
  if (id.includes('consultar_agente') || id.includes('especialista') || id.includes('trigger_agent')) {
    return <UserCheck className={`${sizeClass} text-violet-500`} />;
  }
  if (id.includes('schedule_cron')) {
    return <Clock className={`${sizeClass} text-orange-500`} />;
  }
  if (id.includes('automatizaciones')) {
    return <Cpu className={`${sizeClass} text-purple-500`} />;
  }
  if (id.includes('matriz_ipevar') || id.includes('gtc45')) {
    return <ShieldAlert className={`${sizeClass} text-amber-500`} />;
  }
  if (id.includes('pesv') || id.includes('parque_automotor') || id.includes('vehicul')) {
    return <Car className={`${sizeClass} text-orange-500`} />;
  }
  if (id.includes('compatibilidad') || id.includes('quimico') || id.includes('pubchem')) {
    return <FlaskConical className={`${sizeClass} text-lime-500`} />;
  }
  if (id.includes('editor_live') || id.includes('documentos_vivo') || id.includes('politica')) {
    return <FileEdit className={`${sizeClass} text-blue-500`} />;
  }
  if (id.includes('editor_rit') || id.includes('matriz_legal') || id.includes('legal')) {
    return <Scale className={`${sizeClass} text-indigo-500`} />;
  }
  if (id.includes('psicosocial')) {
    return <Heart className={`${sizeClass} text-pink-500`} />;
  }
  if (id.includes('actos') || id.includes('estadisticas_atel')) {
    return <Activity className={`${sizeClass} text-cyan-500`} />;
  }
  if (id.includes('openweather') || id.includes('clima')) {
    return <CloudSun className={`${sizeClass} text-amber-500`} />;
  }
  if (id.includes('emergencia') || id.includes('vulnerabilidad') || id.includes('osm')) {
    return <MapPin className={`${sizeClass} text-red-500`} />;
  }
  if (id.includes('webhook') || id.includes('if_node')) {
    return <GitFork className={`${sizeClass} text-emerald-600`} />;
  }
  if (id.includes('memory') || id.includes('rag')) {
    return <Brain className={`${sizeClass} text-pink-500`} />;
  }
  if (id.includes('bell') || id.includes('notificacion')) {
    return <Bell className={`${sizeClass} text-amber-500`} />;
  }
  if (id.includes('alturas') || id.includes('epp') || id.includes('ats')) {
    return <HardHat className={`${sizeClass} text-amber-600`} />;
  }
  if (id.includes('socio') || id.includes('comites') || id.includes('trabajadores')) {
    return <Users className={`${sizeClass} text-teal-600`} />;
  }
  if (id.includes('diagnostico_0312') || id.includes('auditoria')) {
    return <ClipboardCheck className={`${sizeClass} text-emerald-600`} />;
  }
  if (id.includes('academia') || id.includes('capacitacion')) {
    return <BookOpen className={`${sizeClass} text-indigo-500`} />;
  }
  if (id.includes('atel') || id.includes('accidente')) {
    return <AlertTriangle className={`${sizeClass} text-rose-600`} />;
  }
  if (id.includes('qr')) {
    return <QrCode className={`${sizeClass} text-slate-700 dark:text-slate-200`} />;
  }
  if (id.includes('alta_direccion') || id.includes('dofa') || id.includes('plan_trabajo')) {
    return <BarChart3 className={`${sizeClass} text-purple-600`} />;
  }
  if (id.includes('scraping') || id.includes('web_scraper')) {
    return <Terminal className={`${sizeClass} text-orange-500`} />;
  }
  if (id.includes('skill')) {
    return <Puzzle className={`${sizeClass} text-violet-600 dark:text-violet-400`} />;
  }
  if (id.includes('subagent')) {
    return <Bot className={`${sizeClass} text-indigo-600 dark:text-indigo-400`} />;
  }
  if (id.includes('rule') || id.includes('regla')) {
    return <Scale className={`${sizeClass} text-emerald-600 dark:text-emerald-400`} />;
  }
  if (id.includes('busqueda') || id.includes('search')) {
    return <Search className={`${sizeClass} text-sky-500`} />;
  }

  return <ShieldCheck className={`${sizeClass} text-teal-600`} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. LIENZO INTERACTIVO DE FLUJOS WAPPY (DRAG & DROP + CABLES BEZIER)
   ═══════════════════════════════════════════════════════════════════════════ */

interface WappyWorkflowCanvasProps {
  workflowNodes: WorkflowNodesConfig;
  onChange?: (next: WorkflowNodesConfig) => void;
  agentId?: string;
  agentName: string;
  agents?: Array<{ id: string; name: string }>;
  onSelectAgent?: (agentId: string) => void;
  prompt?: string;
  onChangePrompt?: (nextPrompt: string) => void;
  onAutoBuildPrompt?: () => void;
  readOnly?: boolean;
  compact?: boolean;
}

interface VisualNodeInstance {
  key: string;
  nodeId: string;
  shape:
    | 'trigger'
    | 'square_extractor'
    | 'agent'
    | 'if'
    | 'logic'
    | 'square_hito'
    | 'square_output'
    | 'circle_model'
    | 'circle_memory'
    | 'circle_tool'
    | 'custom_node';
  title: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  height: number;
  removable?: boolean;
  group?: 'triggers' | 'extractors' | 'memories' | 'inputs' | 'hitos' | 'outputs';
  customNodeType?: 'skill' | 'subagent' | 'rule' | 'web_scraper' | 'web_search';
}

export default function WappyWorkflowCanvas({
  workflowNodes,
  onChange,
  agentId,
  agentName,
  agents = [],
  onSelectAgent,
  prompt = '',
  onChangePrompt,
  onAutoBuildPrompt,
  readOnly = false,
  compact = false,
}: WappyWorkflowCanvasProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [paletteTab, setPaletteTab] = useState<
    | 'triggers'
    | 'extractors'
    | 'ai_engine'
    | 'memories'
    | 'connectors'
    | 'hitos'
    | 'outputs'
    | 'skills_rules'
  >('triggers');
  const [zoom, setZoom] = useState<number>(compact ? 0.68 : 0.9);

  // Nodo actualmente abierto en el Inspector de Configuración por Nodo (al hacer clic sobre cualquier nodo)
  const [activeConfigNodeKey, setActiveConfigNodeKey] = useState<string | null>(null);
  const [customFieldInput, setCustomFieldInput] = useState<string>('');
  const pointerDownClientRef = useRef<{ x: number; y: number } | null>(null);

  // Estado sincronizado con Somos SST (/api/sgsst/config) de qué aplicativos están "En Construcción"
  const [disabledSgsstApps, setDisabledSgsstApps] = useState<string[]>(DEFAULT_CONSTRUCTION_APP_IDS);
  const [selectedHitoFilter, setSelectedHitoFilter] = useState<string>('all');
  const [constructionNotice, setConstructionNotice] = useState<string | null>(null);

  // Estado en tiempo real de la instancia Google Antigravity del usuario (necesaria para Web Scraping con Script y Carpetas PC)
  const [antigravityStatus, setAntigravityStatus] = useState<{
    connected: boolean;
    localConnected: boolean;
    cloudConnected: boolean;
    activeMode: string;
  }>({
    connected: false,
    localConnected: false,
    cloudConnected: false,
    activeMode: 'none',
  });

  // Creador de Nodos Personalizados del Usuario (Skills, Sub-Agentes, Reglas, Web Scraping AGY, Búsqueda Web)
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<
    'all' | 'skill' | 'subagent' | 'rule' | 'web_scraper' | 'web_search' | 'my_created'
  >('all');
  const [showCustomNodeBuilder, setShowCustomNodeBuilder] = useState<boolean>(false);
  const [newCustomNodeForm, setNewCustomNodeForm] = useState<{
    nodeType: 'skill' | 'subagent' | 'rule' | 'web_scraper' | 'web_search';
    title: string;
    subtitle: string;
    content: string;
    targetUrl: string;
    scriptEngine: 'python_bs4' | 'node_cheerio' | 'chrome_mcp' | 'custom_script';
    scriptCode: string;
  }>({
    nodeType: 'skill',
    title: '',
    subtitle: '',
    content: '',
    targetUrl: '',
    scriptEngine: 'python_bs4',
    scriptCode: '',
  });
  const [savedUserLibraryNodes, setSavedUserLibraryNodes] = useState<CanvasCustomUserNode[]>(() => {
    try {
      const raw = localStorage.getItem('wappy_custom_workflow_nodes_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  });

  useEffect(() => {
    let mounted = true;
    axios
      .get('/api/sgsst/config')
      .then((res) => {
        if (mounted && Array.isArray(res.data?.disabledApps)) {
          setDisabledSgsstApps(res.data.disabledApps);
        }
      })
      .catch(() => {});
    axios
      .get('/api/mcp-bridge/antigravity/status')
      .then((res) => {
        if (mounted && res.data) {
          setAntigravityStatus({
            connected: Boolean(res.data.connected),
            localConnected: Boolean(res.data.localConnected),
            cloudConnected: Boolean(res.data.cloudConnected),
            activeMode: res.data.activeMode || 'none',
          });
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Lista de agentes accesibles por el usuario + Tenshi Avatar (Orquestador 3D de Voz y Gestión) diferenciado de Tenshi Agente de texto
  const availableAgentsWithTenshiAvatar = useMemo(() => {
    const list: Array<{ id: string; name: string; isTenshiAvatar?: boolean }> = [
      {
        id: 'tenshi_avatar_orchestrator',
        name: '🐱 Tenshi Avatar (Voz y Orquestador 3D)',
        isTenshiAvatar: true,
      },
    ];
    agents.forEach((ag) => {
      if (!ag?.id) return;
      const cleanName =
        ag.name?.trim().toLowerCase() === 'tenshi'
          ? 'Tenshi (Agente de Chat)'
          : ag.name;
      list.push({ id: ag.id, name: cleanName });
    });
    return list;
  }, [agents]);

  // Herramienta activa en el área de trabajo: 'pan' (Manita para desplazarse) | 'select' (Caja para seleccionar varios/parte)
  const [canvasTool, setCanvasTool] = useState<'pan' | 'select'>('pan');
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{
    clientX: number;
    clientY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  // Selección múltiple de nodos (para mover todo el flujo o solo una parte a la vez)
  const [selectedNodeKeys, setSelectedNodeKeys] = useState<string[]>([]);
  const [marqueeBox, setMarqueeBox] = useState<{
    startX: number;
    startY: number;
    currX: number;
    currY: number;
  } | null>(null);
  const [groupDragStart, setGroupDragStart] = useState<{
    pointerX: number;
    pointerY: number;
    initialPositions: Record<string, { x: number; y: number }>;
  } | null>(null);

  // Estado de arrastre de nodos en el lienzo
  const [draggingNodeKey, setDraggingNodeKey] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Estado para unir nodos con el mouse (drag wire from port to port)
  const [wiringFrom, setWiringFrom] = useState<{
    sourceKey: string;
    portType: 'main_out' | 'diamond_model' | 'diamond_memory' | 'diamond_tool' | 'if_true' | 'if_false';
    startX: number;
    startY: number;
    currX: number;
    currY: number;
  } | null>(null);

  const activeTriggers = useMemo(() => normalizeTriggersList(workflowNodes), [workflowNodes]);
  const activeExtractors = useMemo(() => normalizeExtractorsList(workflowNodes), [workflowNodes]);
  const activeMemories = useMemo(() => normalizeMemoriesList(workflowNodes), [workflowNodes]);
  const aiEngine = workflowNodes?.aiEngine || 'wappy';
  const aiModel = workflowNodes?.aiModel || 'gemini-3.6-flash';
  const includeIfNode = workflowNodes?.includeIfNode !== false;

  const currentModelDef = useMemo(() => {
    if (aiEngine === 'antigravity_cloud') {
      return AI_ENGINE_MODELS.find((m) => m.engine === 'antigravity_cloud') || AI_ENGINE_MODELS[4] || AI_ENGINE_MODELS[3];
    }
    if (aiEngine === 'antigravity') {
      return AI_ENGINE_MODELS.find((m) => m.engine === 'antigravity') || AI_ENGINE_MODELS[3];
    }
    return (
      AI_ENGINE_MODELS.find((m) => m.engine === 'wappy' && m.model === aiModel) || AI_ENGINE_MODELS[0]
    );
  }, [aiEngine, aiModel]);

  const customPositions = workflowNodes?.canvasLayout?.positions || {};

  // Construir todos los nodos de las 5 Etapas del Flujo Visual WAPPY
  const visualNodes = useMemo<VisualNodeInstance[]>(() => {
    const list: VisualNodeInstance[] = [];

    // ETAPA 1. NODOS DISPARADORES / ENTRADAS (Forma en "D" con rayo ⚡)
    activeTriggers.forEach((trigId, idx) => {
      const triggerDef = getNodeDefById(trigId) || TRIGGER_NODES[0];
      const key = idx === 0 ? 'trigger_root' : `trigger_${triggerDef.id}`;
      const defaultY =
        activeTriggers.length === 1
          ? 76
          : activeTriggers.length === 2
            ? 24 + idx * 108
            : 14 + idx * 96;
      const trigPos = customPositions[key] || { x: 24, y: defaultY };
      list.push({
        key,
        nodeId: triggerDef.id,
        shape: 'trigger',
        title: triggerDef.shortLabel,
        subtitle: triggerDef.badge || '1. Disparador',
        x: trigPos.x,
        y: trigPos.y,
        width: 70,
        height: 70,
        removable: activeTriggers.length > 1,
        group: 'triggers',
      });
    });

    // ETAPA 2. NODOS DE EXTRACCIÓN DE DATOS / LECTURA PREVIA (Entre el Disparador y el Agente IA)
    activeExtractors.forEach((extId, idx) => {
      const extDef = getNodeDefById(extId) || EXTRACTOR_NODES[0];
      const key = `extractor_${extDef.id}`;
      const defaultY =
        activeExtractors.length === 1
          ? 76
          : activeExtractors.length === 2
            ? 24 + idx * 108
            : 14 + idx * 96;
      const extPos = customPositions[key] || { x: 146, y: defaultY };
      list.push({
        key,
        nodeId: extDef.id,
        shape: 'square_extractor',
        title: extDef.shortLabel,
        subtitle: extDef.badge || '2. Extraer Datos',
        x: extPos.x,
        y: extPos.y,
        width: 70,
        height: 70,
        removable: activeExtractors.length > 1,
        group: 'extractors',
      });
    });

    // ETAPA 3. AGENTE IA PRINCIPAL (Rectángulo ancho central con 3 rombos abajo: Modelo IA *, Memoria ◆, Herramienta +)
    const agentPos = customPositions['agent_root'] || { x: 274, y: 68 };
    list.push({
      key: 'agent_root',
      nodeId: agentId || 'ai_agent_root',
      shape: 'agent',
      title: 'Agente IA',
      subtitle:
        agentId === 'tenshi_avatar_orchestrator'
          ? '🐱 Tenshi Avatar (Voz 3D)'
          : agentName || 'Consultor SG-SST',
      x: agentPos.x,
      y: agentPos.y,
      width: 232,
      height: 88,
    });

    // 3A. SUB-NODO CIRCULAR: MODELO IA * (WAPPY Rotación de Claves vs Antigravity Local vs Antigravity Cloud 24/7)
    const modelPos = customPositions['sub_model'] || { x: 165, y: 228 };
    list.push({
      key: 'sub_model',
      nodeId: currentModelDef.id,
      shape: 'circle_model',
      title: currentModelDef.shortLabel,
      subtitle:
        aiEngine === 'antigravity_cloud'
          ? 'Cloud 24/7 + MCP'
          : aiEngine === 'antigravity'
            ? 'Local Mac/PC + MCP'
            : 'Rotación Claves WAPPY',
      x: modelPos.x,
      y: modelPos.y,
      width: 62,
      height: 62,
    });

    // 3B. SUB-NODOS CIRCULARES: MEMORIAS DEL AGENTE (Separación de 106px para que los textos inferiores jamás se pisen)
    activeMemories.forEach((memId, idx) => {
      const memDef = MEMORY_NODES.find((m) => m.id === memId) || MEMORY_NODES[0];
      const key = idx === 0 ? 'sub_memory' : `sub_memory_${memDef.id}`;
      const defaultX = 274 + idx * 106;
      const defaultY = 228;
      const memPos = customPositions[key] || { x: defaultX, y: defaultY };
      list.push({
        key,
        nodeId: memDef.id,
        shape: 'circle_memory',
        title: memDef.shortLabel,
        subtitle: memDef.badge || 'Memoria Activa',
        x: memPos.x,
        y: memPos.y,
        width: 62,
        height: 62,
        removable: activeMemories.length > 1,
        group: 'memories',
      });
    });

    // 3C. SUB-NODOS CIRCULARES: HERRAMIENTAS DEL AGENTE (Separación limpia de 106px)
    const toolInputs = workflowNodes?.inputs || [];
    const memoryRightEdge = 274 + Math.max(1, activeMemories.length) * 106;
    toolInputs.forEach((toolId, idx) => {
      const def = getNodeDefById(toolId);
      if (!def) return;
      const key = `tool_inputs_${toolId}`;
      const defaultX = Math.max(380, memoryRightEdge) + idx * 106;
      const defaultY = 228;
      const pos = customPositions[key] || { x: defaultX, y: defaultY };
      list.push({
        key,
        nodeId: toolId,
        shape: 'circle_tool',
        title: def.shortLabel,
        subtitle: 'Herramienta IA',
        x: pos.x,
        y: pos.y,
        width: 62,
        height: 62,
        removable: true,
        group: 'inputs',
      });
    });

    // ETAPA 4A. NODO CONDICIONAL SI / NO (Cuadrado con icono de bifurcación y salidas sí / no)
    if (includeIfNode) {
      const ifPos = customPositions['if_router'] || { x: 548, y: 76 };
      list.push({
        key: 'if_router',
        nodeId: 'if_node_router',
        shape: 'if',
        title: 'Condición Si/No',
        subtitle: 'Hallazgos / Alerta',
        x: ifPos.x,
        y: ifPos.y,
        width: 72,
        height: 72,
      });
    }

    // NODOS LÓGICOS ADICIONALES (Loop, Merge, Aprobación Humana)
    const logicNodes = workflowNodes?.canvasLayout?.logicNodes || [];
    logicNodes.forEach((ln, idx) => {
      const pos = customPositions[ln.key] || { x: 548 + idx * 115, y: 185 };
      list.push({
        key: ln.key,
        nodeId: `logic_${ln.logicType}`,
        shape: 'logic',
        title: ln.title,
        subtitle: ln.subtitle,
        x: pos.x,
        y: pos.y,
        width: 72,
        height: 72,
        removable: true,
      });
    });

    // ETAPA 4B. NODOS DE ACCIÓN EN HITOS / APLICATIVOS SOMOS SST (Cambiar / Alimentar Hitos 1–7)
    const hitosList = workflowNodes?.hitos || [];
    const hitoBaseX = includeIfNode ? 662 : 556;
    hitosList.forEach((hitoId, idx) => {
      const def = getNodeDefById(hitoId);
      if (!def) return;
      const key = `tool_hitos_${hitoId}`;
      const defaultY =
        hitosList.length === 1
          ? 76
          : hitosList.length === 2
            ? 24 + idx * 108
            : 14 + idx * 96;
      const pos = customPositions[key] || { x: hitoBaseX, y: defaultY };
      list.push({
        key,
        nodeId: hitoId,
        shape: 'square_hito',
        title: def.shortLabel,
        subtitle: '4. Cambiar en Hito',
        x: pos.x,
        y: pos.y,
        width: 72,
        height: 72,
        removable: true,
        group: 'hitos',
      });
    });

    // ETAPA 5. NODOS DE BITÁCORA Y NOTIFICACIÓN FINAL (Gmail, WAPPY Notification, Antigravity PC/Cloud)
    const outputs = workflowNodes?.outputs?.length ? workflowNodes.outputs : ['email_report'];
    const outBaseX = hitosList.length > 0 ? hitoBaseX + 128 : includeIfNode ? 674 : 566;
    outputs.forEach((outId, idx) => {
      const def = getNodeDefById(outId);
      if (!def) return;
      const key = `out_${outId}`;
      const baseY =
        outputs.length === 1
          ? 76
          : outputs.length === 2
            ? 24 + idx * 108
            : 14 + idx * 96;
      const pos = customPositions[key] || { x: outBaseX, y: baseY };
      list.push({
        key,
        nodeId: outId,
        shape: 'square_output',
        title: def.shortLabel,
        subtitle: def.badge || '5. Bitácora Final',
        x: pos.x,
        y: pos.y,
        width: 72,
        height: 72,
        removable: outputs.length > 1,
        group: 'outputs',
      });
    });

    // AGENTES IA ADICIONALES / REVISORES EN EL MISMO LIENZO (Orquestación Multi-IA con Segundo Prompt propio)
    const extraAgents = workflowNodes?.canvasLayout?.extraAgents || [];
    extraAgents.forEach((ea, idx) => {
      const pos = customPositions[ea.key] || { x: 540 + idx * 255, y: 188 };
      list.push({
        key: ea.key,
        nodeId: ea.agentId || 'ai_agent_extra',
        shape: 'agent',
        title: `Agente IA #${idx + 2}`,
        subtitle:
          ea.agentId === 'tenshi_avatar_orchestrator'
            ? '🐱 Tenshi Avatar (Voz 3D)'
            : ea.agentName || 'IA Revisora / Auditora',
        x: pos.x,
        y: pos.y,
        width: 232,
        height: 88,
        removable: true,
      });
    });

    // NODOS PERSONALIZADOS DE SKILLS, SUB-AGENTES, REGLAS, WEB SCRAPING (ANTIGRAVITY SCRIPT) Y BÚSQUEDA WEB
    const customNodesList = workflowNodes?.canvasLayout?.customNodes || [];
    customNodesList.forEach((cn, idx) => {
      const pos = customPositions[cn.key] || { x: 274 + idx * 116, y: 332 };
      list.push({
        key: cn.key,
        nodeId: cn.key,
        shape: 'custom_node',
        customNodeType: cn.nodeType,
        title: cn.title,
        subtitle: cn.subtitle,
        x: pos.x,
        y: pos.y,
        width: 74,
        height: 74,
        removable: true,
      });
    });

    return list;
  }, [
    workflowNodes,
    activeTriggers,
    activeExtractors,
    activeMemories,
    agentId,
    agentName,
    currentModelDef,
    aiEngine,
    includeIfNode,
    customPositions,
  ]);

  // Calcular los cables curvos Bezier entre los módulos (con soporte para borrar cables automáticos y conectar libremente)
  const wires = useMemo(() => {
    const map = new Map<string, VisualNodeInstance>();
    visualNodes.forEach((n) => map.set(n.key, n));

    const removedSet = new Set(workflowNodes?.canvasLayout?.removedWires || []);
    const triggerNodes = visualNodes.filter((n) => n.shape === 'trigger');
    const extractorNodes = visualNodes.filter((n) => n.shape === 'square_extractor');
    const agentNode = map.get('agent_root');
    const ifNode = map.get('if_router');
    const hitoNodes = visualNodes.filter((n) => n.shape === 'square_hito');
    const modelNode = map.get('sub_model');
    const memNodes = visualNodes.filter((n) => n.shape === 'circle_memory');
    const toolNodes = visualNodes.filter((n) => n.shape === 'circle_tool');
    const outputNodes = visualNodes.filter((n) => n.shape === 'square_output');

    const paths: Array<{
      id: string;
      d: string;
      dashed: boolean;
      color: string;
      midX: number;
      midY: number;
      label?: string;
      labelX?: number;
      labelY?: number;
    }> = [];

    const pushWire = (w: {
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      dashed: boolean;
      color: string;
      isSub?: boolean;
      label?: string;
      labelX?: number;
      labelY?: number;
    }) => {
      if (removedSet.has(w.id)) return;
      const d = w.isSub
        ? (() => {
            const dy = Math.max(38, Math.abs(w.y2 - w.y1) * 0.52);
            return `M ${w.x1} ${w.y1} C ${w.x1} ${w.y1 + dy}, ${w.x2} ${w.y2 - dy}, ${w.x2} ${w.y2}`;
          })()
        : (() => {
            const dx = Math.max(36, Math.abs(w.x2 - w.x1) * 0.48);
            return `M ${w.x1} ${w.y1} C ${w.x1 + dx} ${w.y1}, ${w.x2 - dx} ${w.y2}, ${w.x2} ${w.y2}`;
          })();
      paths.push({
        id: w.id,
        d,
        dashed: w.dashed,
        color: w.color,
        midX: Math.round((w.x1 + w.x2) / 2),
        midY: Math.round((w.y1 + w.y2) / 2),
        label: w.label,
        labelX: w.labelX,
        labelY: w.labelY,
      });
    };

    // 1. Etapa 1 (Disparadores) ● ──> ● Etapa 2 (Extraer Datos) ● ──> ● Etapa 3 (Agente IA)
    if (extractorNodes.length > 0 && agentNode) {
      triggerNodes.forEach((trigNode) => {
        extractorNodes.forEach((extNode) => {
          pushWire({
            id: `wire_trig_ext_${trigNode.key}_${extNode.key}`,
            x1: trigNode.x + trigNode.width,
            y1: trigNode.y + trigNode.height / 2,
            x2: extNode.x,
            y2: extNode.y + extNode.height / 2,
            dashed: false,
            color: '#94a3b8',
          });
        });
      });

      extractorNodes.forEach((extNode) => {
        pushWire({
          id: `wire_ext_agent_${extNode.key}`,
          x1: extNode.x + extNode.width,
          y1: extNode.y + extNode.height / 2,
          x2: agentNode.x,
          y2: agentNode.y + agentNode.height / 2,
          dashed: false,
          color: '#0ea5e9',
        });
      });
    } else if (agentNode) {
      triggerNodes.forEach((trigNode) => {
        pushWire({
          id: `wire_trigger_agent_${trigNode.key}`,
          x1: trigNode.x + trigNode.width,
          y1: trigNode.y + trigNode.height / 2,
          x2: agentNode.x,
          y2: agentNode.y + agentNode.height / 2,
          dashed: false,
          color: '#94a3b8',
        });
      });
    }

    // 2. Etapa 3 (Agente IA) ● ──> ● Condición Si/No ──> ● Etapa 4 (Hitos/Apps) ──> ● Etapa 5 (Bitácora Final)
    const stageAfterAgent = ifNode ? [ifNode] : hitoNodes.length > 0 ? hitoNodes : outputNodes;
    if (agentNode) {
      stageAfterAgent.forEach((target) => {
        pushWire({
          id: `wire_agent_${target.key}`,
          x1: agentNode.x + agentNode.width,
          y1: agentNode.y + agentNode.height / 2,
          x2: target.x,
          y2: target.y + target.height / 2,
          dashed: false,
          color: '#94a3b8',
        });
      });
    }

    if (ifNode) {
      const nextTargets = hitoNodes.length > 0 ? hitoNodes : outputNodes;
      nextTargets.forEach((target, idx) => {
        const isTrueBranch = idx === 0;
        const x1Port = ifNode.x + ifNode.width;
        const y1Port = ifNode.y + (isTrueBranch ? 24 : 50);
        pushWire({
          id: `wire_if_${target.key}`,
          x1: x1Port,
          y1: y1Port,
          x2: target.x,
          y2: target.y + target.height / 2,
          dashed: false,
          color: isTrueBranch ? '#10b981' : '#94a3b8',
          label: isTrueBranch ? 'sí' : 'no',
          labelX: x1Port + 16,
          labelY: y1Port - 5,
        });
      });
    }

    if (hitoNodes.length > 0 && outputNodes.length > 0) {
      hitoNodes.forEach((hNode) => {
        outputNodes.forEach((outNode) => {
          pushWire({
            id: `wire_hito_out_${hNode.key}_${outNode.key}`,
            x1: hNode.x + hNode.width,
            y1: hNode.y + hNode.height / 2,
            x2: outNode.x,
            y2: outNode.y + outNode.height / 2,
            dashed: false,
            color: '#10b981',
          });
        });
      });
    }

    // 3A. Agente IA ◆ (Modelo IA *) ── - - ──> ◆ Sub-Nodo Circular Modelo
    if (agentNode && modelNode) {
      pushWire({
        id: 'wire_sub_model',
        x1: agentNode.x + 44,
        y1: agentNode.y + agentNode.height,
        x2: modelNode.x + modelNode.width / 2,
        y2: modelNode.y,
        dashed: true,
        isSub: true,
        color: '#818cf8',
      });
    }

    // 3B. Agente IA ◆ (Memoria) ── - - ──> ◆ Sub-Nodos Circulares de Memoria
    if (agentNode) {
      memNodes.forEach((mNode) => {
        pushWire({
          id: `wire_sub_memory_${mNode.key}`,
          x1: agentNode.x + 114,
          y1: agentNode.y + agentNode.height,
          x2: mNode.x + mNode.width / 2,
          y2: mNode.y,
          dashed: true,
          isSub: true,
          color: '#ec4899',
        });
      });
    }

    // 3C. Agente IA ◆ (Herramienta +) ── - - ──> ◆ Sub-Nodos Circulares de Herramientas del Agente
    if (agentNode) {
      toolNodes.forEach((tNode) => {
        pushWire({
          id: `wire_sub_tool_${tNode.key}`,
          x1: agentNode.x + 184,
          y1: agentNode.y + agentNode.height,
          x2: tNode.x + tNode.width / 2,
          y2: tNode.y,
          dashed: true,
          isSub: true,
          color: '#818cf8',
        });
      });
    }

    // 6. Cables personalizados creados por el usuario (validando que los sub-nodos circulares JAMÁS queden como salida principal)
    const customEdges = workflowNodes?.canvasLayout?.edges || [];
    customEdges.forEach((edge) => {
      const fromNode = map.get(edge.from);
      const toNode = map.get(edge.to);
      if (!fromNode || !toNode) return;

      const isFromSubCircle = fromNode.shape.startsWith('circle_');
      const isToSubCircle = toNode.shape.startsWith('circle_');

      // Si cualquiera de los extremos es un sub-nodo circular (Modelo IA, Memoria o Herramienta),
      // SOLO puede conectarse verticalmente (rombo a rombo) con un Agente IA, jamás con If o Salidas.
      if (isFromSubCircle || isToSubCircle) {
        const agNode = fromNode.shape === 'agent' ? fromNode : toNode.shape === 'agent' ? toNode : null;
        const subCircle = isFromSubCircle ? fromNode : isToSubCircle ? toNode : null;
        if (!agNode || !subCircle) return;
        const portOffsetX =
          subCircle.shape === 'circle_model'
            ? 44
            : subCircle.shape === 'circle_memory'
              ? 114
              : 184;
        pushWire({
          id: edge.id,
          x1: agNode.x + portOffsetX,
          y1: agNode.y + agNode.height,
          x2: subCircle.x + subCircle.width / 2,
          y2: subCircle.y,
          dashed: true,
          isSub: true,
          color: subCircle.shape === 'circle_memory' ? '#ec4899' : '#818cf8',
        });
        return;
      }

      pushWire({
        id: edge.id,
        x1: fromNode.x + fromNode.width,
        y1: fromNode.y + fromNode.height / 2,
        x2: toNode.x,
        y2: toNode.y + toNode.height / 2,
        dashed: false,
        color: '#14b8a6',
      });
    });

    return paths;
  }, [visualNodes, workflowNodes?.canvasLayout?.edges, workflowNodes?.canvasLayout?.removedWires]);

  // Eliminar un cable individual (ya sea automático o creado por el usuario) para reconectar libremente
  const handleRemoveWire = (wireId: string) => {
    if (!onChange || readOnly) return;
    if (wireId.startsWith('custom_')) {
      const nextEdges = (workflowNodes?.canvasLayout?.edges || []).filter((e) => e.id !== wireId);
      onChange({
        ...workflowNodes,
        canvasLayout: {
          ...(workflowNodes?.canvasLayout || {}),
          edges: nextEdges,
        },
      });
    } else {
      const prevRemoved = workflowNodes?.canvasLayout?.removedWires || [];
      if (!prevRemoved.includes(wireId)) {
        onChange({
          ...workflowNodes,
          canvasLayout: {
            ...(workflowNodes?.canvasLayout || {}),
            removedWires: [...prevRemoved, wireId],
          },
        });
      }
    }
  };

  // Cortar todos los cables principales automáticos para conectar desde cero en modo 100% libre
  const handleDisconnectAllMainWires = () => {
    if (!onChange || readOnly) return;
    const mainAutoIds = wires
      .filter((w) => !w.dashed && !w.id.startsWith('custom_'))
      .map((w) => w.id);
    const prevRemoved = workflowNodes?.canvasLayout?.removedWires || [];
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        removedWires: Array.from(new Set([...prevRemoved, ...mainAutoIds])),
      },
    });
  };

  // Actualizar la configuración individual de cualquier nodo del lienzo (campos, contexto entrada/salida, segundo prompt, modelo IA, scraping, skills, reglas)
  const handleUpdateNodeConfig = (nodeKey: string, partial: Partial<CanvasNodeConfig>) => {
    if (!onChange || readOnly) return;
    const prevConfigs = workflowNodes?.canvasLayout?.nodeConfigs || {};
    const nextConfig: CanvasNodeConfig = {
      ...(prevConfigs[nodeKey] || {}),
      ...partial,
    };

    // Si es un Agente IA Adicional (#2, #3), sincronizar también en extraAgents
    let nextExtra = workflowNodes?.canvasLayout?.extraAgents;
    if (nodeKey.startsWith('agent_extra_') && Array.isArray(nextExtra)) {
      nextExtra = nextExtra.map((ea) =>
        ea.key === nodeKey
          ? {
              ...ea,
              ...(partial.aiEngine ? { aiEngine: partial.aiEngine } : {}),
              ...(partial.aiModel ? { aiModel: partial.aiModel } : {}),
              ...(partial.prompt !== undefined ? { prompt: partial.prompt } : {}),
              ...(partial.inputContext !== undefined ? { inputContext: partial.inputContext } : {}),
              ...(partial.outputContext !== undefined ? { outputContext: partial.outputContext } : {}),
            }
          : ea,
      );
    }

    // Si es un Nodo Personalizado (Skill, Sub-Agente, Regla, Web Scraper, Búsqueda Web), sincronizar también en customNodes
    let nextCustomNodes = workflowNodes?.canvasLayout?.customNodes;
    if (Array.isArray(nextCustomNodes) && nextCustomNodes.some((cn) => cn.key === nodeKey)) {
      nextCustomNodes = nextCustomNodes.map((cn) =>
        cn.key === nodeKey
          ? {
              ...cn,
              ...(partial.targetUrl !== undefined ? { targetUrl: partial.targetUrl } : {}),
              ...(partial.scriptEngine ? { scriptEngine: partial.scriptEngine } : {}),
              ...(partial.scriptCode !== undefined ? { scriptCode: partial.scriptCode } : {}),
              ...(partial.skillContent !== undefined ? { content: partial.skillContent } : {}),
              ...(partial.ruleText !== undefined ? { content: partial.ruleText } : {}),
              ...(partial.prompt !== undefined ? { content: partial.prompt } : {}),
            }
          : cn,
      );
    }

    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        ...(nextExtra ? { extraAgents: nextExtra } : {}),
        ...(nextCustomNodes ? { customNodes: nextCustomNodes } : {}),
        nodeConfigs: {
          ...prevConfigs,
          [nodeKey]: nextConfig,
        },
      },
    });
  };

  // Agregar un nodo de Skill, Sub-Agente, Regla, Web Scraping con Antigravity o Búsqueda Web al lienzo
  const handleAddCustomNodeToCanvas = (
    nodeData: Omit<CanvasCustomUserNode, 'key'> & { key?: string },
    dropPos?: { x: number; y: number },
  ) => {
    if (!onChange || readOnly) return;
    const prevCustom = workflowNodes?.canvasLayout?.customNodes || [];
    const baseKey = nodeData.key || `custom_${nodeData.nodeType}_${Date.now()}`;
    const alreadyExists = prevCustom.find((c) => c.key === baseKey);
    if (alreadyExists) {
      setActiveConfigNodeKey(alreadyExists.key);
      return;
    }
    const newCustomNode: CanvasCustomUserNode = {
      ...nodeData,
      key: baseKey,
    };
    const nextPositions = { ...(workflowNodes?.canvasLayout?.positions || {}) };
    if (dropPos) {
      nextPositions[baseKey] = {
        x: Math.max(20, Math.round(dropPos.x - 37)),
        y: Math.max(20, Math.round(dropPos.y - 37)),
      };
    }
    const prevConfigs = workflowNodes?.canvasLayout?.nodeConfigs || {};
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        customNodes: [...prevCustom, newCustomNode],
        positions: nextPositions,
        nodeConfigs: {
          ...prevConfigs,
          [baseKey]: {
            ...(prevConfigs[baseKey] || {}),
            ...(newCustomNode.targetUrl ? { targetUrl: newCustomNode.targetUrl } : {}),
            ...(newCustomNode.scriptEngine ? { scriptEngine: newCustomNode.scriptEngine } : {}),
            ...(newCustomNode.scriptCode ? { scriptCode: newCustomNode.scriptCode } : {}),
            ...(newCustomNode.nodeType === 'skill' && newCustomNode.content
              ? { skillContent: newCustomNode.content }
              : {}),
            ...(newCustomNode.nodeType === 'rule' && newCustomNode.content
              ? { ruleText: newCustomNode.content }
              : {}),
            ...(newCustomNode.nodeType === 'subagent' && newCustomNode.content
              ? { prompt: newCustomNode.content }
              : {}),
          },
        },
      },
    });
    setActiveConfigNodeKey(baseKey);
  };

  // Crear un nodo propio desde el formulario "+ Crear Mi Propio Nodo", guardarlo en la librería local del usuario y añadirlo al lienzo
  const handleCreateAndSaveCustomNode = () => {
    if (!onChange || readOnly) return;
    const cleanTitle = newCustomNodeForm.title.trim();
    if (!cleanTitle) return;

    const defaultSubtitles: Record<CanvasCustomUserNode['nodeType'], string> = {
      skill: 'Skill Procedural',
      subagent: 'Sub-Agente IA',
      rule: 'Regla Obligatoria',
      web_scraper: 'Script Antigravity',
      web_search: 'Búsqueda en Vivo',
    };
    const createdNode: CanvasCustomUserNode = {
      key: `user_${newCustomNodeForm.nodeType}_${Date.now()}`,
      nodeType: newCustomNodeForm.nodeType,
      title: cleanTitle,
      subtitle: newCustomNodeForm.subtitle.trim() || defaultSubtitles[newCustomNodeForm.nodeType],
      content: newCustomNodeForm.content.trim() || `Ejecutar ${cleanTitle} dentro del flujo.`,
      ...(newCustomNodeForm.targetUrl.trim()
        ? { targetUrl: newCustomNodeForm.targetUrl.trim() }
        : {}),
      ...(newCustomNodeForm.nodeType === 'web_scraper'
        ? {
            scriptEngine: newCustomNodeForm.scriptEngine,
            scriptCode:
              newCustomNodeForm.scriptCode.trim() ||
              `# Script Web Scraping en Google Antigravity (${newCustomNodeForm.scriptEngine})\n# Extraer contenido estructurado y tablas de: ${newCustomNodeForm.targetUrl.trim() || 'https://...'}`,
          }
        : {}),
    };

    const nextLibrary = [createdNode, ...savedUserLibraryNodes];
    setSavedUserLibraryNodes(nextLibrary);
    try {
      localStorage.setItem('wappy_custom_workflow_nodes_v1', JSON.stringify(nextLibrary));
    } catch (_) {}

    handleAddCustomNodeToCanvas(createdNode);
    setNewCustomNodeForm({
      nodeType: newCustomNodeForm.nodeType,
      title: '',
      subtitle: '',
      content: '',
      targetUrl: '',
      scriptEngine: 'python_bs4',
      scriptCode: '',
    });
    setShowCustomNodeBuilder(false);
  };

  const handleRemoveCustomNode = (key: string) => {
    if (!onChange || readOnly) return;
    const nextCustom = (workflowNodes?.canvasLayout?.customNodes || []).filter((c) => c.key !== key);
    const nextEdges = (workflowNodes?.canvasLayout?.edges || []).filter(
      (ed) => ed.from !== key && ed.to !== key,
    );
    if (activeConfigNodeKey === key) setActiveConfigNodeKey(null);
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        customNodes: nextCustom,
        edges: nextEdges,
      },
    });
  };

  // Agregar un Nodo Lógico (Loop, Merge, Aprobación Humana)
  const handleAddLogicNode = (logicType: 'loop' | 'merge' | 'human_approval') => {
    if (!onChange || readOnly) return;
    const prevLogic = workflowNodes?.canvasLayout?.logicNodes || [];
    const newKey = `logic_${logicType}_${Date.now()}`;
    const meta =
      logicType === 'loop'
        ? { title: 'Iterar (Loop)', subtitle: 'Por cada Registro' }
        : logicType === 'merge'
          ? { title: 'Unir Ramas', subtitle: 'Combinar Flujos' }
          : { title: 'Aprobación', subtitle: 'Visto Bueno Humano' };
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        logicNodes: [...prevLogic, { key: newKey, logicType, ...meta }],
      },
    });
    setActiveConfigNodeKey(newKey);
  };

  const handleRemoveLogicNode = (key: string) => {
    if (!onChange || readOnly) return;
    const nextLogic = (workflowNodes?.canvasLayout?.logicNodes || []).filter((ln) => ln.key !== key);
    const nextEdges = (workflowNodes?.canvasLayout?.edges || []).filter(
      (ed) => ed.from !== key && ed.to !== key,
    );
    if (activeConfigNodeKey === key) setActiveConfigNodeKey(null);
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        logicNodes: nextLogic,
        edges: nextEdges,
      },
    });
  };

  // Agregar un Agente IA adicional (ej. Segunda IA Revisora / Auditora en el mismo flujo con su propio Segundo Prompt)
  const handleAddExtraAgent = () => {
    if (!onChange || readOnly) return;
    const prevExtra = workflowNodes?.canvasLayout?.extraAgents || [];
    const newKey = `agent_extra_${Date.now()}`;
    const defaultAgent = availableAgentsWithTenshiAvatar[1] || availableAgentsWithTenshiAvatar[0];
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        extraAgents: [
          ...prevExtra,
          {
            key: newKey,
            agentId: defaultAgent?.id || 'tenshi_avatar_orchestrator',
            agentName: defaultAgent?.name || 'IA Revisora / Auditora SST',
            aiEngine: 'wappy',
            aiModel: 'gemini-3.6-flash',
            prompt: '',
          },
        ],
      },
    });
    setActiveConfigNodeKey(newKey);
  };

  // Actualizar o quitar un Agente IA adicional
  const handleUpdateExtraAgent = (key: string, newAgentId: string) => {
    if (!onChange || readOnly) return;
    const found = availableAgentsWithTenshiAvatar.find((a) => a.id === newAgentId);
    const nextExtra = (workflowNodes?.canvasLayout?.extraAgents || []).map((ea) =>
      ea.key === key
        ? { ...ea, agentId: newAgentId, agentName: found?.name || ea.agentName }
        : ea,
    );
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        extraAgents: nextExtra,
      },
    });
  };

  const handleRemoveExtraAgent = (key: string) => {
    if (!onChange || readOnly) return;
    const nextExtra = (workflowNodes?.canvasLayout?.extraAgents || []).filter((ea) => ea.key !== key);
    const nextEdges = (workflowNodes?.canvasLayout?.edges || []).filter(
      (ed) => ed.from !== key && ed.to !== key,
    );
    if (activeConfigNodeKey === key) setActiveConfigNodeKey(null);
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        extraAgents: nextExtra,
        edges: nextEdges,
      },
    });
  };

  // Actualizar posición de un nodo al arrastrarlo
  const updateNodePosition = useCallback(
    (nodeKey: string, x: number, y: number) => {
      if (!onChange || readOnly) return;
      const nextPositions: Record<string, CanvasNodePosition> = {
        ...(workflowNodes?.canvasLayout?.positions || {}),
        [nodeKey]: { x: Math.max(12, Math.round(x)), y: Math.max(12, Math.round(y)) },
      };
      onChange({
        ...workflowNodes,
        canvasLayout: {
          ...(workflowNodes?.canvasLayout || {}),
          positions: nextPositions,
        },
      });
    },
    [onChange, readOnly, workflowNodes],
  );

  // Actualizar posiciones de múltiples nodos a la vez (mover una parte seleccionada o todo el flujo)
  const updateMultipleNodePositions = useCallback(
    (updates: Record<string, CanvasNodePosition>) => {
      if (!onChange || readOnly) return;
      const nextPositions: Record<string, CanvasNodePosition> = {
        ...(workflowNodes?.canvasLayout?.positions || {}),
        ...updates,
      };
      onChange({
        ...workflowNodes,
        canvasLayout: {
          ...(workflowNodes?.canvasLayout || {}),
          positions: nextPositions,
        },
      });
    },
    [onChange, readOnly, workflowNodes],
  );

  // Seleccionar todo el flujo (o deseleccionar si ya están todos marcados)
  const handleSelectAllNodes = () => {
    const allKeys = visualNodes.map((n) => n.key);
    if (selectedNodeKeys.length === allKeys.length && allKeys.length > 0) {
      setSelectedNodeKeys([]);
    } else {
      setSelectedNodeKeys(allKeys);
    }
  };

  // Iniciar arrastre en el fondo del lienzo: Manita (desplazar vista) o Recuadro de Selección (Seleccionar Parte)
  const handleBackgroundPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-canvas-toolbar="true"]')) return;

    if (!readOnly && (canvasTool === 'select' || e.shiftKey)) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pointerX = (e.clientX - rect.left) / zoom;
      const pointerY = (e.clientY - rect.top) / zoom;
      setMarqueeBox({ startX: pointerX, startY: pointerY, currX: pointerX, currY: pointerY });
      if (!e.shiftKey) {
        setSelectedNodeKeys([]);
      }
      return;
    }

    if (scrollContainerRef.current) {
      setIsPanning(true);
      setPanStart({
        clientX: e.clientX,
        clientY: e.clientY,
        scrollLeft: scrollContainerRef.current.scrollLeft,
        scrollTop: scrollContainerRef.current.scrollTop,
      });
    }
  };

  // Iniciar arrastre de un nodo (individual o de todo el grupo seleccionado) y registrar posición para detectar clic de edición
  const handleNodePointerDown = (e: React.PointerEvent, node: VisualNodeInstance) => {
    if (readOnly) return;
    e.stopPropagation();
    pointerDownClientRef.current = { x: e.clientX, y: e.clientY };

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pointerX = (e.clientX - rect.left) / zoom;
    const pointerY = (e.clientY - rect.top) / zoom;

    if (e.shiftKey) {
      setSelectedNodeKeys((prev) =>
        prev.includes(node.key) ? prev.filter((k) => k !== node.key) : [...prev, node.key],
      );
      return;
    }

    if (selectedNodeKeys.includes(node.key) && selectedNodeKeys.length > 1) {
      const initialPositions: Record<string, CanvasNodePosition> = {};
      visualNodes.forEach((vn) => {
        if (selectedNodeKeys.includes(vn.key)) {
          initialPositions[vn.key] = { x: vn.x, y: vn.y };
        }
      });
      setGroupDragStart({ pointerX, pointerY, initialPositions });
      return;
    }

    setDraggingNodeKey(node.key);
    setDragOffset({ dx: pointerX - node.x, dy: pointerY - node.y });
  };

  // Iniciar trazado de cable desde un puerto (● o ◆)
  const handlePortPointerDown = (
    e: React.PointerEvent,
    sourceKey: string,
    portType: 'main_out' | 'diamond_model' | 'diamond_memory' | 'diamond_tool' | 'if_true' | 'if_false',
    startX: number,
    startY: number,
  ) => {
    if (readOnly) return;
    e.stopPropagation();
    setWiringFrom({
      sourceKey,
      portType,
      startX,
      startY,
      currX: startX,
      currY: startY,
    });
  };

  // Movimiento del puntero sobre el lienzo
  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (isPanning && panStart && scrollContainerRef.current) {
      const dx = e.clientX - panStart.clientX;
      const dy = e.clientY - panStart.clientY;
      scrollContainerRef.current.scrollLeft = panStart.scrollLeft - dx;
      scrollContainerRef.current.scrollTop = panStart.scrollTop - dy;
      return;
    }

    if (readOnly) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pointerX = (e.clientX - rect.left) / zoom;
    const pointerY = (e.clientY - rect.top) / zoom;

    if (groupDragStart) {
      const dx = pointerX - groupDragStart.pointerX;
      const dy = pointerY - groupDragStart.pointerY;
      const batchUpdates: Record<string, CanvasNodePosition> = {};
      Object.entries(groupDragStart.initialPositions).forEach(([key, initPos]) => {
        batchUpdates[key] = {
          x: Math.max(12, Math.round(initPos.x + dx)),
          y: Math.max(12, Math.round(initPos.y + dy)),
        };
      });
      updateMultipleNodePositions(batchUpdates);
    } else if (draggingNodeKey) {
      updateNodePosition(draggingNodeKey, pointerX - dragOffset.dx, pointerY - dragOffset.dy);
    } else if (marqueeBox) {
      const nextBox = { ...marqueeBox, currX: pointerX, currY: pointerY };
      setMarqueeBox(nextBox);
      const minX = Math.min(nextBox.startX, nextBox.currX);
      const maxX = Math.max(nextBox.startX, nextBox.currX);
      const minY = Math.min(nextBox.startY, nextBox.currY);
      const maxY = Math.max(nextBox.startY, nextBox.currY);
      const hits = visualNodes
        .filter((vn) => vn.x + vn.width >= minX && vn.x <= maxX && vn.y + vn.height >= minY && vn.y <= maxY)
        .map((vn) => vn.key);
      setSelectedNodeKeys(hits);
    } else if (wiringFrom) {
      setWiringFrom((prev) => (prev ? { ...prev, currX: pointerX, currY: pointerY } : null));
    }
  };

  // Soltar manita, selección, grupo, nodo o finalizar conexión de cable (y abrir el editor del nodo si fue un clic directo)
  const handleCanvasPointerUp = (targetNodeKey?: string, e?: React.PointerEvent) => {
    if (
      targetNodeKey &&
      !wiringFrom &&
      pointerDownClientRef.current &&
      e &&
      Math.hypot(e.clientX - pointerDownClientRef.current.x, e.clientY - pointerDownClientRef.current.y) < 6
    ) {
      setActiveConfigNodeKey(targetNodeKey);
    }
    pointerDownClientRef.current = null;

    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
    }
    if (groupDragStart) {
      setGroupDragStart(null);
    }
    if (marqueeBox) {
      setMarqueeBox(null);
    }
    if (draggingNodeKey) {
      setDraggingNodeKey(null);
    }
    if (wiringFrom) {
      if (targetNodeKey && targetNodeKey !== wiringFrom.sourceKey && onChange) {
        const sourceNode = visualNodes.find((n) => n.key === wiringFrom.sourceKey);
        const targetNode = visualNodes.find((n) => n.key === targetNodeKey);
        const isDiamondWire = wiringFrom.portType.startsWith('diamond');
        const isTargetSubCircle = Boolean(targetNode?.shape.startsWith('circle_'));
        const isSourceSubCircle = Boolean(sourceNode?.shape.startsWith('circle_'));

        // Validar que los puertos rombo (Modelo IA, Memoria, Herramienta) SOLO conecten con sub-nodos circulares,
        // y que los sub-nodos circulares NUNCA se conecten como salida horizontal hacia If o Salidas.
        const isValidConnection = isDiamondWire
          ? isTargetSubCircle
          : !isSourceSubCircle && !isTargetSubCircle;

        if (isValidConnection) {
          const existingEdges = workflowNodes?.canvasLayout?.edges || [];
          const edgeId = `custom_${wiringFrom.sourceKey}_${targetNodeKey}`;
          if (!existingEdges.some((ed) => ed.id === edgeId)) {
            onChange({
              ...workflowNodes,
              canvasLayout: {
                ...(workflowNodes?.canvasLayout || {}),
                edges: [
                  ...existingEdges,
                  {
                    id: edgeId,
                    from: wiringFrom.sourceKey,
                    to: targetNodeKey,
                    kind: isDiamondWire ? 'sub' : 'main',
                  },
                ],
              },
            });
          }
        }
      }
      setWiringFrom(null);
    }
  };

  // Agregar o quitar un disparador/extractor/memoria/herramienta/hito/salida o cambiar motor IA
  const toggleOrAddCatalogNode = (
    group: 'trigger' | 'extractors' | 'memories' | 'inputs' | 'hitos' | 'outputs',
    nodeId: string,
    dropPos?: { x: number; y: number },
  ) => {
    if (!onChange || readOnly) return;

    const candidateNode = getNodeDefById(nodeId);
    if (isWorkflowNodeUnderConstruction(candidateNode, disabledSgsstApps)) {
      setConstructionNotice(
        `🚧 «${candidateNode?.label || nodeId}» se encuentra en modo Construcción en Somos SST: el nodo aparece en su Hito pero aún no se puede seleccionar.`,
      );
      return;
    }
    setConstructionNotice(null);

    if (group === 'trigger') {
      const exists = activeTriggers.includes(nodeId);
      let nextTriggers: string[];
      if (exists) {
        nextTriggers =
          activeTriggers.length > 1
            ? activeTriggers.filter((id) => id !== nodeId)
            : activeTriggers;
      } else {
        nextTriggers = [...activeTriggers, nodeId];
      }
      const nextPositions = { ...(workflowNodes?.canvasLayout?.positions || {}) };
      if (!exists && dropPos) {
        const key = nextTriggers.indexOf(nodeId) === 0 ? 'trigger_root' : `trigger_${nodeId}`;
        nextPositions[key] = {
          x: Math.max(20, Math.round(dropPos.x - 36)),
          y: Math.max(16, Math.round(dropPos.y - 36)),
        };
      }
      onChange({
        ...workflowNodes,
        trigger: nextTriggers[0] || 'schedule_cron',
        triggers: nextTriggers,
        canvasLayout: {
          ...(workflowNodes?.canvasLayout || {}),
          positions: nextPositions,
        },
      });
      return;
    }

    if (group === 'memories') {
      const exists = activeMemories.includes(nodeId);
      const nextMemories = exists
        ? activeMemories.length > 1
          ? activeMemories.filter((id) => id !== nodeId)
          : activeMemories
        : [...activeMemories, nodeId];
      const nextPositions = { ...(workflowNodes?.canvasLayout?.positions || {}) };
      if (!exists && dropPos) {
        nextPositions[`sub_memory_${nodeId}`] = {
          x: Math.max(20, Math.round(dropPos.x - 31)),
          y: Math.max(20, Math.round(dropPos.y - 31)),
        };
      }
      onChange({
        ...workflowNodes,
        memory: nextMemories[0] || 'wappy_memory_company',
        memories: nextMemories,
        canvasLayout: {
          ...(workflowNodes?.canvasLayout || {}),
          positions: nextPositions,
        },
      });
      return;
    }

    const currentList =
      group === 'extractors' ? activeExtractors : workflowNodes[group] || [];
    const exists = currentList.includes(nodeId);
    const nextList = exists
      ? currentList.filter((id) => id !== nodeId)
      : [...currentList, nodeId];

    const key =
      group === 'extractors'
        ? `ext_${nodeId}`
        : group === 'hitos'
          ? `hito_${nodeId}`
          : group === 'outputs'
            ? `out_${nodeId}`
            : `tool_${group}_${nodeId}`;
    const nextPositions = { ...(workflowNodes?.canvasLayout?.positions || {}) };
    if (!exists && dropPos) {
      nextPositions[key] = {
        x: Math.max(20, Math.round(dropPos.x - 32)),
        y: Math.max(20, Math.round(dropPos.y - 32)),
      };
    }

    onChange({
      ...workflowNodes,
      [group]: nextList,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        positions: nextPositions,
      },
    });
  };

  // Cambiar Motor IA (WAPPY Rotación de Claves vs Antigravity Local vs Antigravity Cloud 24/7) y Modelo
  const handleSelectAiEngineModel = (
    engine: 'wappy' | 'antigravity' | 'antigravity_cloud',
    model: string,
  ) => {
    if (!onChange || readOnly) return;
    const nextInputs = [...(workflowNodes.inputs || [])];
    if (engine === 'antigravity' && !nextInputs.includes('google_antigravity')) {
      nextInputs.push('google_antigravity');
    } else if (engine === 'antigravity_cloud' && !nextInputs.includes('google_antigravity_cloud')) {
      nextInputs.push('google_antigravity_cloud');
    }
    onChange({
      ...workflowNodes,
      aiEngine: engine,
      aiModel: model,
      inputs: nextInputs,
    });
  };

  // Soltar un cuadrito arrastrado desde la paleta sobre el lienzo de flujo
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (readOnly || !onChange) return;
    const raw = e.dataTransfer.getData('application/wappy-flow-node');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const rect = canvasRef.current?.getBoundingClientRect();
      const dropPos = rect
        ? {
            x: (e.clientX - rect.left) / zoom,
            y: (e.clientY - rect.top) / zoom,
          }
        : undefined;

      if (parsed.kind === 'ai_engine') {
        handleSelectAiEngineModel(parsed.engine, parsed.model);
      } else if (parsed.kind === 'custom_node' && parsed.customNode) {
        handleAddCustomNodeToCanvas(parsed.customNode, dropPos);
      } else if (parsed.group && parsed.nodeId) {
        if (parsed.group === 'trigger') {
          if (!activeTriggers.includes(parsed.nodeId)) {
            toggleOrAddCatalogNode('trigger', parsed.nodeId, dropPos);
          } else if (dropPos) {
            const idx = activeTriggers.indexOf(parsed.nodeId);
            const key = idx === 0 ? 'trigger_root' : `trigger_${parsed.nodeId}`;
            updateNodePosition(key, dropPos.x - 36, dropPos.y - 36);
          }
        } else if (parsed.group === 'memories') {
          if (!activeMemories.includes(parsed.nodeId)) {
            toggleOrAddCatalogNode('memories', parsed.nodeId, dropPos);
          } else if (dropPos) {
            updateNodePosition(`sub_memory_${parsed.nodeId}`, dropPos.x - 31, dropPos.y - 31);
          }
        } else {
          const arr =
            parsed.group === 'extractors'
              ? activeExtractors
              : workflowNodes[parsed.group as 'inputs' | 'hitos' | 'outputs'] || [];
          if (!arr.includes(parsed.nodeId)) {
            toggleOrAddCatalogNode(parsed.group, parsed.nodeId, dropPos);
          } else if (dropPos) {
            const key =
              parsed.group === 'extractors'
                ? `ext_${parsed.nodeId}`
                : parsed.group === 'hitos'
                  ? `hito_${parsed.nodeId}`
                  : parsed.group === 'outputs'
                    ? `out_${parsed.nodeId}`
                    : `tool_${parsed.group}_${parsed.nodeId}`;
            updateNodePosition(key, dropPos.x - 32, dropPos.y - 32);
          }
        }
      }
    } catch (_) {}
  };

  // Restablecer posiciones automáticas limpias en el lienzo
  const handleResetLayout = () => {
    if (!onChange || readOnly) return;
    setSelectedNodeKeys([]);
    onChange({
      ...workflowNodes,
      canvasLayout: null,
    });
  };

  // Calcular ancho y alto dinámicos del área de trabajo con margen amplio para desplazarse y mover el flujo a un lado
  const canvasMinWidth = useMemo(() => {
    const maxRight = visualNodes.reduce((acc, n) => Math.max(acc, n.x + n.width + 260), 1180);
    return Math.max(1180, maxRight);
  }, [visualNodes]);

  const canvasMinHeight = useMemo(() => {
    const maxBottom = visualNodes.reduce((acc, n) => Math.max(acc, n.y + n.height + 135), 470);
    return Math.max(470, maxBottom);
  }, [visualNodes]);

  return (
    <div className="flex flex-col gap-3">
      {/* ─── BARRA DE PALETA DE CUADRITOS CON LOGOS SVG ORIGINALES (Solo en modo editor) ─── */}
      {!readOnly && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm">
          {/* Pestañas de las 5 Etapas del Flujo + 3 Rombos del Agente + Botón Autogenerar Prompt */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'triggers', label: '⚡ 1. Disparador', badge: activeTriggers.length },
                { id: 'extractors', label: '📥 2. Extraer Datos', badge: activeExtractors.length },
                {
                  id: 'ai_engine',
                  label: '🧠 3. Motor IA',
                  badge:
                    aiEngine === 'antigravity_cloud'
                      ? 'AGY Cloud'
                      : aiEngine === 'antigravity'
                        ? 'AGY Local'
                        : aiModel.replace('gemini-', ''),
                },
                { id: 'memories', label: '💾 4. Memorias del Agente', badge: activeMemories.length },
                { id: 'connectors', label: '🔧 5. Herramientas del Agente', badge: (workflowNodes.inputs || []).length },
                { id: 'hitos', label: '🛡️ 6. Los 8 Hitos / 50 Apps SST', badge: (workflowNodes.hitos || []).length },
                { id: 'outputs', label: '📤 7. Bitácora & Salida', badge: (workflowNodes.outputs || []).length },
                {
                  id: 'skills_rules',
                  label: '🧩 8. Skills, Sub-Agentes, Reglas & Scraping',
                  badge: (workflowNodes?.canvasLayout?.customNodes || []).length,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setPaletteTab(tab.id as any);
                    setConstructionNotice(null);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition flex items-center gap-1.5 border ${
                    paletteTab === tab.id
                      ? 'bg-slate-900 text-white dark:bg-[#C7F303] dark:text-[#0E1300] border-transparent shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                      paletteTab === tab.id
                        ? 'bg-white/20 text-white dark:bg-black/15 dark:text-[#0E1300]'
                        : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              ))}
            </div>

            {onAutoBuildPrompt && (
              <button
                type="button"
                onClick={onAutoBuildPrompt}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm transition flex items-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Autogenerar Prompt desde el Lienzo
              </button>
            )}
          </div>

          {/* Instrucción rápida de uso según la etapa activa */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2 px-1">
            {paletteTab === 'triggers' ? (
              <span>
                ⚡ <strong>Etapa 1 — Disparador:</strong> Elige quién o qué inicia la tarea (<strong>Cron Programado</strong>, <strong>Tenshi IA</strong>, <strong>Antigravity Local/Cloud</strong>, <strong>Correo Entrante</strong>, <strong>Agente IA</strong>, <strong>Reporte QR</strong> o <strong>Webhook API</strong>). Puedes activar varios a la vez.
              </span>
            ) : paletteTab === 'extractors' ? (
              <span>
                📥 <strong>Etapa 2 — Extracción / Lectura Previa:</strong> Antes de que el Agente IA piense, extrae información de <strong>Gmail</strong>, <strong>Google Drive</strong>, <strong>OneDrive</strong>, una <strong>Carpeta en tu Computador (vía Antigravity)</strong>, <strong>Web Scraping con Antigravity (Script)</strong>, <strong>Búsqueda en la Web</strong> o cualquier <strong>Aplicativo de Somos SST</strong>.
              </span>
            ) : paletteTab === 'memories' ? (
              <span>
                💾 <strong>Rombo Memory (◆) — Las 4 Memorias del Agente:</strong> Define qué recuerda el Agente antes de analizar los datos (datos de la <strong>Empresa Activa</strong>, <strong>Bitácora Anti-Duplicados</strong>, <strong>Cuadernos RAG NotebookLM</strong> o <strong>Reglas Normativas SST</strong>).
              </span>
            ) : paletteTab === 'hitos' ? (
              <span>
                🛡️ <strong>Etapa 4 — Todos los 50 Aplicativos de los 8 Hitos de Somos SST:</strong> Elige en qué aplicativo de los <strong>8 Hitos</strong> el Agente debe guardar o modificar registros. Los aplicativos en modo <strong>🚧 En Construcción</strong> aparecen visibles pero bloqueados hasta que se activen.
              </span>
            ) : paletteTab === 'outputs' ? (
              <span>
                📤 <strong>Etapa 5 — Bitácora Final y Notificación:</strong> Al terminar todo el flujo, envía el informe detallado de la bitácora a <strong>Gmail</strong>, como <strong>Notificación Directa en WAPPY + Tenshi</strong> o de regreso a <strong>Google Antigravity (PC o Cloud)</strong>.
              </span>
            ) : paletteTab === 'skills_rules' ? (
              <span>
                🧩 <strong>Skills, Sub-Agentes, Reglas, Búsqueda Web y Web Scraping con Antigravity:</strong> Conecta habilidades procedurales (<code>SKILL.md</code>), sub-agentes especialistas, reglas obligatorias o scripts de <strong>Web Scraping en tu instancia de Google Antigravity</strong>, o pulsa <strong>«+ Crear Mi Propio Nodo»</strong>.
              </span>
            ) : (
              <span>
                💡 <strong>Arrastra cualquier cuadrito al lienzo punteado</strong> (o haz clic sobre él) para conectarlo al flujo. Dentro del lienzo puedes mover los nodos y estirar los cables desde los puertos.
              </span>
            )}
          </div>

          {/* CUADRITOS ARRASTRABLES CON LOGOS SVG ORIGINALES */}
          {paletteTab === 'skills_rules' ? (
            <div className="flex flex-col gap-2.5">
              {/* Barra superior de filtros + Estado de la Instancia de Antigravity + Botón "+ Crear Mi Propio Nodo" */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-1">
                  {[
                    { id: 'all', label: '🌐 Todos' },
                    { id: 'skill', label: '🧩 Skills (SKILL.md)' },
                    { id: 'subagent', label: '🤖 Sub-Agentes' },
                    { id: 'rule', label: '📏 Reglas (Rules)' },
                    { id: 'web_scraper', label: '🕷️ Web Scraping AGY (Script)' },
                    { id: 'web_search', label: '🔍 Búsqueda Web' },
                    { id: 'my_created', label: `⭐ Mis Nodos (${savedUserLibraryNodes.length})` },
                  ].map((fTab) => (
                    <button
                      key={fTab.id}
                      type="button"
                      onClick={() => setSelectedSkillFilter(fTab.id as any)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition border ${
                        selectedSkillFilter === fTab.id
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                      }`}
                    >
                      {fTab.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Indicador en vivo de si la instancia de Google Antigravity del usuario está configurada/conectada */}
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 border ${
                      antigravityStatus.connected
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                    }`}
                    title="El nodo de Web Scraping con Script se ejecuta en tu instancia configurada de Google Antigravity (Local PC o Cloud 24/7)"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        antigravityStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    {antigravityStatus.connected
                      ? `Instancia Antigravity Activa (${antigravityStatus.localConnected ? 'Local PC' : 'Cloud 24/7'})`
                      : 'Web Scraping AGY: Requiere tu instancia Antigravity configurada'}
                  </span>

                  <button
                    type="button"
                    onClick={() => setShowCustomNodeBuilder((v) => !v)}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-[#C7F303] dark:hover:bg-[#b8e002] text-white dark:text-[#0E1300] text-[10.5px] font-extrabold flex items-center gap-1 shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {showCustomNodeBuilder ? 'Cerrar Creador' : '+ Crear Mi Propio Nodo'}
                  </button>
                </div>
              </div>

              {/* Formulario desplegable para que el usuario cree su propio Nodo de Skill, Sub-Agente, Regla, Web Scraping con Script o Búsqueda Web */}
              {showCustomNodeBuilder && (
                <div className="p-3 rounded-2xl border-2 border-purple-400/80 dark:border-[#C7F303]/80 bg-purple-50/40 dark:bg-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-800 dark:text-[#C7F303] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Crear Mi Propio Nodo Reutilizable para el Lienzo WAPPY
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Se guardará en tu catálogo «⭐ Mis Nodos» y se agregará al flujo actual
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        1. Tipo de Nodo a Crear
                      </label>
                      <select
                        value={newCustomNodeForm.nodeType}
                        onChange={(e) =>
                          setNewCustomNodeForm((prev) => ({
                            ...prev,
                            nodeType: e.target.value as any,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white"
                      >
                        <option value="skill">🧩 Skill (Habilidad / SKILL.md)</option>
                        <option value="subagent">🤖 Sub-Agente Especialista</option>
                        <option value="rule">📏 Regla Obligatoria (Rule / Guardrail)</option>
                        <option value="web_scraper">🕷️ Web Scraping con Antigravity (Script)</option>
                        <option value="web_search">🌐 Búsqueda en la Web (Web Search)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        2. Nombre del Nodo *
                      </label>
                      <input
                        type="text"
                        value={newCustomNodeForm.title}
                        onChange={(e) =>
                          setNewCustomNodeForm((prev) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder={
                          newCustomNodeForm.nodeType === 'web_scraper'
                            ? 'Ej: Scraper Circulares MinTrabajo'
                            : newCustomNodeForm.nodeType === 'skill'
                              ? 'Ej: Skill Acta COPASST Pro'
                              : newCustomNodeForm.nodeType === 'subagent'
                                ? 'Ej: Sub-Agente Médico Revisor'
                                : newCustomNodeForm.nodeType === 'rule'
                                  ? 'Ej: Regla Solo Mayores de 50 Años'
                                  : 'Ej: Buscar Jurisprudencia ARL'
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        3. Subtítulo / Etiqueta Corta
                      </label>
                      <input
                        type="text"
                        value={newCustomNodeForm.subtitle}
                        onChange={(e) =>
                          setNewCustomNodeForm((prev) => ({ ...prev, subtitle: e.target.value }))
                        }
                        placeholder="Ej: Script Python / Regla SST / Sub-Agente"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Campos adicionales cuando el usuario crea un nodo de Web Scraping con Antigravity o Búsqueda Web */}
                  {(newCustomNodeForm.nodeType === 'web_scraper' ||
                    newCustomNodeForm.nodeType === 'web_search') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-orange-600 dark:text-orange-400 mb-1">
                          🔗 URL(s) Objetivo o Dominios Web a Consultar / Scrapear
                        </label>
                        <input
                          type="text"
                          value={newCustomNodeForm.targetUrl}
                          onChange={(e) =>
                            setNewCustomNodeForm((prev) => ({ ...prev, targetUrl: e.target.value }))
                          }
                          placeholder="Ej: https://www.mintrabajo.gov.co/... o consulta de búsqueda..."
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                        />
                      </div>

                      {newCustomNodeForm.nodeType === 'web_scraper' && (
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-orange-600 dark:text-orange-400 mb-1">
                            🐍 Motor de Script en tu Instancia de Google Antigravity
                          </label>
                          <select
                            value={newCustomNodeForm.scriptEngine}
                            onChange={(e) =>
                              setNewCustomNodeForm((prev) => ({
                                ...prev,
                                scriptEngine: e.target.value as any,
                              }))
                            }
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white"
                          >
                            <option value="python_bs4">
                              🐍 Python (BeautifulSoup4 + Playwright en Antigravity)
                            </option>
                            <option value="node_cheerio">
                              🟢 Node.js (Cheerio + Puppeteer en Antigravity)
                            </option>
                            <option value="chrome_mcp">
                              🌐 Chrome DevTools MCP (Navegador Real Conectado)
                            </option>
                            <option value="custom_script">
                              💻 Script / Comando Personalizado en Antigravity
                            </option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {newCustomNodeForm.nodeType === 'web_scraper' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300">
                          💻 Script de Web Scraping o Selectores CSS que ejecutará Antigravity
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const urlSample =
                              newCustomNodeForm.targetUrl.trim() || 'https://ejemplo.gov.co';
                            const generated =
                              newCustomNodeForm.scriptEngine === 'python_bs4'
                                ? `import requests\nfrom bs4 import BeautifulSoup\n\nurl = "${urlSample}"\nresp = requests.get(url, timeout=20)\nsoup = BeautifulSoup(resp.text, "html.parser")\nfor row in soup.select("table tr, h1, h2, a[href$='.pdf']"):\n    print(row.get_text(strip=True))`
                                : newCustomNodeForm.scriptEngine === 'node_cheerio'
                                  ? `const axios = require('axios');\nconst cheerio = require('cheerio');\n(async () => {\n  const { data } = await axios.get('${urlSample}');\n  const $ = cheerio.load(data);\n  $('table tr, h1, h2').each((_, el) => console.log($(el).text().trim()));\n})();`
                                  : `Abrir ${urlSample} con Chrome DevTools MCP, extraer todas las tablas, titulares y enlaces PDF y devolverlos en Markdown limpio.`;
                            setNewCustomNodeForm((prev) => ({ ...prev, scriptCode: generated }));
                          }}
                          className="text-[10px] font-extrabold text-purple-600 dark:text-[#C7F303] hover:underline"
                        >
                          ⚡ Autogenerar Script Base de Scraping
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={newCustomNodeForm.scriptCode}
                        onChange={(e) =>
                          setNewCustomNodeForm((prev) => ({ ...prev, scriptCode: e.target.value }))
                        }
                        placeholder="Escribe o autogenera el script Python / Node.js o los selectores CSS que tu instancia de Google Antigravity ejecutará..."
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px] text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      4. Contenido de la Skill (SKILL.md), Prompt del Sub-Agente, Regla o Instrucción de Extracción
                    </label>
                    <textarea
                      rows={2}
                      value={newCustomNodeForm.content}
                      onChange={(e) =>
                        setNewCustomNodeForm((prev) => ({ ...prev, content: e.target.value }))
                      }
                      placeholder="Describe qué hace este nodo cuando se conecta al flujo (ej. pasos de la Skill, rol del Sub-Agente, regla que jamás debe romperse o qué datos extraer del sitio web)..."
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomNodeBuilder(false)}
                      className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateAndSaveCustomNode}
                      disabled={!newCustomNodeForm.title.trim()}
                      className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 disabled:opacity-40 text-white text-[11px] font-extrabold shadow-sm"
                    >
                      ➕ Crear Nodo y Agregar al Lienzo
                    </button>
                  </div>
                </div>
              )}

              {/* Catálogo horizontal de Nodos de Skills, Sub-Agentes, Reglas, Web Scraping AGY y Nodos creados por el usuario */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5">
                {[
                  ...savedUserLibraryNodes.map((uNode) => ({
                    id: uNode.key,
                    shortLabel: uNode.title,
                    label: uNode.title,
                    badge: uNode.subtitle,
                    toolHint: uNode.content,
                    promptHint: uNode.content,
                    customNodePayload: uNode,
                    isUserCreated: true,
                  })),
                  ...SKILL_RULE_SUBAGENT_NODES.map((catNode) => {
                    const inferredType: CanvasCustomUserNode['nodeType'] = catNode.id.startsWith('skill_')
                      ? 'skill'
                      : catNode.id.startsWith('subagent_')
                        ? 'subagent'
                        : catNode.id.startsWith('rule_')
                          ? 'rule'
                          : catNode.id.includes('scraper') || catNode.id.includes('scraping')
                            ? 'web_scraper'
                            : 'web_search';
                    return {
                      ...catNode,
                      customNodePayload: {
                        key: `custom_${catNode.id}`,
                        nodeType: inferredType,
                        title: catNode.shortLabel,
                        subtitle: catNode.badge || 'Nodo Especial',
                        content: catNode.promptHint,
                        ...(inferredType === 'web_scraper'
                          ? { scriptEngine: 'python_bs4' as const }
                          : {}),
                      },
                      isUserCreated: false,
                    };
                  }),
                ]
                  .filter((item) => {
                    if (selectedSkillFilter === 'all') return true;
                    if (selectedSkillFilter === 'my_created') return item.isUserCreated;
                    return item.customNodePayload.nodeType === selectedSkillFilter;
                  })
                  .map((item) => {
                    const isAlreadyOnCanvas = (workflowNodes?.canvasLayout?.customNodes || []).some(
                      (c) => c.key === item.customNodePayload.key,
                    );
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            'application/wappy-flow-node',
                            JSON.stringify({
                              kind: 'custom_node',
                              customNode: item.customNodePayload,
                            }),
                          );
                        }}
                        onClick={() => {
                          if (isAlreadyOnCanvas) {
                            handleRemoveCustomNode(item.customNodePayload.key);
                          } else {
                            handleAddCustomNodeToCanvas(item.customNodePayload);
                          }
                        }}
                        title={`${item.label} — Haz clic o arrastra al lienzo (${item.promptHint})`}
                        className="group/tile cursor-grab active:cursor-grabbing flex flex-col items-center w-[92px] shrink-0 select-none"
                      >
                        <div
                          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-150 shadow-sm ${
                            isAlreadyOnCanvas
                              ? 'bg-white dark:bg-slate-800 border-purple-600 dark:border-[#C7F303] ring-2 ring-purple-500/25 dark:ring-[#C7F303]/25'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-400 group-hover/tile:-translate-y-0.5 group-hover/tile:shadow-md'
                          }`}
                        >
                          {renderOfficialNodeSvg(
                            item.customNodePayload.nodeType === 'web_scraper'
                              ? 'web_scraper'
                              : item.customNodePayload.nodeType === 'skill'
                                ? 'skill'
                                : item.customNodePayload.nodeType === 'subagent'
                                  ? 'subagent'
                                  : item.customNodePayload.nodeType === 'rule'
                                    ? 'rule'
                                    : 'web_search',
                            'w-7 h-7',
                          )}
                          {isAlreadyOnCanvas && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-purple-600 dark:bg-[#C7F303] text-white dark:text-[#0E1300] flex items-center justify-center shadow">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="mt-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight line-clamp-2">
                          {item.shortLabel}
                        </span>
                        <span className="mt-0.5 text-[8.5px] font-extrabold text-purple-600 dark:text-purple-400 truncate max-w-full">
                          {item.badge}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : paletteTab === 'ai_engine' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {AI_ENGINE_MODELS.map((m) => {
                const isSelected =
                  (m.engine === 'antigravity_cloud' && aiEngine === 'antigravity_cloud') ||
                  (m.engine === 'antigravity' && aiEngine === 'antigravity') ||
                  (m.engine === 'wappy' && aiEngine === 'wappy' && aiModel === m.model);
                return (
                  <div
                    key={m.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        'application/wappy-flow-node',
                        JSON.stringify({ kind: 'ai_engine', engine: m.engine, model: m.model }),
                      );
                    }}
                    onClick={() => handleSelectAiEngineModel(m.engine, m.model)}
                    className={`cursor-grab active:cursor-grabbing p-3 rounded-2xl border transition-all flex items-start gap-3 select-none ${
                      isSelected
                        ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/40 shadow-sm'
                        : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                    }`}
                  >
                    {/* Cuadrito / Círculo con Logo Oficial */}
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center shrink-0 relative">
                      {renderOfficialNodeSvg(m.id, 'w-7 h-7')}
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                        {m.shortLabel}
                      </div>
                      <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                        {m.subtitle}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                        {m.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : paletteTab === 'memories' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {MEMORY_NODES.map((mem) => {
                const isSelected = activeMemories.includes(mem.id);
                return (
                  <div
                    key={mem.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        'application/wappy-flow-node',
                        JSON.stringify({ kind: 'node', group: 'memories', nodeId: mem.id }),
                      );
                    }}
                    onClick={() => toggleOrAddCatalogNode('memories', mem.id)}
                    className={`cursor-grab active:cursor-grabbing p-3 rounded-2xl border transition-all flex items-start gap-3 select-none ${
                      isSelected
                        ? 'bg-pink-50/90 dark:bg-pink-950/30 border-pink-500 ring-2 ring-pink-500/30 shadow-sm'
                        : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-pink-400'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border-2 border-pink-300 dark:border-pink-700 shadow-sm flex items-center justify-center shrink-0 relative">
                      {renderOfficialNodeSvg(mem.id, 'w-7 h-7')}
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                        {mem.label}
                      </div>
                      <div className="text-[10px] font-bold text-pink-600 dark:text-pink-400 mt-0.5">
                        {mem.subtitle}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {mem.promptHint}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Barra de filtro por los 8 Hitos de Somos SST (disponible en Extraer Datos, Herramientas y Los 8 Hitos) */}
              {(paletteTab === 'hitos' || paletteTab === 'extractors' || paletteTab === 'connectors') && (
                <div className="flex flex-wrap items-center gap-1 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                  {paletteTab !== 'hitos' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHitoFilter('external');
                        setConstructionNotice(null);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition border ${
                        selectedHitoFilter === 'external'
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                      }`}
                    >
                      🌐 Conectores / Fuentes ({paletteTab === 'extractors' ? EXTRACTOR_NODES.length : INPUT_CONNECTOR_NODES.length})
                    </button>
                  )}
                  {HITOS_8_FILTER_TABS.map((hTab) => {
                    const isActive =
                      selectedHitoFilter === hTab.id ||
                      (paletteTab === 'hitos' && selectedHitoFilter === 'external' && hTab.id === 'all');
                    return (
                      <button
                        key={hTab.id}
                        type="button"
                        onClick={() => {
                          setSelectedHitoFilter(hTab.id);
                          setConstructionNotice(null);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition border ${
                          isActive
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                        }`}
                      >
                        {hTab.shortLabel}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Aviso cuando el usuario hace clic sobre un aplicativo en modo Construcción */}
              {constructionNotice && (
                <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 flex items-center justify-between gap-2 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Hammer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    {constructionNotice}
                  </span>
                  <button
                    type="button"
                    onClick={() => setConstructionNotice(null)}
                    className="text-amber-700 dark:text-amber-300 hover:underline text-[10px] font-extrabold shrink-0"
                  >
                    Cerrar
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5">
                {(paletteTab === 'extractors'
                  ? selectedHitoFilter === 'external'
                    ? EXTRACTOR_NODES
                    : selectedHitoFilter === 'all'
                      ? [...EXTRACTOR_NODES, ...HITO_APP_NODES]
                      : HITO_APP_NODES.filter((h) => h.hitoId === selectedHitoFilter)
                  : paletteTab === 'connectors'
                    ? selectedHitoFilter === 'external'
                      ? INPUT_CONNECTOR_NODES
                      : selectedHitoFilter === 'all'
                        ? [...INPUT_CONNECTOR_NODES, ...HITO_APP_NODES]
                        : HITO_APP_NODES.filter((h) => h.hitoId === selectedHitoFilter)
                    : paletteTab === 'hitos'
                      ? selectedHitoFilter === 'all' || selectedHitoFilter === 'external'
                        ? HITO_APP_NODES
                        : HITO_APP_NODES.filter((h) => h.hitoId === selectedHitoFilter)
                      : paletteTab === 'triggers'
                        ? TRIGGER_NODES
                        : OUTPUT_ACTION_NODES
                ).map((node) => {
                  const groupKey =
                    paletteTab === 'extractors'
                      ? 'extractors'
                      : paletteTab === 'connectors'
                        ? 'inputs'
                        : paletteTab === 'hitos'
                          ? 'hitos'
                          : paletteTab === 'triggers'
                            ? 'trigger'
                            : 'outputs';
                  const isUnderConstruction = isWorkflowNodeUnderConstruction(node, disabledSgsstApps);
                  const isSelected =
                    !isUnderConstruction &&
                    (groupKey === 'trigger'
                      ? activeTriggers.includes(node.id)
                      : groupKey === 'extractors'
                        ? activeExtractors.includes(node.id)
                        : (workflowNodes[groupKey] || []).includes(node.id));

                  return (
                    <div
                      key={`${groupKey}_${node.id}`}
                      draggable={!isUnderConstruction}
                      onDragStart={(e) => {
                        if (isUnderConstruction) {
                          e.preventDefault();
                          return;
                        }
                        e.dataTransfer.setData(
                          'application/wappy-flow-node',
                          JSON.stringify({ kind: 'node', group: groupKey, nodeId: node.id }),
                        );
                      }}
                      onClick={() => toggleOrAddCatalogNode(groupKey, node.id)}
                      title={
                        isUnderConstruction
                          ? `🚧 ${node.label} — Aplicativo en Construcción en Somos SST (No seleccionable)`
                          : `${node.label} — Arrastra al lienzo o haz clic para ${isSelected ? 'quitar' : 'conectar'}`
                      }
                      className={`group/tile flex flex-col items-center w-[84px] shrink-0 select-none ${
                        isUnderConstruction
                          ? 'cursor-not-allowed opacity-65'
                          : 'cursor-grab active:cursor-grabbing'
                      }`}
                    >
                      {/* Cuadrito con Logo SVG Original */}
                      <div
                        className={`relative w-14 h-14 flex items-center justify-center border-2 transition-all duration-150 shadow-sm ${
                          groupKey === 'trigger'
                            ? 'rounded-l-[22px] rounded-r-[10px]'
                            : 'rounded-2xl'
                        } ${
                          isUnderConstruction
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-dashed border-amber-400/90 dark:border-amber-600/80'
                            : isSelected
                              ? 'bg-white dark:bg-slate-800 border-purple-600 dark:border-[#C7F303] ring-2 ring-purple-500/25 dark:ring-[#C7F303]/25 group-hover/tile:-translate-y-0.5 group-hover/tile:shadow-md'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-400 group-hover/tile:-translate-y-0.5 group-hover/tile:shadow-md'
                        }`}
                      >
                        {renderOfficialNodeSvg(node.id, 'w-7 h-7')}

                        {/* Insignia de En Construcción (Candado) o de Conectado (Check) */}
                        {isUnderConstruction ? (
                          <span
                            className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow"
                            title="Aplicativo en Construcción (No seleccionable)"
                          >
                            <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                          </span>
                        ) : (
                          isSelected && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-purple-600 dark:bg-[#C7F303] text-white dark:text-[#0E1300] flex items-center justify-center shadow">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )
                        )}
                      </div>
                      <span className="mt-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight line-clamp-2">
                        {node.shortLabel}
                      </span>
                      {isUnderConstruction && (
                        <span className="mt-0.5 px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[8px] font-extrabold uppercase tracking-tight">
                          🚧 En Constr.
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── LIENZO VISUAL INTERACTIVO WAPPY (FONDO PUNTEADO + MANITA + SELECCIÓN + NODOS + CABLES SVG) ─── */}
      <div
        ref={scrollContainerRef}
        onPointerDown={handleBackgroundPointerDown}
        className={`relative w-full overflow-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-[#f8fafc] dark:bg-[#0b1120] shadow-inner select-none ${
          compact ? 'h-[265px]' : 'h-[430px]'
        } ${
          isPanning
            ? 'cursor-grabbing'
            : canvasTool === 'select'
              ? 'cursor-crosshair'
              : 'cursor-grab'
        }`}
        style={{
          backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.42) 1.35px, transparent 1.35px)',
          backgroundSize: '18px 18px',
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleCanvasDrop}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={() => handleCanvasPointerUp()}
      >
        {/* Controles flotantes del lienzo (Manita, Seleccionar Parte, Seleccionar Todo, Zoom, Otra IA, Nodo If, Conectar a mi Gusto) */}
        {!compact && (
          <div
            data-canvas-toolbar="true"
            onPointerDown={(e) => e.stopPropagation()}
            className="sticky left-3 top-3 z-30 inline-flex flex-wrap items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm m-2.5 cursor-default"
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Lienzo WAPPY
            </span>

            {/* ─── 1. MANITA (DESPLAZARSE POR EL LIENZO) & SELECCIÓN DE FLUJO ─── */}
            <button
              type="button"
              onClick={() => setCanvasTool('pan')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1 border ${
                canvasTool === 'pan'
                  ? 'bg-slate-900 text-white dark:bg-[#C7F303] dark:text-[#0E1300] border-transparent shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title="Manita: Arrastra sobre el fondo punteado para desplazarte por toda el área de trabajo"
            >
              <Hand className="w-3 h-3" />
              Manita
            </button>

            {!readOnly && onChange && (
              <>
                <button
                  type="button"
                  onClick={() => setCanvasTool(canvasTool === 'select' ? 'pan' : 'select')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1 border ${
                    canvasTool === 'select'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                  title="Seleccionar una Parte: Dibuja un recuadro sobre varios nodos (o haz Shift + Clic) para mover esa parte junta"
                >
                  <MousePointer2 className="w-3 h-3" />
                  Seleccionar Parte
                </button>

                <button
                  type="button"
                  onClick={handleSelectAllNodes}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1 border ${
                    selectedNodeKeys.length === visualNodes.length && visualNodes.length > 0
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                  }`}
                  title="Seleccionar Todo el Flujo para arrastrarlo completo a un lado o a cualquier lugar del campo"
                >
                  <Move className="w-3 h-3" />
                  {selectedNodeKeys.length === visualNodes.length && visualNodes.length > 0
                    ? `Todo Seleccionado (${selectedNodeKeys.length})`
                    : 'Seleccionar Todo'}
                </button>

                {selectedNodeKeys.length > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-[#C7F303] text-[9.5px] font-extrabold flex items-center gap-1 border border-purple-300 dark:border-purple-700">
                    <span>
                      ✥ {selectedNodeKeys.length} marcados (arrastra uno para moverlos juntos)
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedNodeKeys([])}
                      className="ml-0.5 hover:text-rose-600"
                      title="Deseleccionar nodos"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </>
            )}

            <div className="h-3.5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5" />

            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.65, Number((z - 0.1).toFixed(2))))}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Alejar"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 min-w-[34px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.15, Number((z + 0.1).toFixed(2))))}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Acercar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {!readOnly && onChange && (
              <>
                <div className="h-3.5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5" />
                <button
                  type="button"
                  onClick={handleAddExtraAgent}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 transition flex items-center gap-1"
                  title="Agregar un segundo o tercer Agente IA (con su propio Segundo Prompt y Modelo IA) al lienzo"
                >
                  <Plus className="w-3 h-3" />
                  Otra IA / Agente
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...workflowNodes,
                      includeIfNode: !includeIfNode,
                    })
                  }
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                    includeIfNode
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                  title="Activar/Desactivar nodo de Condición Si/No (evalúa si hay hallazgos o alertas para dividir el flujo en rama SÍ o NO)"
                >
                  <GitFork className="w-3 h-3" />
                  Condición Si/No
                </button>
                <button
                  type="button"
                  onClick={() => handleAddLogicNode('loop')}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 transition flex items-center gap-1"
                  title="Agregar nodo Iterar (Loop) para recorrer trabajador por trabajador o archivo por archivo"
                >
                  <Repeat className="w-3 h-3" />
                  + Iterar
                </button>
                <button
                  type="button"
                  onClick={() => handleAddLogicNode('merge')}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800 transition flex items-center gap-1"
                  title="Agregar nodo Unir Ramas (Merge) para juntar la salida de dos agentes o dos ramas"
                >
                  <GitMerge className="w-3 h-3" />
                  + Unir
                </button>
                <button
                  type="button"
                  onClick={() => handleAddLogicNode('human_approval')}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 transition flex items-center gap-1"
                  title="Agregar nodo de Aprobación Humana (Visto Bueno antes de enviar correo o modificar Hito)"
                >
                  <UserCheck className="w-3 h-3" />
                  + Aprobación
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaletteTab('skills_rules');
                    setShowCustomNodeBuilder(true);
                  }}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-[#C7F303] border border-violet-300 dark:border-violet-700 transition flex items-center gap-1"
                  title="Crear tu propio nodo de Skill (SKILL.md), Sub-Agente, Regla, Búsqueda Web o Script de Web Scraping con Antigravity"
                >
                  <Puzzle className="w-3 h-3" />
                  + Crear Mi Nodo / Scraper
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectAllMainWires}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition flex items-center gap-1"
                  title="Cortar los cables automáticos para interconectar los módulos 100% a tu gusto arrastrando desde los puertos (●)"
                >
                  <X className="w-3 h-3" />
                  Conectar a mi Gusto
                </button>
                <button
                  type="button"
                  onClick={handleResetLayout}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1"
                  title="Restablecer posiciones y conexiones por defecto"
                >
                  <RotateCcw className="w-3 h-3" />
                  Auto-Organizar
                </button>
              </>
            )}
          </div>
        )}

        {/* Contenedor escalable del lienzo */}
        <div
          ref={canvasRef}
          className="relative origin-top-left"
          style={{
            width: `${canvasMinWidth}px`,
            height: `${canvasMinHeight}px`,
            transform: `scale(${zoom})`,
          }}
        >
          {/* Recuadro visual de selección parcial (Seleccionar Parte) */}
          {marqueeBox && (
            <div
              style={{
                left: Math.min(marqueeBox.startX, marqueeBox.currX),
                top: Math.min(marqueeBox.startY, marqueeBox.currY),
                width: Math.abs(marqueeBox.currX - marqueeBox.startX),
                height: Math.abs(marqueeBox.currY - marqueeBox.startY),
              }}
              className="absolute z-40 rounded-xl border-2 border-dashed border-purple-500 bg-purple-500/10 pointer-events-none"
            />
          )}
          {/* ─── CAPA SVG DE CABLES CURVOS Y FLECHAS (CON BOTÓN × PARA CORTAR CUALQUIER CABLE) ─── */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <marker
                id="wappy-arrow"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="5.5"
                markerHeight="5.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
              </marker>
              <marker
                id="wappy-arrow-true"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="5.5"
                markerHeight="5.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
              </marker>
            </defs>

            {wires.map((w) => (
              <g key={w.id} className="group/wire">
                <path
                  d={w.d}
                  fill="none"
                  stroke={w.color}
                  strokeWidth={w.dashed ? 2 : 2.2}
                  strokeDasharray={w.dashed ? '5 4' : undefined}
                  markerEnd={
                    w.dashed
                      ? undefined
                      : w.color === '#10b981'
                        ? 'url(#wappy-arrow-true)'
                        : 'url(#wappy-arrow)'
                  }
                />
                {!readOnly && (
                  <>
                    <path
                      d={w.d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="14"
                      className="pointer-events-auto cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveWire(w.id);
                      }}
                    >
                      <title>Haz clic para desconectar este cable y reconectar a tu gusto</title>
                    </path>
                    <g
                      transform={`translate(${w.midX}, ${w.midY})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveWire(w.id);
                      }}
                      className="pointer-events-auto cursor-pointer opacity-0 group-hover/wire:opacity-100 transition-opacity"
                    >
                      <circle r="7.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                      <path
                        d="M -2.5 -2.5 L 2.5 2.5 M 2.5 -2.5 L -2.5 2.5"
                        stroke="#ffffff"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </g>
                  </>
                )}
                {w.label && w.labelX !== undefined && w.labelY !== undefined && (
                  <text
                    x={w.labelX}
                    y={w.labelY}
                    fill={w.label === 'sí' ? '#059669' : '#64748b'}
                    fontSize="10"
                    fontWeight="700"
                  >
                    {w.label}
                  </text>
                )}
              </g>
            ))}

            {/* Cable interactivo en vivo mientras el usuario arrastra desde un puerto */}
            {wiringFrom && (
              <path
                d={`M ${wiringFrom.startX} ${wiringFrom.startY} C ${wiringFrom.startX + 45} ${wiringFrom.startY}, ${wiringFrom.currX - 45} ${wiringFrom.currY}, ${wiringFrom.currX} ${wiringFrom.currY}`}
                fill="none"
                stroke="#a855f7"
                strokeWidth="2.5"
                strokeDasharray="4 3"
              />
            )}
          </svg>

          {/* ─── CAPA DE NODOS DE LAS 5 ETAPAS DEL FLUJO WAPPY ─── */}
          {visualNodes.map((node) => {
            const isNodeSelected =
              selectedNodeKeys.includes(node.key) || activeConfigNodeKey === node.key;
            const nodeCfg = workflowNodes?.canvasLayout?.nodeConfigs?.[node.key];
            const hasCustomConfig = Boolean(
              (nodeCfg?.fields && nodeCfg.fields.length > 0) ||
                nodeCfg?.inputContext?.trim() ||
                nodeCfg?.outputContext?.trim() ||
                nodeCfg?.customInstruction?.trim() ||
                nodeCfg?.prompt?.trim(),
            );
            const selectedRingClass = isNodeSelected
              ? 'ring-3 ring-purple-500 dark:ring-[#C7F303] ring-offset-2 dark:ring-offset-slate-900'
              : hasCustomConfig
                ? 'ring-2 ring-teal-500/60'
                : '';

            // 1. ETAPA 1: FIGURA TRIGGER NODE (Forma en "D" con rayo ⚡ a la izquierda y puerto circular derecho)
            if (node.shape === 'trigger') {
              return (
                <div
                  key={node.key}
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  title="Haz clic sobre este nodo para editar su configuración"
                  className={`absolute z-20 group/node select-none ${
                    readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  {/* Rayo naranja de Trigger a la izquierda */}
                  <div className="absolute -left-5 top-1/2 -translate-y-1/2 text-orange-500 drop-shadow-sm">
                    <Zap className="w-4 h-4 fill-orange-500" />
                  </div>

                  {/* Caja en forma de D (redondeada a la izquierda, recta a la derecha) */}
                  <div className={`w-full h-full rounded-l-[28px] rounded-r-[12px] bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 group-hover/node:border-orange-500 shadow-md flex items-center justify-center relative transition-colors ${selectedRingClass}`}>
                    {renderOfficialNodeSvg(node.nodeId, 'w-8 h-8')}

                    {!readOnly && node.removable && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOrAddCatalogNode('trigger', node.nodeId);
                        }}
                        className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                        title="Quitar disparador"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  {/* Puerto circular de salida derecho (●) */}
                  <div
                    onPointerDown={(e) =>
                      handlePortPointerDown(
                        e,
                        node.key,
                        'main_out',
                        node.x + node.width,
                        node.y + node.height / 2,
                      )
                    }
                    title="Arrastra desde este puerto para conectar"
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-slate-400 hover:bg-purple-600 border-2 border-white dark:border-slate-900 cursor-crosshair transition-transform hover:scale-125"
                  />

                  {/* Etiqueta inferior */}
                  <div className="mt-1.5 w-[120px] -ml-[22px] text-center pointer-events-none">
                    <div className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                      {node.title}
                    </div>
                    <div className="text-[9.5px] font-medium text-slate-400">{node.subtitle}</div>
                  </div>
                </div>
              );
            }

            // 1B. ETAPA 2: FIGURA NODO DE EXTRACCIÓN / LECTURA PREVIA (Haz clic para elegir campos: ej. Nombre, Cédula y Edad)
            if (node.shape === 'square_extractor') {
              return (
                <div
                  key={node.key}
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  title="Haz clic sobre este nodo para configurar qué campos extraer (ej. Nombre, Cédula y Edad) y su contexto"
                  className={`absolute z-20 group/node select-none ${
                    readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-sky-600 text-white text-[7.5px] font-black uppercase tracking-wider shadow-xs z-10 whitespace-nowrap">
                    Extraer
                  </span>

                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-sky-500 border-2 border-white dark:border-slate-900" />

                  <div className={`w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-sky-400 dark:border-sky-600 group-hover/node:border-sky-500 shadow-md flex items-center justify-center relative transition-colors ${selectedRingClass}`}>
                    {renderOfficialNodeSvg(node.nodeId, 'w-8 h-8')}

                    {!readOnly && node.removable && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOrAddCatalogNode('extractors', node.nodeId);
                        }}
                        className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                        title="Quitar nodo de extracción"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  <div
                    onPointerDown={(e) =>
                      handlePortPointerDown(
                        e,
                        node.key,
                        'main_out',
                        node.x + node.width,
                        node.y + node.height / 2,
                      )
                    }
                    title="Arrastra desde este puerto para conectar a cualquier módulo o Agente IA"
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-sky-500 hover:bg-purple-600 border-2 border-white dark:border-slate-900 cursor-crosshair transition-transform hover:scale-125"
                  />

                  <div className="mt-1.5 w-[116px] -ml-[23px] text-center pointer-events-none">
                    <div className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate">
                      {node.title}
                    </div>
                    <div className="text-[9px] text-sky-600 dark:text-sky-400 font-semibold truncate">
                      {nodeCfg?.fields && nodeCfg.fields.length > 0
                        ? `${nodeCfg.fields.length} campos elegidos`
                        : node.subtitle}
                    </div>
                  </div>
                </div>
              );
            }

            // 2. ETAPA 3: FIGURA AGENTE IA (Principal o Agente IA #2/#3 con Segundo Prompt y opción de Tenshi Avatar 3D)
            if (node.shape === 'agent') {
              const isExtraAgent = node.key.startsWith('agent_extra_');
              const extraConfig = isExtraAgent
                ? (workflowNodes?.canvasLayout?.extraAgents || []).find((ea) => ea.key === node.key)
                : null;
              const currentSelectedAgentId = isExtraAgent
                ? extraConfig?.agentId || ''
                : agentId || '';
              const isTenshiAvatarSelected =
                currentSelectedAgentId === 'tenshi_avatar_orchestrator';

              return (
                <div
                  key={node.key}
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  title="Haz clic sobre este Agente IA para editar su Prompt, Modelo de IA y Contexto de Entrada/Salida"
                  className={`absolute z-20 group/node select-none ${
                    readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  {/* Puerto izquierdo de entrada (●) */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-lg bg-slate-400 border-2 border-white dark:border-slate-900" />

                  {/* Cuerpo rectangular del Agente IA */}
                  <div className={`w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 group-hover/node:border-purple-500 shadow-md px-3 pb-2.5 pt-1.5 flex items-center gap-2.5 relative transition-colors ${selectedRingClass}`}>
                    {!readOnly && isExtraAgent && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveExtraAgent(node.key);
                        }}
                        className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                        title="Quitar este Agente IA adicional"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}

                    {/* Icono del Agente: Avatar 3D de Tenshi si se elige Tenshi Avatar, o icono de Agente Especialista */}
                    <div className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-purple-950/80 text-white dark:text-[#C7F303] flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                      {isTenshiAvatarSelected ? (
                        <img
                          src="/assets/tenshi-avatar.png"
                          alt="Tenshi Avatar"
                          className="w-10 h-10 object-contain drop-shadow-sm"
                        />
                      ) : (
                        <Bot className="w-6 h-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11.5px] font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                          {node.title}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 whitespace-nowrap">
                          {isExtraAgent ? '2do Prompt' : 'Principal'}
                        </span>
                      </div>

                      {/* Selector directo de Agente Especialista (según permisos del usuario) + Tenshi Avatar */}
                      {!readOnly && availableAgentsWithTenshiAvatar.length > 0 && (onSelectAgent || isExtraAgent) ? (
                        <select
                          value={currentSelectedAgentId}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            if (isExtraAgent) {
                              handleUpdateExtraAgent(node.key, e.target.value);
                            } else if (onSelectAgent) {
                              onSelectAgent(e.target.value);
                            }
                          }}
                          className="mt-1 w-full text-[10.5px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50/70 dark:bg-slate-900 border border-purple-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 focus:outline-none cursor-pointer truncate"
                        >
                          {availableAgentsWithTenshiAvatar.map((ag) => (
                            <option key={ag.id} value={ag.id}>
                              {ag.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-[10.5px] font-bold text-purple-600 dark:text-purple-400 truncate mt-0.5">
                          {node.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Puerto circular de salida derecho (●) */}
                  <div
                    onPointerDown={(e) =>
                      handlePortPointerDown(
                        e,
                        node.key,
                        'main_out',
                        node.x + node.width,
                        node.y + node.height / 2,
                      )
                    }
                    title="Arrastra para conectar la salida de este Agente IA hacia otro módulo, correo, acta u otro Agente IA"
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-slate-400 hover:bg-purple-600 border-2 border-white dark:border-slate-900 cursor-crosshair transition-transform hover:scale-125"
                  />

                  {/* ─── LOS 3 PUERTOS EN ROMBO (◆) INFERIORES EN ESPAÑOL ─── */}
                  {/* Rombo 1: Modelo IA * */}
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!readOnly) {
                        setPaletteTab('ai_engine');
                        setActiveConfigNodeKey(isExtraAgent ? node.key : 'sub_model');
                      }
                    }}
                    style={{ left: 32 }}
                    className="absolute -bottom-2.5 flex flex-col items-center cursor-pointer group/modport"
                    title="Configurar Modelo de IA de este Agente (WAPPY Cloud / Antigravity Local / Antigravity Cloud 24/7)"
                  >
                    <div className="w-3 h-3 rotate-45 bg-indigo-500 group-hover/modport:scale-125 border-2 border-white dark:border-slate-900 shadow-sm transition-transform" />
                    <span className="mt-0.5 text-[8.5px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      Modelo IA <span className="text-rose-500">*</span>
                    </span>
                  </div>

                  {/* Rombo 2: Memoria [+] */}
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!readOnly) {
                        setPaletteTab('memories');
                        setActiveConfigNodeKey('sub_memory');
                      }
                    }}
                    style={{ left: 102 }}
                    className="absolute -bottom-2.5 flex flex-col items-center cursor-pointer group/memport"
                    title="Configurar las 4 Memorias del Agente (Empresa Activa, Bitácora Anti-Duplicados, RAG NotebookLM, Reglas Normativas SST)"
                  >
                    <div className="w-3 h-3 rotate-45 bg-pink-500 group-hover/memport:bg-pink-600 border-2 border-white dark:border-slate-900 shadow-sm" />
                    <span className="mt-0.5 text-[8.5px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap flex items-center gap-0.5">
                      Memoria
                      {!readOnly && (
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-[9px] font-black text-pink-600">
                          +
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Rombo 3: Herramienta [+] */}
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!readOnly) {
                        setPaletteTab('connectors');
                        setActiveConfigNodeKey(node.key);
                      }
                    }}
                    style={{ left: 168 }}
                    className="absolute -bottom-2.5 flex flex-col items-center cursor-pointer group/toolport"
                    title="Conectar Herramientas al Agente IA"
                  >
                    <div className="w-3 h-3 rotate-45 bg-indigo-500 group-hover/toolport:bg-purple-600 border-2 border-white dark:border-slate-900 shadow-sm" />
                    <span className="mt-0.5 text-[8.5px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap flex items-center gap-0.5">
                      Herramienta
                      {!readOnly && (
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-[9px] font-black text-purple-600">
                          +
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            }

            // 3. FIGURA CONDICIÓN SI/NO (Cuadrado con icono de bifurcación verde y 2 salidas sí/no)
            if (node.shape === 'if') {
              return (
                <div
                  key={node.key}
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  title="Haz clic para configurar qué evalúa la Condición Si/No"
                  className={`absolute z-20 group/node select-none ${
                    readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900" />

                  <div className={`w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 group-hover/node:border-emerald-500 shadow-md flex items-center justify-center transition-colors ${selectedRingClass}`}>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <GitFork className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Puerto de salida superior: SÍ */}
                  <div
                    onPointerDown={(e) =>
                      handlePortPointerDown(e, node.key, 'if_true', node.x + node.width, node.y + 24)
                    }
                    style={{ top: 20 }}
                    className="absolute -right-2 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 cursor-crosshair"
                    title="Rama SÍ (Si se cumple la condición / hay hallazgos)"
                  />

                  {/* Puerto de salida inferior: NO */}
                  <div
                    onPointerDown={(e) =>
                      handlePortPointerDown(e, node.key, 'if_false', node.x + node.width, node.y + 52)
                    }
                    style={{ top: 48 }}
                    className="absolute -right-2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900 cursor-crosshair"
                    title="Rama NO (Si no hay hallazgos / caso contrario)"
                  />

                  <div className="mt-1.5 w-[112px] -ml-[20px] text-center pointer-events-none">
                    <div className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                      {node.title}
                    </div>
                    <div className="text-[9px] text-slate-400">{node.subtitle}</div>
                  </div>
                </div>
              );
            }

            // 3A-BIS. NODOS LÓGICOS ADICIONALES (Iterar Loop, Unir Ramas Merge, Aprobación Humana)
            if (node.shape === 'logic') {
              const isLoop = node.nodeId.includes('loop');
              const isMerge = node.nodeId.includes('merge');
              return (
                <div
                  key={node.key}
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  title="Haz clic para configurar este nodo de control de flujo"
                  className={`absolute z-20 group/node select-none ${
                    readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[7.5px] font-black uppercase tracking-wider shadow-xs z-10 whitespace-nowrap">
                    Control
                  </span>

                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900" />

                  <div className={`w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-amber-400 dark:border-amber-600 group-hover/node:border-amber-500 shadow-md flex items-center justify-center relative transition-colors ${selectedRingClass}`}>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      {isLoop ? (
                        <Repeat className="w-6 h-6" />
                      ) : isMerge ? (
                        <GitMerge className="w-6 h-6" />
                      ) : (
                        <UserCheck className="w-6 h-6" />
                      )}
                    </div>

                    {!readOnly && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLogicNode(node.key);
                        }}
                        className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                        title="Quitar nodo de control"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  <div
                    onPointerDown={(e) =>
                      handlePortPointerDown(
                        e,
                        node.key,
                        'main_out',
                        node.x + node.width,
                        node.y + node.height / 2,
                      )
                    }
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-amber-500 hover:bg-purple-600 border-2 border-white dark:border-slate-900 cursor-crosshair transition-transform hover:scale-125"
                    title="Arrastra desde este puerto para conectar al siguiente paso"
                  />

                  <div className="mt-1.5 w-[112px] -ml-[20px] text-center pointer-events-none">
                    <div className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate">
                      {node.title}
                    </div>
                    <div className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold truncate">
                      {node.subtitle}
                    </div>
                  </div>
                </div>
              );
            }

            // 3B. ETAPA 4: FIGURA NODO DE ACCIÓN EN HITO / APLICATIVO SOMOS SST (Conectable en cualquier orden)
            if (node.shape === 'square_hito') {
              return (
                <div
                  key={node.key}
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  title="Haz clic sobre este nodo para configurar qué campos o acciones realizar en el Hito/Aplicativo"
                  className={`absolute z-20 group/node select-none ${
                    readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-teal-600 text-white text-[7.5px] font-black uppercase tracking-wider shadow-xs z-10 whitespace-nowrap">
                    Hito / App
                  </span>

                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900" />

                  <div className={`w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-teal-400 dark:border-teal-600 group-hover/node:border-teal-500 shadow-md flex items-center justify-center relative transition-colors ${selectedRingClass}`}>
                    {renderOfficialNodeSvg(node.nodeId, 'w-8 h-8')}

                    {!readOnly && node.removable && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOrAddCatalogNode('hitos', node.nodeId);
                        }}
                        className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                        title="Quitar acción en Hito / App"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  <div
                    onPointerDown={(e) =>
                      handlePortPointerDown(
                        e,
                        node.key,
                        'main_out',
                        node.x + node.width,
                        node.y + node.height / 2,
                      )
                    }
                    title="Arrastra desde este puerto para conectar a un correo, otra IA revisora o cualquier módulo"
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-teal-500 hover:bg-purple-600 border-2 border-white dark:border-slate-900 cursor-crosshair transition-transform hover:scale-125"
                  />

                  <div className="mt-1.5 w-[116px] -ml-[23px] text-center pointer-events-none">
                    <div className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate">
                      {node.title}
                    </div>
                    <div className="text-[9px] text-teal-600 dark:text-teal-400 font-semibold truncate">
                      {nodeCfg?.fields && nodeCfg.fields.length > 0
                        ? `${nodeCfg.fields.length} acciones`
                        : node.subtitle}
                    </div>
                  </div>
                </div>
              );
            }

            // 4. ETAPA 5: FIGURA NODOS CUADRADOS DE BITÁCORA Y SALIDA (Con puerto de salida ● y botón [+])
            if (node.shape === 'square_output') {
              return (
                <div
                  key={node.key}
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  title="Haz clic sobre este nodo para configurar el formato de salida de la bitácora"
                  className={`absolute z-20 group/node select-none ${
                    readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[7.5px] font-black uppercase tracking-wider shadow-xs z-10 whitespace-nowrap">
                    Bitácora
                  </span>

                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900" />

                  <div className={`w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 group-hover/node:border-purple-500 shadow-md flex items-center justify-center relative transition-colors ${selectedRingClass}`}>
                    {renderOfficialNodeSvg(node.nodeId, 'w-8 h-8')}

                    {!readOnly && node.removable && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOrAddCatalogNode('outputs', node.nodeId);
                        }}
                        className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                        title="Quitar nodo de salida"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex items-center">
                    <div
                      onPointerDown={(e) =>
                        handlePortPointerDown(
                          e,
                          node.key,
                          'main_out',
                          node.x + node.width,
                          node.y + node.height / 2,
                        )
                      }
                      title="Arrastra desde este puerto para continuar el flujo hacia otra IA o módulo"
                      className="w-3.5 h-3.5 rounded-full bg-purple-500 hover:bg-purple-600 border-2 border-white dark:border-slate-900 cursor-crosshair transition-transform hover:scale-125"
                    />
                    <div className="w-2.5 h-[1.5px] bg-slate-300 dark:bg-slate-600" />
                    {!readOnly && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setPaletteTab('outputs')}
                        className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 hover:text-purple-600 hover:border-purple-400 flex items-center justify-center text-[10px] font-bold shadow-xs"
                        title="Añadir otro destino o acción en el flujo"
                      >
                        +
                      </button>
                    )}
                  </div>

                  <div className="mt-1.5 w-[116px] -ml-[21px] text-center pointer-events-none">
                    <div className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate">
                      {node.title}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">{node.subtitle}</div>
                  </div>
                </div>
              );
            }

            // 4-BIS. FIGURA NODOS PERSONALIZADOS DE SKILLS, SUB-AGENTES, REGLAS, WEB SCRAPING (ANTIGRAVITY SCRIPT) Y BÚSQUEDA WEB
            if (node.shape === 'custom_node') {
              const badgeText =
                node.customNodeType === 'skill'
                  ? '🧩 Skill'
                  : node.customNodeType === 'subagent'
                    ? '🤖 Sub-Agente'
                    : node.customNodeType === 'rule'
                      ? '📏 Regla'
                      : node.customNodeType === 'web_scraper'
                        ? '🕷️ Scraper AGY'
                        : '🌐 Búsqueda Web';
              const badgeColor =
                node.customNodeType === 'skill'
                  ? 'bg-violet-600'
                  : node.customNodeType === 'subagent'
                    ? 'bg-indigo-600'
                    : node.customNodeType === 'rule'
                      ? 'bg-emerald-600'
                      : node.customNodeType === 'web_scraper'
                        ? 'bg-orange-600'
                        : 'bg-sky-600';
              const borderColor =
                node.customNodeType === 'skill'
                  ? 'border-violet-400 dark:border-violet-600 group-hover/node:border-violet-500'
                  : node.customNodeType === 'subagent'
                    ? 'border-indigo-400 dark:border-indigo-600 group-hover/node:border-indigo-500'
                    : node.customNodeType === 'rule'
                      ? 'border-emerald-400 dark:border-emerald-600 group-hover/node:border-emerald-500'
                      : node.customNodeType === 'web_scraper'
                        ? 'border-orange-400 dark:border-orange-600 group-hover/node:border-orange-500'
                        : 'border-sky-400 dark:border-sky-600 group-hover/node:border-sky-500';
              const iconId =
                node.customNodeType === 'web_scraper'
                  ? 'web_scraper'
                  : node.customNodeType === 'skill'
                    ? 'skill'
                    : node.customNodeType === 'subagent'
                      ? 'subagent'
                      : node.customNodeType === 'rule'
                        ? 'rule'
                        : 'web_search';

              return (
                <div
                  key={node.key}
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  title="Haz clic sobre este nodo para configurar su Skill, Prompt de Sub-Agente, Regla o Script de Web Scraping en Antigravity"
                  className={`absolute z-20 group/node select-none ${
                    readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  <span
                    className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full ${badgeColor} text-white text-[7.5px] font-black uppercase tracking-wider shadow-xs z-10 whitespace-nowrap`}
                  >
                    {badgeText}
                  </span>

                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-purple-500 border-2 border-white dark:border-slate-900" />

                  <div
                    className={`w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 ${borderColor} shadow-md flex items-center justify-center relative transition-colors ${selectedRingClass}`}
                  >
                    {renderOfficialNodeSvg(iconId, 'w-8 h-8')}

                    {!readOnly && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCustomNode(node.key);
                        }}
                        className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                        title="Quitar este nodo del lienzo"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  <div
                    onPointerDown={(e) =>
                      handlePortPointerDown(
                        e,
                        node.key,
                        'main_out',
                        node.x + node.width,
                        node.y + node.height / 2,
                      )
                    }
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-purple-500 hover:bg-purple-600 border-2 border-white dark:border-slate-900 cursor-crosshair transition-transform hover:scale-125"
                    title="Arrastra desde este puerto para conectarlo con el Agente IA o cualquier otro módulo del flujo"
                  />

                  <div className="mt-1.5 w-[118px] -ml-[22px] text-center pointer-events-none">
                    <div className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate">
                      {node.title}
                    </div>
                    <div className="text-[9px] text-purple-600 dark:text-purple-400 font-semibold truncate">
                      {node.subtitle}
                    </div>
                  </div>
                </div>
              );
            }

            // 5. FIGURA SUB-NODOS CIRCULARES (Modelo IA *, Memoria y Herramienta con Rombo superior ◆)
            const isModelCircle = node.shape === 'circle_model';
            const isMemoryCircle = node.shape === 'circle_memory';

            return (
              <div
                key={node.key}
                onPointerDown={(e) => handleNodePointerDown(e, node)}
                onPointerUp={(e) => handleCanvasPointerUp(node.key, e)}
                style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                title="Haz clic sobre este sub-nodo para configurar sus parámetros, campos y contexto"
                className={`absolute z-20 group/node select-none ${
                  readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                }`}
              >
                {/* Puerto superior en forma de Rombo (◆) que conecta exclusivamente al Agente IA */}
                <div
                  className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-2 border-white dark:border-slate-900 shadow-xs ${
                    isMemoryCircle ? 'bg-pink-500' : 'bg-indigo-500'
                  }`}
                />

                {/* Círculo perfecto de Sub-Nodo */}
                <div
                  onClick={() => {
                    if (readOnly) return;
                    if (isModelCircle) {
                      setPaletteTab('ai_engine');
                    } else if (isMemoryCircle) {
                      setPaletteTab('memories');
                    }
                  }}
                  className={`w-full h-full rounded-full bg-white dark:bg-slate-800 border-2 shadow-md flex items-center justify-center relative transition-transform group-hover/node:scale-105 ${selectedRingClass} ${
                    isModelCircle
                      ? aiEngine === 'antigravity_cloud'
                        ? 'border-sky-500 ring-2 ring-sky-500/20'
                        : aiEngine === 'antigravity'
                          ? 'border-orange-500 ring-2 ring-orange-500/20'
                          : 'border-indigo-500 ring-2 ring-indigo-500/20'
                      : isMemoryCircle
                        ? 'border-pink-400 dark:border-pink-700 hover:border-pink-500'
                        : 'border-slate-300 dark:border-slate-600 hover:border-purple-500'
                  }`}
                >
                  {renderOfficialNodeSvg(node.nodeId, 'w-7 h-7')}

                  {!readOnly && node.removable && node.group && (
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOrAddCatalogNode(node.group!, node.nodeId);
                      }}
                      className="opacity-0 group-hover/node:opacity-100 absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                      title="Desconectar del Agente IA"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                <div className="mt-1.5 w-[108px] -ml-[23px] text-center">
                  <div className="text-[10px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate">
                    {node.title}
                  </div>
                  <div className="text-[8.5px] font-semibold text-slate-400 truncate">
                    {nodeCfg?.fields && nodeCfg.fields.length > 0
                      ? `${nodeCfg.fields.length} campos`
                      : node.subtitle}
                  </div>

                  {isModelCircle && !readOnly && (
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (aiEngine === 'wappy') {
                          handleSelectAiEngineModel('antigravity', 'gemini-3.6-flash');
                        } else if (aiEngine === 'antigravity') {
                          handleSelectAiEngineModel('antigravity_cloud', 'gemini-3.6-flash');
                        } else {
                          handleSelectAiEngineModel('wappy', 'gemini-3.6-flash');
                        }
                      }}
                      className="mt-1 px-2 py-0.5 rounded-full text-[8.5px] font-extrabold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition"
                      title="Alternar entre WAPPY Cloud (Rotación de Claves), Antigravity Local (Mac/PC) y Antigravity Cloud 24/7"
                    >
                      Cambiar IA ⇄
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── PANEL INTERACTIVO DE EDICIÓN DE CADA NODO AL HACER CLIC SOBRE ÉL (ESTILO INSPECTOR DE PROPIEDADES) ─── */}
      {!readOnly && !compact && (() => {
        const activeNode = visualNodes.find((n) => n.key === activeConfigNodeKey);
        if (!activeNode) {
          return (
            <div className="rounded-xl border border-dashed border-purple-300 dark:border-purple-800/70 bg-purple-50/40 dark:bg-purple-950/20 px-3.5 py-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-purple-600 dark:text-[#C7F303] shrink-0" />
                <span>
                  💡 <strong>Edición por Nodo:</strong> Haz clic sobre <strong>cualquier nodo del lienzo</strong> (ej. <em>Extraer Trabajadores</em>, <em>Web Scraping AGY</em>, <em>Skill</em>, <em>Sub-Agente</em>, <em>Regla</em>, <em>Agente IA #1/#2</em> o <em>Condición Si/No</em>) para elegir sus campos exactos (ej. solo <strong>Nombre, Cédula y Edad</strong>), su <strong>Script de Web Scraping</strong>, su <strong>Modelo de IA</strong>, su <strong>Segundo Prompt</strong> y su <strong>Contexto de Entrada y Salida</strong>.
                </span>
              </span>
              <button
                type="button"
                onClick={() => setActiveConfigNodeKey(visualNodes.find((n) => n.shape === 'square_extractor')?.key || 'agent_root')}
                className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-extrabold shrink-0 transition"
              >
                Configurar Nodo
              </button>
            </div>
          );
        }

        const currentCfg: CanvasNodeConfig =
          workflowNodes?.canvasLayout?.nodeConfigs?.[activeNode.key] || {};
        const presetFields = getPresetFieldsForNode(activeNode.nodeId, activeNode.shape);
        const selectedFields = currentCfg.fields || [];
        const isExtraAgent = activeNode.key.startsWith('agent_extra_');
        const extraAgentObj = isExtraAgent
          ? (workflowNodes?.canvasLayout?.extraAgents || []).find((ea) => ea.key === activeNode.key)
          : null;
        const customNodeObj =
          activeNode.shape === 'custom_node'
            ? (workflowNodes?.canvasLayout?.customNodes || []).find((cn) => cn.key === activeNode.key)
            : null;
        const isWebScraperNode =
          activeNode.customNodeType === 'web_scraper' ||
          activeNode.nodeId.includes('scraping') ||
          activeNode.nodeId.includes('web_scraper');
        const isWebSearchNode =
          activeNode.customNodeType === 'web_search' || activeNode.nodeId.includes('web_search');
        const isSkillNode =
          activeNode.customNodeType === 'skill' || activeNode.nodeId.startsWith('skill_');
        const isRuleNode =
          activeNode.customNodeType === 'rule' || activeNode.nodeId.startsWith('rule_');
        const isSubagentCustomNode =
          activeNode.customNodeType === 'subagent' || activeNode.nodeId.startsWith('subagent_');

        const toggleFieldChip = (fieldLabel: string) => {
          const exists = selectedFields.includes(fieldLabel);
          const nextFields = exists
            ? selectedFields.filter((f) => f !== fieldLabel)
            : [...selectedFields, fieldLabel];
          handleUpdateNodeConfig(activeNode.key, { fields: nextFields });
        };

        const handleAddCustomField = () => {
          const val = customFieldInput.trim();
          if (!val) return;
          if (!selectedFields.includes(val)) {
            handleUpdateNodeConfig(activeNode.key, { fields: [...selectedFields, val] });
          }
          setCustomFieldInput('');
        };

        return (
          <div className="rounded-2xl border-2 border-purple-500/80 dark:border-[#C7F303]/80 bg-white dark:bg-slate-900 p-4 shadow-lg transition-all">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-slate-800 border border-purple-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                  {renderOfficialNodeSvg(activeNode.nodeId, 'w-5 h-5')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-[#C7F303]">
                      ⚙️ Configuración del Nodo: {activeNode.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {activeNode.subtitle}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Personaliza exactamente qué datos procesa este nodo, su contexto de entrada/salida y sus instrucciones específicas.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onAutoBuildPrompt && (
                  <button
                    type="button"
                    onClick={onAutoBuildPrompt}
                    className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 text-white text-[10.5px] font-extrabold flex items-center gap-1 shadow-xs"
                    title="Actualizar las instrucciones generales con la configuración de este nodo"
                  >
                    <Wand2 className="w-3 h-3" />
                    Reflejar en el Prompt
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveConfigNodeKey(null)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  title="Cerrar configuración del nodo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* A) SI EL NODO SELECCIONADO ES UN AGENTE IA (Principal o Agente IA #2 / #3 con Segundo Prompt) */}
            {activeNode.shape === 'agent' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      1. Agente Especialista o Avatar Asignado
                    </label>
                    <select
                      value={isExtraAgent ? extraAgentObj?.agentId || '' : agentId || ''}
                      onChange={(e) => {
                        if (isExtraAgent) {
                          handleUpdateExtraAgent(activeNode.key, e.target.value);
                        } else if (onSelectAgent) {
                          onSelectAgent(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white"
                    >
                      {availableAgentsWithTenshiAvatar.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      2. Motor y Modelo de IA para este Agente
                    </label>
                    <select
                      value={
                        isExtraAgent
                          ? `${currentCfg.aiEngine || extraAgentObj?.aiEngine || 'wappy'}:::${currentCfg.aiModel || extraAgentObj?.aiModel || 'gemini-3.6-flash'}`
                          : `${aiEngine}:::${aiModel}`
                      }
                      onChange={(e) => {
                        const [eng, mod] = e.target.value.split(':::') as [
                          'wappy' | 'antigravity' | 'antigravity_cloud',
                          string,
                        ];
                        if (isExtraAgent) {
                          handleUpdateNodeConfig(activeNode.key, { aiEngine: eng, aiModel: mod });
                        } else {
                          handleSelectAiEngineModel(eng, mod);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white"
                    >
                      {AI_ENGINE_MODELS.map((m) => (
                        <option key={m.id} value={`${m.engine}:::${m.model}`}>
                          {m.shortLabel} — {m.subtitle}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-extrabold uppercase text-purple-700 dark:text-[#C7F303] mb-1">
                    {isExtraAgent
                      ? `3. Segundo Prompt Exclusivo para ${activeNode.title} (${extraAgentObj?.agentName || 'IA Revisora'})`
                      : `3. Prompt / Instrucción del ${activeNode.title} Principal`}
                  </label>
                  <textarea
                    rows={3}
                    value={
                      isExtraAgent
                        ? currentCfg.prompt ?? extraAgentObj?.prompt ?? ''
                        : prompt || currentCfg.prompt || ''
                    }
                    onChange={(e) => {
                      if (isExtraAgent) {
                        handleUpdateNodeConfig(activeNode.key, { prompt: e.target.value });
                      } else {
                        if (onChangePrompt) onChangePrompt(e.target.value);
                        handleUpdateNodeConfig(activeNode.key, { prompt: e.target.value });
                      }
                    }}
                    placeholder={
                      isExtraAgent
                        ? 'Escribe aquí el segundo prompt para este segundo Agente IA (ej: "Revisa el acta del COPASST generada por el Agente #1, verifica que cumpla el Decreto 1072 y autoriza el envío del correo")...'
                        : 'Escribe qué debe analizar y ejecutar el Agente IA Principal...'
                    }
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-purple-50/30 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      4. Contexto de Entrada (Qué recibe este Agente)
                    </label>
                    <input
                      type="text"
                      value={currentCfg.inputContext || ''}
                      onChange={(e) =>
                        handleUpdateNodeConfig(activeNode.key, { inputContext: e.target.value })
                      }
                      placeholder="Ej: Recibe listado con Nombre, Cédula y Edad desde Extraer Trabajadores..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      5. Contexto de Salida (Qué entrega al siguiente nodo)
                    </label>
                    <input
                      type="text"
                      value={currentCfg.outputContext || ''}
                      onChange={(e) =>
                        handleUpdateNodeConfig(activeNode.key, { outputContext: e.target.value })
                      }
                      placeholder="Ej: Entrega tabla validada y acta lista para enviar por correo..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            ) : activeNode.shape === 'circle_model' ? (
              /* B) SI EL NODO SELECCIONADO ES EL CÍRCULO DE MODELO IA */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {AI_ENGINE_MODELS.map((m) => {
                  const isSel =
                    (m.engine === 'antigravity_cloud' && aiEngine === 'antigravity_cloud') ||
                    (m.engine === 'antigravity' && aiEngine === 'antigravity') ||
                    (m.engine === 'wappy' && aiEngine === 'wappy' && aiModel === m.model);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectAiEngineModel(m.engine, m.model)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                        isSel
                          ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 ring-2 ring-purple-500/30'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                      }`}
                    >
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {m.shortLabel}
                      </span>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        {m.subtitle}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {m.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* C) SI EL NODO SELECCIONADO ES UN EXTRACTOR, WEB SCRAPER ANTIGRAVITY, SKILL, SUB-AGENTE, REGLA, BÚSQUEDA WEB, MEMORIA, TOOL, CONDICIÓN SI/NO, HITO O SALIDA */
              <div className="space-y-3">
                {/* C.1) BLOQUE ESPECIAL SI ES UN NODO DE WEB SCRAPING CON ANTIGRAVITY (SCRIPT) */}
                {isWebScraperNode && (
                  <div className="p-3 rounded-xl border border-orange-300 dark:border-orange-700/80 bg-orange-50/40 dark:bg-orange-950/25 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold text-orange-800 dark:text-orange-300 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" />
                        🕷️ Configuración de Script de Web Scraping vía Google Antigravity
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold border ${
                          antigravityStatus.connected
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-400'
                        }`}
                      >
                        {antigravityStatus.connected
                          ? `🟢 Tu Instancia Antigravity está Conectada (${antigravityStatus.localConnected ? 'Local Mac/PC' : 'Cloud 24/7'})`
                          : '⚠️ Requiere tener configurada tu instancia de Google Antigravity'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                          🔗 URL(s) del Sitio Web a Scrapear (separadas por coma)
                        </label>
                        <input
                          type="text"
                          value={currentCfg.targetUrl ?? customNodeObj?.targetUrl ?? ''}
                          onChange={(e) =>
                            handleUpdateNodeConfig(activeNode.key, { targetUrl: e.target.value })
                          }
                          placeholder="Ej: https://www.mintrabajo.gov.co/normatividad/..."
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                          🐍 Motor de Script que ejecutará tu Instancia Antigravity
                        </label>
                        <select
                          value={
                            currentCfg.scriptEngine || customNodeObj?.scriptEngine || 'python_bs4'
                          }
                          onChange={(e) =>
                            handleUpdateNodeConfig(activeNode.key, {
                              scriptEngine: e.target.value as any,
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white"
                        >
                          <option value="python_bs4">
                            🐍 Python (BeautifulSoup4 + Playwright en Antigravity)
                          </option>
                          <option value="node_cheerio">
                            🟢 Node.js (Cheerio + Puppeteer en Antigravity)
                          </option>
                          <option value="chrome_mcp">
                            🌐 Chrome DevTools MCP (Navegador Real Conectado)
                          </option>
                          <option value="custom_script">
                            💻 Script Personalizado en Antigravity
                          </option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-200">
                          💻 Código del Script o Selectores CSS de Extracción
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const target =
                              (currentCfg.targetUrl ?? customNodeObj?.targetUrl ?? '').trim() ||
                              'https://ejemplo.gov.co';
                            const engine =
                              currentCfg.scriptEngine ||
                              customNodeObj?.scriptEngine ||
                              'python_bs4';
                            const autoScript =
                              engine === 'python_bs4'
                                ? `import requests\nfrom bs4 import BeautifulSoup\n\nurl = "${target}"\nresp = requests.get(url, timeout=20)\nsoup = BeautifulSoup(resp.text, "html.parser")\nfor el in soup.select("table tr, h1, h2, a[href$='.pdf']"):\n    print(el.get_text(strip=True))`
                                : engine === 'node_cheerio'
                                  ? `const axios = require('axios');\nconst cheerio = require('cheerio');\n(async () => {\n  const { data } = await axios.get('${target}');\n  const $ = cheerio.load(data);\n  $('table tr, h1, h2').each((_, el) => console.log($(el).text().trim()));\n})();`
                                  : `Navegar a ${target} con Chrome DevTools MCP, extraer todas las tablas y enlaces PDF y entregarlos en Markdown limpio.`;
                            handleUpdateNodeConfig(activeNode.key, { scriptCode: autoScript });
                          }}
                          className="text-[10px] font-extrabold text-orange-600 dark:text-[#C7F303] hover:underline"
                        >
                          ⚡ Autogenerar Script para esta URL
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={currentCfg.scriptCode ?? customNodeObj?.scriptCode ?? ''}
                        onChange={(e) =>
                          handleUpdateNodeConfig(activeNode.key, { scriptCode: e.target.value })
                        }
                        placeholder="Escribe aquí el script Python / Node.js o los selectores CSS que tu instancia de Google Antigravity ejecutará..."
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px] text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}

                {/* C.2) BLOQUE ESPECIAL SI ES UN NODO DE BÚSQUEDA EN LA WEB */}
                {isWebSearchNode && (
                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase text-sky-700 dark:text-sky-300 mb-1">
                      🌐 Consulta de Búsqueda en la Web o Dominios Prioritarios (.gov.co, MinTrabajo, ARL)
                    </label>
                    <input
                      type="text"
                      value={currentCfg.targetUrl ?? customNodeObj?.targetUrl ?? ''}
                      onChange={(e) =>
                        handleUpdateNodeConfig(activeNode.key, { targetUrl: e.target.value })
                      }
                      placeholder="Ej: site:mintrabajo.gov.co últimas circulares SST 2026..."
                      className="w-full px-3 py-1.5 rounded-xl border border-sky-300 dark:border-sky-700 bg-sky-50/30 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                )}

                {/* C.3) BLOQUE ESPECIAL SI ES UN NODO DE SKILL (SKILL.md), SUB-AGENTE O REGLA */}
                {(isSkillNode || isRuleNode || isSubagentCustomNode) && (
                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase text-purple-700 dark:text-[#C7F303] mb-1">
                      {isSkillNode
                        ? '🧩 Instrucciones Paso a Paso de esta Skill (SKILL.md)'
                        : isRuleNode
                          ? '📏 Regla Obligatoria / Guardrail que el Flujo Debe Cumplir'
                          : '🤖 Rol e Instrucción Específica de este Sub-Agente Especialista'}
                    </label>
                    <textarea
                      rows={3}
                      value={
                        isSkillNode
                          ? currentCfg.skillContent ?? customNodeObj?.content ?? ''
                          : isRuleNode
                            ? currentCfg.ruleText ?? customNodeObj?.content ?? ''
                            : currentCfg.prompt ?? customNodeObj?.content ?? ''
                      }
                      onChange={(e) => {
                        if (isSkillNode) {
                          handleUpdateNodeConfig(activeNode.key, { skillContent: e.target.value });
                        } else if (isRuleNode) {
                          handleUpdateNodeConfig(activeNode.key, { ruleText: e.target.value });
                        } else {
                          handleUpdateNodeConfig(activeNode.key, { prompt: e.target.value });
                        }
                      }}
                      placeholder="Escribe aquí el contenido detallado que aplicará este nodo dentro del flujo..."
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-purple-50/30 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10.5px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1.5">
                    1. Selecciona qué Campos o Datos específicos deseas de «{activeNode.title}» (Haz clic para marcar/desmarcar):
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {presetFields.map((fieldLabel) => {
                      const active = selectedFields.includes(fieldLabel);
                      return (
                        <button
                          key={fieldLabel}
                          type="button"
                          onClick={() => toggleFieldChip(fieldLabel)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 border ${
                            active
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {active && <Check className="w-3 h-3 stroke-[3]" />}
                          {fieldLabel}
                        </button>
                      );
                    })}
                    {selectedFields
                      .filter((f) => !presetFields.includes(f))
                      .map((customF) => (
                        <button
                          key={customF}
                          type="button"
                          onClick={() => toggleFieldChip(customF)}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-teal-600 text-white border border-teal-600 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          {customF}
                        </button>
                      ))}
                  </div>

                  {/* Agregar campo personalizado */}
                  <div className="mt-2 flex items-center gap-2 max-w-md">
                    <input
                      type="text"
                      value={customFieldInput}
                      onChange={(e) => setCustomFieldInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomField();
                        }
                      }}
                      placeholder="Escribe otro campo específico (ej: Rh, Teléfono Emergencia) y pulsa +..."
                      className="flex-1 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-800 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomField}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 dark:bg-[#C7F303] text-white dark:text-[#0E1300] text-[10.5px] font-extrabold"
                    >
                      + Añadir Campo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      2. Contexto de Entrada
                    </label>
                    <input
                      type="text"
                      value={currentCfg.inputContext || ''}
                      onChange={(e) =>
                        handleUpdateNodeConfig(activeNode.key, { inputContext: e.target.value })
                      }
                      placeholder="Ej: Recibe señal del disparador o filtro de sede..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      3. Contexto de Salida
                    </label>
                    <input
                      type="text"
                      value={currentCfg.outputContext || ''}
                      onChange={(e) =>
                        handleUpdateNodeConfig(activeNode.key, { outputContext: e.target.value })
                      }
                      placeholder="Ej: Entregar solo Nombre, Cédula y Edad al Agente IA..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      4. Filtro / Regla Específica del Nodo
                    </label>
                    <input
                      type="text"
                      value={currentCfg.customInstruction || ''}
                      onChange={(e) =>
                        handleUpdateNodeConfig(activeNode.key, {
                          customInstruction: e.target.value,
                        })
                      }
                      placeholder="Ej: Solo trabajadores activos o mayores de 50 años..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
