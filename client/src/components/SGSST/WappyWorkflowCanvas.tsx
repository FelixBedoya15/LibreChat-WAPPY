import React, { useState, useRef, useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import {
  TRIGGER_NODES,
  EXTRACTOR_NODES,
  INPUT_CONNECTOR_NODES,
  HITO_APP_NODES,
  OUTPUT_ACTION_NODES,
  AI_ENGINE_MODELS,
  MEMORY_NODES,
  getNodeDefById,
  normalizeTriggersList,
  normalizeExtractorsList,
  normalizeMemoriesList,
  type WorkflowNodesConfig,
  type CanvasNodePosition,
  type CanvasWireEdge,
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
    | 'square_hito'
    | 'square_output'
    | 'circle_model'
    | 'circle_memory'
    | 'circle_tool';
  title: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  height: number;
  removable?: boolean;
  group?: 'triggers' | 'extractors' | 'memories' | 'inputs' | 'hitos' | 'outputs';
}

export default function WappyWorkflowCanvas({
  workflowNodes,
  onChange,
  agentId,
  agentName,
  agents = [],
  onSelectAgent,
  onAutoBuildPrompt,
  readOnly = false,
  compact = false,
}: WappyWorkflowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [paletteTab, setPaletteTab] = useState<
    'triggers' | 'extractors' | 'ai_engine' | 'memories' | 'connectors' | 'hitos' | 'outputs'
  >('triggers');
  const [zoom, setZoom] = useState<number>(compact ? 0.68 : 0.9);

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

    // ETAPA 3. ROOT AI AGENT NODE (Rectángulo ancho central con 3 rombos abajo: Chat Model *, Memory ◆, Tool +)
    const agentPos = customPositions['agent_root'] || { x: 274, y: 70 };
    list.push({
      key: 'agent_root',
      nodeId: 'ai_agent_root',
      shape: 'agent',
      title: 'AI Agent',
      subtitle: agentName || 'Consultor SG-SST',
      x: agentPos.x,
      y: agentPos.y,
      width: 228,
      height: 86,
    });

    // 3A. SUB-NODO CIRCULAR: CHAT MODEL * (WAPPY Rotación de Claves vs Antigravity Local vs Antigravity Cloud 24/7)
    const modelPos = customPositions['sub_model'] || { x: 180, y: 245 };
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
            : 'WAPPY Key Rotation',
      x: modelPos.x,
      y: modelPos.y,
      width: 62,
      height: 62,
    });

    // 3B. SUB-NODOS CIRCULARES: MEMORIAS DEL AGENTE (Empresa SST, Bitácora Anti-Duplicados, RAG NotebookLM, Normativa)
    activeMemories.forEach((memId, idx) => {
      const memDef = MEMORY_NODES.find((m) => m.id === memId) || MEMORY_NODES[0];
      const key = idx === 0 ? 'sub_memory' : `sub_memory_${memDef.id}`;
      const defaultX = 285 + idx * 88;
      const defaultY = idx % 2 === 0 ? 245 : 262;
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

    // 3C. SUB-NODOS CIRCULARES: TOOLS DEL AGENTE (Conectores y Motores de Consulta/Análisis)
    const toolInputs = workflowNodes?.inputs || [];
    const memoryRightEdge = 285 + Math.max(1, activeMemories.length) * 88;
    toolInputs.forEach((toolId, idx) => {
      const def = getNodeDefById(toolId);
      if (!def) return;
      const key = `tool_inputs_${toolId}`;
      const defaultX = Math.max(395, memoryRightEdge) + idx * 92;
      const defaultY = idx % 2 === 0 ? 245 : 262;
      const pos = customPositions[key] || { x: defaultX, y: defaultY };
      list.push({
        key,
        nodeId: toolId,
        shape: 'circle_tool',
        title: def.shortLabel,
        subtitle: 'Tool del Agente',
        x: pos.x,
        y: pos.y,
        width: 62,
        height: 62,
        removable: true,
        group: 'inputs',
      });
    });

    // ETAPA 4A. NODO CONDICIONAL IF (Cuadrado con icono de bifurcación y salidas true / false)
    if (includeIfNode) {
      const ifPos = customPositions['if_router'] || { x: 548, y: 76 };
      list.push({
        key: 'if_router',
        nodeId: 'if_node_router',
        shape: 'if',
        title: 'If',
        subtitle: 'Hallazgos / Alerta',
        x: ifPos.x,
        y: ifPos.y,
        width: 72,
        height: 72,
      });
    }

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

    // AGENTES IA ADICIONALES / REVISORES EN EL MISMO LIENZO (Orquestación Multi-IA libre)
    const extraAgents = workflowNodes?.canvasLayout?.extraAgents || [];
    extraAgents.forEach((ea, idx) => {
      const pos = customPositions[ea.key] || { x: 540 + idx * 250, y: 188 };
      list.push({
        key: ea.key,
        nodeId: ea.agentId || 'ai_agent_extra',
        shape: 'agent',
        title: `AI Agent #${idx + 2}`,
        subtitle: ea.agentName || 'IA Revisora / Auditora',
        x: pos.x,
        y: pos.y,
        width: 224,
        height: 82,
        removable: true,
      });
    });

    return list;
  }, [
    workflowNodes,
    activeTriggers,
    activeExtractors,
    activeMemories,
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

    // 1. Etapa 1 (Disparadores) ● ──> ● Etapa 2 (Extraer Datos) ● ──> ● Etapa 3 (AI Agent)
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

    // 2. Etapa 3 (AI Agent) ● ──> ● If Node ──> ● Etapa 4 (Hitos/Apps) ──> ● Etapa 5 (Bitácora Final)
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
          label: isTrueBranch ? 'true' : 'false',
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

    // 3A. AI Agent ◆ (Chat Model *) ── - - ──> ◆ Sub-Nodo Circular Modelo
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

    // 3B. AI Agent ◆ (Memory) ── - - ──> ◆ Sub-Nodos Circulares de Memoria
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

    // 3C. AI Agent ◆ (Tool +) ── - - ──> ◆ Sub-Nodos Circulares de Tools del Agente
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

    // 6. Cables personalizados adicionales creados con el mouse por el usuario (conectando cualquier módulo a cualquier otro)
    const customEdges = workflowNodes?.canvasLayout?.edges || [];
    customEdges.forEach((edge) => {
      const fromNode = map.get(edge.from);
      const toNode = map.get(edge.to);
      if (!fromNode || !toNode) return;
      pushWire({
        id: edge.id,
        x1: fromNode.x + fromNode.width,
        y1: fromNode.y + fromNode.height / 2,
        x2: toNode.x,
        y2: toNode.y + toNode.height / 2,
        dashed: edge.kind === 'sub',
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

  // Agregar un Agente IA adicional (ej. Segunda IA Revisora / Auditora en el mismo flujo)
  const handleAddExtraAgent = () => {
    if (!onChange || readOnly) return;
    const prevExtra = workflowNodes?.canvasLayout?.extraAgents || [];
    const newKey = `agent_extra_${Date.now()}`;
    const defaultAgent = agents[1] || agents[0];
    onChange({
      ...workflowNodes,
      canvasLayout: {
        ...(workflowNodes?.canvasLayout || {}),
        extraAgents: [
          ...prevExtra,
          {
            key: newKey,
            agentId: defaultAgent?.id || '',
            agentName: defaultAgent?.name || 'IA Revisora / Auditora SST',
            aiEngine: 'wappy',
            aiModel: 'gemini-3.6-flash',
          },
        ],
      },
    });
  };

  // Actualizar o quitar un Agente IA adicional
  const handleUpdateExtraAgent = (key: string, newAgentId: string) => {
    if (!onChange || readOnly) return;
    const found = agents.find((a) => a.id === newAgentId);
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

  // Iniciar arrastre de un nodo dentro del lienzo
  const handleNodePointerDown = (e: React.PointerEvent, node: VisualNodeInstance) => {
    if (readOnly) return;
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pointerX = (e.clientX - rect.left) / zoom;
    const pointerY = (e.clientY - rect.top) / zoom;
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

  // Movimiento del puntero sobre el lienzo (arrastrar nodo o estirar cable)
  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (readOnly) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pointerX = (e.clientX - rect.left) / zoom;
    const pointerY = (e.clientY - rect.top) / zoom;

    if (draggingNodeKey) {
      updateNodePosition(draggingNodeKey, pointerX - dragOffset.dx, pointerY - dragOffset.dy);
    } else if (wiringFrom) {
      setWiringFrom((prev) => (prev ? { ...prev, currX: pointerX, currY: pointerY } : null));
    }
  };

  // Soltar nodo o finalizar conexión de cable sobre otro nodo
  const handleCanvasPointerUp = (targetNodeKey?: string) => {
    if (draggingNodeKey) {
      setDraggingNodeKey(null);
    }
    if (wiringFrom) {
      if (targetNodeKey && targetNodeKey !== wiringFrom.sourceKey && onChange) {
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
                  kind: wiringFrom.portType.startsWith('diamond') ? 'sub' : 'main',
                },
              ],
            },
          });
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
    onChange({
      ...workflowNodes,
      canvasLayout: null,
    });
  };

  // Calcular ancho dinámico del lienzo según la cantidad de herramientas conectadas
  const canvasMinWidth = useMemo(() => {
    const maxRight = visualNodes.reduce((acc, n) => Math.max(acc, n.x + n.width + 90), 890);
    return Math.max(890, maxRight);
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
                { id: 'connectors', label: '🔧 5. Tools del Agente', badge: (workflowNodes.inputs || []).length },
                { id: 'hitos', label: '🛡️ 6. Cambiar en Hito / App', badge: (workflowNodes.hitos || []).length },
                { id: 'outputs', label: '📤 7. Bitácora & Salida', badge: (workflowNodes.outputs || []).length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPaletteTab(tab.id as any)}
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
                📥 <strong>Etapa 2 — Extracción / Lectura Previa:</strong> Antes de que el Agente IA piense, extrae información de <strong>Gmail</strong>, <strong>Google Drive</strong>, <strong>OneDrive</strong>, una <strong>Carpeta en tu Computador (vía Antigravity)</strong> o un <strong>Aplicativo / Base de Trabajadores de Somos SST</strong> y envíasela al Agente.
              </span>
            ) : paletteTab === 'memories' ? (
              <span>
                💾 <strong>Rombo Memory (◆) — Las 4 Memorias del Agente:</strong> Define qué recuerda el Agente antes de analizar los datos (datos de la <strong>Empresa Activa</strong>, <strong>Bitácora Anti-Duplicados</strong>, <strong>Cuadernos RAG NotebookLM</strong> o <strong>Reglas Normativas SST</strong>).
              </span>
            ) : paletteTab === 'hitos' ? (
              <span>
                🛡️ <strong>Etapa 4 — Acción en Hito o Aplicativo:</strong> Elige en qué matriz o aplicativo de los <strong>7 Hitos de Somos SST</strong> el Agente debe guardar, actualizar o modificar registros tras procesar la información.
              </span>
            ) : paletteTab === 'outputs' ? (
              <span>
                📤 <strong>Etapa 5 — Bitácora Final y Notificación:</strong> Al terminar todo el flujo, envía el informe detallado de la bitácora a <strong>Gmail</strong>, como <strong>Notificación Directa en WAPPY + Tenshi</strong> o de regreso a <strong>Google Antigravity (PC o Cloud)</strong>.
              </span>
            ) : (
              <span>
                💡 <strong>Arrastra cualquier cuadrito al lienzo punteado</strong> (o haz clic sobre él) para conectarlo al flujo. Dentro del lienzo puedes mover los nodos y estirar los cables desde los puertos.
              </span>
            )}
          </div>

          {/* CUADRITOS ARRASTRABLES CON LOGOS SVG ORIGINALES */}
          {paletteTab === 'ai_engine' ? (
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
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5">
              {(paletteTab === 'extractors'
                ? EXTRACTOR_NODES
                : paletteTab === 'connectors'
                  ? INPUT_CONNECTOR_NODES
                  : paletteTab === 'hitos'
                    ? HITO_APP_NODES
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
                const isSelected =
                  groupKey === 'trigger'
                    ? activeTriggers.includes(node.id)
                    : groupKey === 'extractors'
                      ? activeExtractors.includes(node.id)
                      : (workflowNodes[groupKey] || []).includes(node.id);

                return (
                  <div
                    key={node.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        'application/wappy-flow-node',
                        JSON.stringify({ kind: 'node', group: groupKey, nodeId: node.id }),
                      );
                    }}
                    onClick={() => toggleOrAddCatalogNode(groupKey, node.id)}
                    title={`${node.label} — Arrastra al lienzo o haz clic para ${isSelected ? 'quitar' : 'conectar'}`}
                    className="group/tile flex flex-col items-center w-[78px] shrink-0 cursor-grab active:cursor-grabbing select-none"
                  >
                    {/* Cuadrito con Logo SVG Original */}
                    <div
                      className={`relative w-14 h-14 flex items-center justify-center bg-white dark:bg-slate-800 border-2 transition-all duration-150 shadow-sm group-hover/tile:-translate-y-0.5 group-hover/tile:shadow-md ${
                        groupKey === 'trigger'
                          ? 'rounded-l-[22px] rounded-r-[10px]'
                          : 'rounded-2xl'
                      } ${
                        isSelected
                          ? 'border-purple-600 dark:border-[#C7F303] ring-2 ring-purple-500/25 dark:ring-[#C7F303]/25'
                          : 'border-slate-200 dark:border-slate-700 hover:border-purple-400'
                      }`}
                    >
                      {renderOfficialNodeSvg(node.id, 'w-7 h-7')}

                      {/* Insignia de conectado */}
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-purple-600 dark:bg-[#C7F303] text-white dark:text-[#0E1300] flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span className="mt-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight line-clamp-2">
                      {node.shortLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── LIENZO VISUAL INTERACTIVO WAPPY (FONDO PUNTEADO + NODOS + CABLES SVG) ─── */}
      <div
        className={`relative w-full overflow-x-auto overflow-y-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-[#f8fafc] dark:bg-[#0b1120] shadow-inner select-none ${
          compact ? 'h-[255px]' : 'h-[375px]'
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
        {/* Controles flotantes del lienzo (Zoom, Condicional If, Auto-Organizar) */}
        {!compact && (
          <div className="sticky left-3 top-3 z-30 inline-flex flex-wrap items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm m-2.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Lienzo WAPPY
            </span>
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
                  title="Agregar otra Inteligencia Artificial / Agente Revisor al campo para conectarlo donde quieras"
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
                  title="Activar/Desactivar nodo condicional If (true / false)"
                >
                  <GitFork className="w-3 h-3" />
                  Nodo If
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
            height: '355px',
            transform: `scale(${zoom})`,
          }}
        >
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
                    fill={w.label === 'true' ? '#059669' : '#64748b'}
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
            // 1. ETAPA 1: FIGURA TRIGGER NODE (Forma en "D" con rayo ⚡ a la izquierda y puerto circular derecho)
            if (node.shape === 'trigger') {
              return (
                <div
                  key={node.key}
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  onPointerUp={() => handleCanvasPointerUp(node.key)}
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  className={`absolute z-20 group/node select-none ${
                    readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  {/* Rayo naranja de Trigger a la izquierda */}
                  <div className="absolute -left-5 top-1/2 -translate-y-1/2 text-orange-500 drop-shadow-sm">
                    <Zap className="w-4 h-4 fill-orange-500" />
                  </div>

                  {/* Caja en forma de D (redondeada a la izquierda, recta a la derecha) */}
                  <div className="w-full h-full rounded-l-[28px] rounded-r-[12px] bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 group-hover/node:border-orange-500 shadow-md flex items-center justify-center relative transition-colors">
                    {renderOfficialNodeSvg(node.nodeId, 'w-8 h-8')}

                    {!readOnly && node.removable && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => toggleOrAddCatalogNode('trigger', node.nodeId)}
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

            // 1B. ETAPA 2: FIGURA NODO DE EXTRACCIÓN / LECTURA PREVIA (O en cualquier punto del flujo libre)
            if (node.shape === 'square_extractor') {
              return (
                <div
                  key={node.key}
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  onPointerUp={() => handleCanvasPointerUp(node.key)}
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  className={`absolute z-20 group/node select-none ${
                    readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  {/* Insignia superior de etapa */}
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-sky-600 text-white text-[7.5px] font-black uppercase tracking-wider shadow-xs z-10 whitespace-nowrap">
                    Extraer
                  </span>

                  {/* Puerto de entrada izquierdo (●) */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-sky-500 border-2 border-white dark:border-slate-900" />

                  <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-sky-400 dark:border-sky-600 group-hover/node:border-sky-500 shadow-md flex items-center justify-center relative transition-colors">
                    {renderOfficialNodeSvg(node.nodeId, 'w-8 h-8')}

                    {!readOnly && node.removable && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => toggleOrAddCatalogNode('extractors', node.nodeId)}
                        className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                        title="Quitar nodo de extracción"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  {/* Puerto circular de salida derecho (●) hacia cualquier otro módulo */}
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
                    title="Arrastra desde este puerto para conectar a cualquier módulo o IA"
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-sky-500 hover:bg-purple-600 border-2 border-white dark:border-slate-900 cursor-crosshair transition-transform hover:scale-125"
                  />

                  <div className="mt-1.5 w-[116px] -ml-[23px] text-center pointer-events-none">
                    <div className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate">
                      {node.title}
                    </div>
                    <div className="text-[9px] text-sky-600 dark:text-sky-400 font-semibold truncate">
                      {node.subtitle}
                    </div>
                  </div>
                </div>
              );
            }

            // 2. ETAPA 3: FIGURA AI AGENT NODE (Principal o IA Adicional / Revisora en cualquier punto del campo)
            if (node.shape === 'agent') {
              const isExtraAgent = node.key.startsWith('agent_extra_');
              const extraConfig = isExtraAgent
                ? (workflowNodes?.canvasLayout?.extraAgents || []).find((ea) => ea.key === node.key)
                : null;

              return (
                <div
                  key={node.key}
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  onPointerUp={() => handleCanvasPointerUp(node.key)}
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  className={`absolute z-20 group/node select-none ${
                    readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  {/* Puerto izquierdo de entrada (●) */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-lg bg-slate-400 border-2 border-white dark:border-slate-900" />

                  {/* Cuerpo rectangular del AI Agent */}
                  <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 group-hover/node:border-purple-500 shadow-md px-3.5 flex items-center gap-3 relative transition-colors">
                    {!readOnly && isExtraAgent && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => handleRemoveExtraAgent(node.key)}
                        className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                        title="Quitar este Agente IA adicional"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}

                    <div className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-purple-950/80 text-white dark:text-[#C7F303] flex items-center justify-center shrink-0 shadow-sm">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                          {node.title}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[8.5px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          {isExtraAgent ? 'IA Revisora' : 'Tools Agent'}
                        </span>
                      </div>

                      {/* Selector directo de Agente Especialista dentro del nodo */}
                      {!readOnly && agents.length > 0 && (onSelectAgent || isExtraAgent) ? (
                        <select
                          value={isExtraAgent ? extraConfig?.agentId || '' : agentId || ''}
                          onPointerDown={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            if (isExtraAgent) {
                              handleUpdateExtraAgent(node.key, e.target.value);
                            } else if (onSelectAgent) {
                              onSelectAgent(e.target.value);
                            }
                          }}
                          className="mt-1 w-full text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50/70 dark:bg-slate-900 border border-purple-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 focus:outline-none cursor-pointer truncate"
                        >
                          {agents.map((ag) => (
                            <option key={ag.id} value={ag.id}>
                              {ag.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 truncate mt-0.5">
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
                    title="Arrastra para conectar la salida de esta IA hacia otro módulo, correo, acta u otra IA"
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-slate-400 hover:bg-purple-600 border-2 border-white dark:border-slate-900 cursor-crosshair transition-transform hover:scale-125"
                  />

                  {/* ─── LOS 3 PUERTOS EN ROMBO (◆ DIAMOND PORTS) INFERIORES ─── */}
                  {/* Rombo 1: Chat Model * */}
                  <div
                    onPointerDown={(e) =>
                      handlePortPointerDown(
                        e,
                        node.key,
                        'diamond_model',
                        node.x + 44,
                        node.y + node.height,
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!readOnly) setPaletteTab('ai_engine');
                    }}
                    style={{ left: 38 }}
                    className="absolute -bottom-2 flex flex-col items-center cursor-pointer"
                    title="Cambiar Motor IA (WAPPY Cloud / Antigravity Local / Antigravity Cloud 24/7)"
                  >
                    <div className="w-3 h-3 rotate-45 bg-indigo-500 border-2 border-white dark:border-slate-900 shadow-sm" />
                    <span className="mt-1 text-[8.5px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      Chat Model <span className="text-rose-500">*</span>
                    </span>
                  </div>

                  {/* Rombo 2: Memory [+] */}
                  <div
                    onPointerDown={(e) =>
                      handlePortPointerDown(
                        e,
                        node.key,
                        'diamond_memory',
                        node.x + 114,
                        node.y + node.height,
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!readOnly) setPaletteTab('memories');
                    }}
                    style={{ left: 104 }}
                    className="absolute -bottom-2 flex flex-col items-center cursor-pointer group/memport"
                    title="Configurar las 4 Memorias del Agente (Empresa Activa, Bitácora Anti-Duplicados, RAG NotebookLM, Reglas Normativas SST)"
                  >
                    <div className="w-3 h-3 rotate-45 bg-pink-500 group-hover/memport:bg-pink-600 border-2 border-white dark:border-slate-900 shadow-sm" />
                    <span className="mt-1 text-[8.5px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-0.5">
                      Memory
                      {!readOnly && (
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-[9px] font-black text-pink-600">
                          +
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Rombo 3: Tool [+] */}
                  <div
                    onPointerDown={(e) =>
                      handlePortPointerDown(
                        e,
                        node.key,
                        'diamond_tool',
                        node.x + 184,
                        node.y + node.height,
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!readOnly) setPaletteTab('connectors');
                    }}
                    style={{ left: 178 }}
                    className="absolute -bottom-2 flex flex-col items-center cursor-pointer group/toolport"
                    title="Conectar Tools y Motores de Análisis al Agente IA"
                  >
                    <div className="w-3 h-3 rotate-45 bg-indigo-500 group-hover/toolport:bg-purple-600 border-2 border-white dark:border-slate-900 shadow-sm" />
                    <span className="mt-1 text-[8.5px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-0.5">
                      Tool
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

            // 3. FIGURA IF / ROUTER NODE (Cuadrado con icono de bifurcación verde y 2 salidas true/false)
            if (node.shape === 'if') {
              return (
                <div
                  key={node.key}
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  onPointerUp={() => handleCanvasPointerUp(node.key)}
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  className={`absolute z-20 group/node select-none ${
                    readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  {/* Puerto de entrada izquierdo (●) */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900" />

                  <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 group-hover/node:border-emerald-500 shadow-md flex items-center justify-center transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <GitFork className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Puerto de salida superior: TRUE */}
                  <div
                    onPointerDown={(e) =>
                      handlePortPointerDown(e, node.key, 'if_true', node.x + node.width, node.y + 24)
                    }
                    style={{ top: 20 }}
                    className="absolute -right-2 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 cursor-crosshair"
                    title="Rama TRUE (Si hay hallazgos / alertas)"
                  />

                  {/* Puerto de salida inferior: FALSE */}
                  <div
                    onPointerDown={(e) =>
                      handlePortPointerDown(e, node.key, 'if_false', node.x + node.width, node.y + 52)
                    }
                    style={{ top: 48 }}
                    className="absolute -right-2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900 cursor-crosshair"
                    title="Rama FALSE (Sin novedades)"
                  />

                  <div className="mt-1.5 text-center pointer-events-none">
                    <div className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                      {node.title}
                    </div>
                    <div className="text-[9px] text-slate-400">{node.subtitle}</div>
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
                  onPointerUp={() => handleCanvasPointerUp(node.key)}
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  className={`absolute z-20 group/node select-none ${
                    readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  {/* Insignia superior de etapa */}
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-teal-600 text-white text-[7.5px] font-black uppercase tracking-wider shadow-xs z-10 whitespace-nowrap">
                    Hito / App
                  </span>

                  {/* Puerto de entrada izquierdo (●) */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900" />

                  <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-teal-400 dark:border-teal-600 group-hover/node:border-teal-500 shadow-md flex items-center justify-center relative transition-colors">
                    {renderOfficialNodeSvg(node.nodeId, 'w-8 h-8')}

                    {!readOnly && node.removable && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => toggleOrAddCatalogNode('hitos', node.nodeId)}
                        className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                        title="Quitar acción en Hito / App"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  {/* Puerto circular de salida derecho (●) hacia cualquier otro módulo o IA */}
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
                      {node.subtitle}
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
                  onPointerUp={() => handleCanvasPointerUp(node.key)}
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  className={`absolute z-20 group/node select-none ${
                    readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  {/* Insignia superior de etapa */}
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[7.5px] font-black uppercase tracking-wider shadow-xs z-10 whitespace-nowrap">
                    Bitácora
                  </span>

                  {/* Puerto de entrada izquierdo */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900" />

                  <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 group-hover/node:border-purple-500 shadow-md flex items-center justify-center relative transition-colors">
                    {renderOfficialNodeSvg(node.nodeId, 'w-8 h-8')}

                    {!readOnly && node.removable && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => toggleOrAddCatalogNode('outputs', node.nodeId)}
                        className="opacity-0 group-hover/node:opacity-100 absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow transition-opacity"
                        title="Quitar nodo de salida"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  {/* Puerto de salida arrastrable (●) + botón [+] para encadenar con otra IA o módulo */}
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

            // 5. FIGURA SUB-NODOS CIRCULARES (Chat Model *, Memory y Tools con Rombo superior ◆)
            const isModelCircle = node.shape === 'circle_model';
            const isMemoryCircle = node.shape === 'circle_memory';

            return (
              <div
                key={node.key}
                onPointerDown={(e) => handleNodePointerDown(e, node)}
                onPointerUp={() => handleCanvasPointerUp(node.key)}
                style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                className={`absolute z-20 group/node select-none ${
                  readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                }`}
              >
                {/* Puerto superior en forma de Rombo (◆) que conecta al AI Agent */}
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
                  className={`w-full h-full rounded-full bg-white dark:bg-slate-800 border-2 shadow-md flex items-center justify-center relative transition-transform group-hover/node:scale-105 ${
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

                  {/* Botón para quitar memoria o tool */}
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

                {/* Etiqueta debajo del círculo + Selector rápido de motor IA si es el nodo Chat Model */}
                <div className="mt-1.5 w-[108px] -ml-[23px] text-center">
                  <div className="text-[10px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate">
                    {node.title}
                  </div>
                  <div className="text-[8.5px] font-semibold text-slate-400 truncate">
                    {node.subtitle}
                  </div>

                  {isModelCircle && !readOnly && (
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => {
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
    </div>
  );
}
