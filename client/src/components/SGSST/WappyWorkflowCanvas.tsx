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
} from 'lucide-react';
import {
  TRIGGER_NODES,
  INPUT_CONNECTOR_NODES,
  HITO_APP_NODES,
  OUTPUT_ACTION_NODES,
  AI_ENGINE_MODELS,
  MEMORY_NODES,
  getNodeDefById,
  type WorkflowNodesConfig,
  type CanvasNodePosition,
  type CanvasWireEdge,
} from './workflowNodesCatalog';

/* ═══════════════════════════════════════════════════════════════════════════
   1. LOGOS SVG OFICIALES Y ICONOS DE HERRAMIENTAS WAPPY (Imagen 1 y 3)
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderOfficialNodeSvg(nodeId: string, sizeClass = 'w-7 h-7'): React.ReactNode {
  const id = (nodeId || '').toLowerCase();

  // Google Drive (Logo Oficial Tricolor/Cuatricolor)
  if (id.includes('google_drive') || id.includes('drive_folder')) {
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

  // Google Gmail / Email Report (Logo Oficial M Cuatricolor)
  if (id.includes('gmail') || id.includes('email_report')) {
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

  // Microsoft OneDrive
  if (id.includes('onedrive')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <path fill="#0078D4" d="M38.5,24.2c-0.7-5.8-5.6-10.2-11.6-10.2c-4.6,0-8.6,2.6-10.5,6.5c-0.7-0.2-1.5-0.3-2.3-0.3 c-4.9,0-8.9,3.9-9.1,8.8C2.7,30.2,1,32.6,1,35.4C1,39.1,4,42,7.7,42h29.8c4.7,0,8.5-3.8,8.5-8.5C46,28.8,42.7,24.9,38.5,24.2z" />
      </svg>
    );
  }

  // Google NotebookLM
  if (id.includes('notebooklm')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass}>
        <rect x="6" y="6" width="36" height="36" rx="10" fill="#0F172A" />
        <path d="M14 31C14 21 24 15 34 19" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M14 35C16 26 25 21 34 25" stroke="#A855F7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M16 38C19 31 26 28 34 31" stroke="#34D399" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  // Google Antigravity + MCP (Icono Oficial de AgentSessionPanel.tsx)
  if (id.includes('antigravity')) {
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
  if (id.includes('somos_sst') || id.includes('sgsst_db_audit') || id.includes('medlineplus') || id.includes('examenes_medicos')) {
    return <HeartPulse className={`${sizeClass} text-rose-500`} />;
  }
  if (id.includes('canvas') || id.includes('dictamen')) {
    return <Palette className={`${sizeClass} text-fuchsia-500`} />;
  }
  if (id.includes('consultar_agente') || id.includes('especialista')) {
    return <UserCheck className={`${sizeClass} text-violet-500`} />;
  }
  if (id.includes('schedule_cron') || id.includes('automatizaciones')) {
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
  shape: 'trigger' | 'agent' | 'if' | 'square_output' | 'circle_model' | 'circle_memory' | 'circle_tool';
  title: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  height: number;
  removable?: boolean;
  group?: 'inputs' | 'hitos' | 'outputs';
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
  const [paletteTab, setPaletteTab] = useState<'connectors' | 'hitos' | 'ai_engine' | 'triggers' | 'outputs'>('connectors');
  const [zoom, setZoom] = useState<number>(compact ? 0.72 : 0.94);

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

  const aiEngine = workflowNodes?.aiEngine || 'wappy';
  const aiModel = workflowNodes?.aiModel || 'gemini-3.6-flash';
  const memoryNodeId = workflowNodes?.memoryNode || 'wappy_memory_company';
  const includeIfNode = workflowNodes?.includeIfNode !== false;

  const currentModelDef = useMemo(() => {
    if (aiEngine === 'antigravity') {
      return AI_ENGINE_MODELS.find((m) => m.engine === 'antigravity') || AI_ENGINE_MODELS[3];
    }
    return (
      AI_ENGINE_MODELS.find((m) => m.engine === 'wappy' && m.model === aiModel) || AI_ENGINE_MODELS[0]
    );
  }, [aiEngine, aiModel]);

  const customPositions = workflowNodes?.canvasLayout?.positions || {};

  // Construir todos los nodos con las figuras geométricas del flujo visual WAPPY
  const visualNodes = useMemo<VisualNodeInstance[]>(() => {
    const list: VisualNodeInstance[] = [];
    const triggerDef = getNodeDefById(workflowNodes?.trigger || 'schedule_cron') || TRIGGER_NODES[0];

    // 1. TRIGGER NODE (Forma en "D": izquierda redondeada, derecha recta + rayo ⚡)
    const trigPos = customPositions['trigger_root'] || { x: 48, y: 76 };
    list.push({
      key: 'trigger_root',
      nodeId: triggerDef.id,
      shape: 'trigger',
      title: triggerDef.shortLabel,
      subtitle: 'When Triggered',
      x: trigPos.x,
      y: trigPos.y,
      width: 76,
      height: 76,
    });

    // 2. ROOT AI AGENT NODE (Rectángulo ancho central con 3 rombos abajo: Chat Model *, Memory, Tool +)
    const agentPos = customPositions['agent_root'] || { x: 268, y: 70 };
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

    // 3. SUB-NODO CIRCULAR: CHAT MODEL * (WAPPY Rotación de Claves vs Google Antigravity + MCP)
    const modelPos = customPositions['sub_model'] || { x: 185, y: 245 };
    list.push({
      key: 'sub_model',
      nodeId: currentModelDef.id,
      shape: 'circle_model',
      title: currentModelDef.shortLabel,
      subtitle: aiEngine === 'antigravity' ? 'Antigravity + MCP' : 'WAPPY Key Rotation',
      x: modelPos.x,
      y: modelPos.y,
      width: 62,
      height: 62,
    });

    // 4. SUB-NODO CIRCULAR: MEMORY / EMPRESA ACTIVA
    const memDef = MEMORY_NODES.find((m) => m.id === memoryNodeId) || MEMORY_NODES[0];
    const memPos = customPositions['sub_memory'] || { x: 295, y: 245 };
    list.push({
      key: 'sub_memory',
      nodeId: memDef.id,
      shape: 'circle_memory',
      title: memDef.shortLabel,
      subtitle: 'Window Memory',
      x: memPos.x,
      y: memPos.y,
      width: 62,
      height: 62,
    });

    // 5. SUB-NODOS CIRCULARES: TOOLS (Conectores Google, APIs, MCP y Aplicativos Hitos 1–7)
    const allTools: Array<{ id: string; group: 'inputs' | 'hitos' }> = [
      ...(workflowNodes?.inputs || []).map((id) => ({ id, group: 'inputs' as const })),
      ...(workflowNodes?.hitos || []).map((id) => ({ id, group: 'hitos' as const })),
    ];

    allTools.forEach((item, idx) => {
      const def = getNodeDefById(item.id);
      if (!def) return;
      const key = `tool_${item.group}_${item.id}`;
      const defaultX = 405 + idx * 102;
      const defaultY = idx % 2 === 0 ? 245 : 262;
      const pos = customPositions[key] || { x: defaultX, y: defaultY };
      list.push({
        key,
        nodeId: item.id,
        shape: 'circle_tool',
        title: def.shortLabel,
        subtitle: item.group === 'hitos' ? def.category : 'Tool Connector',
        x: pos.x,
        y: pos.y,
        width: 62,
        height: 62,
        removable: true,
        group: item.group,
      });
    });

    // 6. NODO CONDICIONAL IF (Cuadrado con icono de bifurcación y salidas true / false)
    if (includeIfNode) {
      const ifPos = customPositions['if_router'] || { x: 590, y: 76 };
      list.push({
        key: 'if_router',
        nodeId: 'if_node_router',
        shape: 'if',
        title: 'If',
        subtitle: 'Hallazgos / Alerta',
        x: ifPos.x,
        y: ifPos.y,
        width: 74,
        height: 74,
      });
    }

    // 7. NODOS CUADRADOS DE SALIDA (Acciones finales de entrega y notificación)
    const outputs = workflowNodes?.outputs?.length ? workflowNodes.outputs : ['email_report'];
    outputs.forEach((outId, idx) => {
      const def = getNodeDefById(outId);
      if (!def) return;
      const key = `out_${outId}`;
      const baseX = includeIfNode ? 765 : 610;
      const baseY = outputs.length === 1 ? 76 : 24 + idx * 112;
      const pos = customPositions[key] || { x: baseX, y: baseY };
      list.push({
        key,
        nodeId: outId,
        shape: 'square_output',
        title: def.shortLabel,
        subtitle: idx === 0 ? 'Success · Action' : 'Branch · Action',
        x: pos.x,
        y: pos.y,
        width: 74,
        height: 74,
        removable: outputs.length > 1,
        group: 'outputs',
      });
    });

    return list;
  }, [workflowNodes, agentName, currentModelDef, aiEngine, memoryNodeId, includeIfNode, customPositions]);

  // Calcular los cables curvos Bezier entre los puertos (Círculos ● y Rombos ◆)
  const wires = useMemo(() => {
    const map = new Map<string, VisualNodeInstance>();
    visualNodes.forEach((n) => map.set(n.key, n));

    const triggerNode = map.get('trigger_root');
    const agentNode = map.get('agent_root');
    const ifNode = map.get('if_router');
    const modelNode = map.get('sub_model');
    const memNode = map.get('sub_memory');
    const toolNodes = visualNodes.filter((n) => n.shape === 'circle_tool');
    const outputNodes = visualNodes.filter((n) => n.shape === 'square_output');

    const paths: Array<{
      id: string;
      d: string;
      dashed: boolean;
      color: string;
      label?: string;
      labelX?: number;
      labelY?: number;
    }> = [];

    // Helper para curva horizontal suave (flujo principal de izquierda a derecha)
    const makeHorizontalCurve = (x1: number, y1: number, x2: number, y2: number) => {
      const dx = Math.max(45, Math.abs(x2 - x1) * 0.48);
      return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    };

    // Helper para curva vertical punteada (rombos inferiores del AI Agent -> círculos de sub-nodos)
    const makeSubNodeCurve = (x1: number, y1: number, x2: number, y2: number) => {
      const dy = Math.max(38, Math.abs(y2 - y1) * 0.52);
      return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
    };

    // 1. Trigger ● ──> ● AI Agent
    if (triggerNode && agentNode) {
      const x1 = triggerNode.x + triggerNode.width;
      const y1 = triggerNode.y + triggerNode.height / 2;
      const x2 = agentNode.x;
      const y2 = agentNode.y + agentNode.height / 2;
      paths.push({
        id: 'wire_trigger_agent',
        d: makeHorizontalCurve(x1, y1, x2, y2),
        dashed: false,
        color: '#94a3b8',
      });
    }

    // 2. AI Agent ● ──> ● If Node (o directo a Outputs)
    if (agentNode && ifNode) {
      const x1 = agentNode.x + agentNode.width;
      const y1 = agentNode.y + agentNode.height / 2;
      const x2 = ifNode.x;
      const y2 = ifNode.y + ifNode.height / 2;
      paths.push({
        id: 'wire_agent_if',
        d: makeHorizontalCurve(x1, y1, x2, y2),
        dashed: false,
        color: '#94a3b8',
      });

      // If (true / false) ● ──> ● Output Square Nodes
      outputNodes.forEach((outNode, idx) => {
        const isTrueBranch = idx === 0;
        const x1Port = ifNode.x + ifNode.width;
        const y1Port = ifNode.y + (isTrueBranch ? 24 : 52);
        const x2Port = outNode.x;
        const y2Port = outNode.y + outNode.height / 2;
        paths.push({
          id: `wire_if_out_${outNode.key}`,
          d: makeHorizontalCurve(x1Port, y1Port, x2Port, y2Port),
          dashed: false,
          color: isTrueBranch ? '#10b981' : '#94a3b8',
          label: isTrueBranch ? 'true' : 'false',
          labelX: x1Port + 22,
          labelY: y1Port - 5,
        });
      });
    } else if (agentNode) {
      outputNodes.forEach((outNode) => {
        const x1 = agentNode.x + agentNode.width;
        const y1 = agentNode.y + agentNode.height / 2;
        const x2 = outNode.x;
        const y2 = outNode.y + outNode.height / 2;
        paths.push({
          id: `wire_agent_out_${outNode.key}`,
          d: makeHorizontalCurve(x1, y1, x2, y2),
          dashed: false,
          color: '#94a3b8',
        });
      });
    }

    // 3. AI Agent ◆ (Chat Model *) ── - - ──> ◆ Sub-Nodo Circular Modelo
    if (agentNode && modelNode) {
      const x1 = agentNode.x + 44;
      const y1 = agentNode.y + agentNode.height;
      const x2 = modelNode.x + modelNode.width / 2;
      const y2 = modelNode.y;
      paths.push({
        id: 'wire_sub_model',
        d: makeSubNodeCurve(x1, y1, x2, y2),
        dashed: true,
        color: '#818cf8',
      });
    }

    // 4. AI Agent ◆ (Memory) ── - - ──> ◆ Sub-Nodo Circular Memoria
    if (agentNode && memNode) {
      const x1 = agentNode.x + 114;
      const y1 = agentNode.y + agentNode.height;
      const x2 = memNode.x + memNode.width / 2;
      const y2 = memNode.y;
      paths.push({
        id: 'wire_sub_memory',
        d: makeSubNodeCurve(x1, y1, x2, y2),
        dashed: true,
        color: '#818cf8',
      });
    }

    // 5. AI Agent ◆ (Tool +) ── - - ──> ◆ Sub-Nodos Circulares de Conectores y Hitos
    if (agentNode) {
      const x1 = agentNode.x + 184;
      const y1 = agentNode.y + agentNode.height;
      toolNodes.forEach((tNode) => {
        const x2 = tNode.x + tNode.width / 2;
        const y2 = tNode.y;
        paths.push({
          id: `wire_sub_tool_${tNode.key}`,
          d: makeSubNodeCurve(x1, y1, x2, y2),
          dashed: true,
          color: '#818cf8',
        });
      });
    }

    // 6. Cables personalizados adicionales creados con el mouse por el usuario
    const customEdges = workflowNodes?.canvasLayout?.edges || [];
    customEdges.forEach((edge) => {
      const fromNode = map.get(edge.from);
      const toNode = map.get(edge.to);
      if (!fromNode || !toNode) return;
      const x1 = fromNode.x + fromNode.width;
      const y1 = fromNode.y + fromNode.height / 2;
      const x2 = toNode.x;
      const y2 = toNode.y + toNode.height / 2;
      paths.push({
        id: edge.id,
        d: makeHorizontalCurve(x1, y1, x2, y2),
        dashed: edge.kind === 'sub',
        color: '#14b8a6',
      });
    });

    return paths;
  }, [visualNodes, workflowNodes?.canvasLayout?.edges]);

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

  // Agregar o quitar un conector/herramienta/hito/salida o cambiar motor IA
  const toggleOrAddCatalogNode = (
    group: 'trigger' | 'inputs' | 'hitos' | 'outputs',
    nodeId: string,
    dropPos?: { x: number; y: number },
  ) => {
    if (!onChange || readOnly) return;

    if (group === 'trigger') {
      onChange({
        ...workflowNodes,
        trigger: nodeId,
      });
      return;
    }

    const currentList = workflowNodes[group] || [];
    const exists = currentList.includes(nodeId);
    const nextList = exists
      ? currentList.filter((id) => id !== nodeId)
      : [...currentList, nodeId];

    const key = group === 'outputs' ? `out_${nodeId}` : `tool_${group}_${nodeId}`;
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

  // Cambiar Motor IA (WAPPY Rotación de Claves vs Google Antigravity + MCP) y Modelo
  const handleSelectAiEngineModel = (engine: 'wappy' | 'antigravity', model: string) => {
    if (!onChange || readOnly) return;
    const nextInputs = [...(workflowNodes.inputs || [])];
    if (engine === 'antigravity' && !nextInputs.includes('google_antigravity')) {
      nextInputs.push('google_antigravity');
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
          toggleOrAddCatalogNode('trigger', parsed.nodeId, dropPos);
        } else {
          const arr = workflowNodes[parsed.group as 'inputs' | 'hitos' | 'outputs'] || [];
          if (!arr.includes(parsed.nodeId)) {
            toggleOrAddCatalogNode(parsed.group, parsed.nodeId, dropPos);
          } else if (dropPos) {
            const key =
              parsed.group === 'outputs' ? `out_${parsed.nodeId}` : `tool_${parsed.group}_${parsed.nodeId}`;
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
          {/* Pestañas de categorías + Botón Autogenerar Prompt */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'connectors', label: '🔌 Conectores & Herramientas', badge: (workflowNodes.inputs || []).length },
                { id: 'ai_engine', label: '🧠 Motor IA & Modelo (WAPPY / Antigravity)', badge: aiEngine === 'antigravity' ? 'MCP' : aiModel.replace('gemini-', '') },
                { id: 'hitos', label: '🛡️ 7 Hitos & Apps Somos SST', badge: (workflowNodes.hitos || []).length },
                { id: 'triggers', label: '⚡ Disparador (Trigger)', badge: 1 },
                { id: 'outputs', label: '📤 Salidas & Acciones', badge: (workflowNodes.outputs || []).length },
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

          {/* Instrucción rápida de uso del lienzo interactivo */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2 px-1">
            <span>
              💡 <strong>Arrastra cualquier cuadrito al lienzo punteado</strong> (o haz clic sobre él) para conectarlo al flujo. Dentro del lienzo puedes mover los nodos y estirar los cables desde los puertos.
            </span>
          </div>

          {/* CUADRITOS ARRASTRABLES CON LOGOS SVG ORIGINALES */}
          {paletteTab === 'ai_engine' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {AI_ENGINE_MODELS.map((m) => {
                const isSelected =
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
          ) : (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5">
              {(paletteTab === 'connectors'
                ? INPUT_CONNECTOR_NODES
                : paletteTab === 'hitos'
                  ? HITO_APP_NODES
                  : paletteTab === 'triggers'
                    ? TRIGGER_NODES
                    : OUTPUT_ACTION_NODES
              ).map((node) => {
                const groupKey =
                  paletteTab === 'connectors'
                    ? 'inputs'
                    : paletteTab === 'hitos'
                      ? 'hitos'
                      : paletteTab === 'triggers'
                        ? 'trigger'
                        : 'outputs';
                const isSelected =
                  groupKey === 'trigger'
                    ? workflowNodes.trigger === node.id
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
                          : groupKey === 'inputs' || groupKey === 'hitos'
                            ? 'rounded-2xl'
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
                  onClick={handleResetLayout}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1"
                  title="Auto-organizar posiciones de los nodos"
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
          {/* ─── CAPA SVG DE CABLES CURVOS Y FLECHAS (S-CURVES & DASHED SUB-WIRES) ─── */}
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
              <g key={w.id}>
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

          {/* ─── CAPA DE NODOS CON LAS 5 FIGURAS DEL FLUJO WAPPY ─── */}
          {visualNodes.map((node) => {
            // 1. FIGURA TRIGGER NODE (Forma en "D" con rayo ⚡ a la izquierda y puerto circular derecho)
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
                  <div className="w-full h-full rounded-l-[28px] rounded-r-[12px] bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 group-hover/node:border-orange-500 shadow-md flex items-center justify-center transition-colors">
                    {renderOfficialNodeSvg(node.nodeId, 'w-8 h-8')}
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

            // 2. FIGURA ROOT AI AGENT NODE (Rectángulo ancho central + 3 Rombos inferiores ◆)
            if (node.shape === 'agent') {
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
                  <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 group-hover/node:border-purple-500 shadow-md px-3.5 flex items-center gap-3 transition-colors">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-purple-950/80 text-white dark:text-[#C7F303] flex items-center justify-center shrink-0 shadow-sm">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                          AI Agent
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[8.5px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          Tools Agent
                        </span>
                      </div>

                      {/* Selector directo de Agente Especialista dentro del nodo */}
                      {!readOnly && agents.length > 0 && onSelectAgent ? (
                        <select
                          value={agentId || ''}
                          onPointerDown={(e) => e.stopPropagation()}
                          onChange={(e) => onSelectAgent(e.target.value)}
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
                    title="Arrastra para conectar la salida del Agente"
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
                    style={{ left: 38 }}
                    className="absolute -bottom-2 flex flex-col items-center cursor-crosshair"
                  >
                    <div className="w-3 h-3 rotate-45 bg-indigo-500 border-2 border-white dark:border-slate-900 shadow-sm" />
                    <span className="mt-1 text-[8.5px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      Chat Model <span className="text-rose-500">*</span>
                    </span>
                  </div>

                  {/* Rombo 2: Memory */}
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
                    style={{ left: 108 }}
                    className="absolute -bottom-2 flex flex-col items-center cursor-crosshair"
                  >
                    <div className="w-3 h-3 rotate-45 bg-indigo-500 border-2 border-white dark:border-slate-900 shadow-sm" />
                    <span className="mt-1 text-[8.5px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      Memory
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
                    title="Conectar más herramientas y aplicativos de los 7 Hitos"
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

            // 4. FIGURA NODOS CUADRADOS DE SALIDA (Con botón [+])
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

                  {/* Extensión derecha: ● ── [+] */}
                  <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <div className="w-3 h-[1.5px] bg-slate-300 dark:bg-slate-600" />
                    {!readOnly && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setPaletteTab('outputs')}
                        className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 hover:text-purple-600 hover:border-purple-400 flex items-center justify-center text-[10px] font-bold shadow-xs"
                        title="Añadir otra acción de salida"
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

            // 5. FIGURA SUB-NODOS CIRCULARES (Chat Model *, Memory y Tools/Hitos con Rombo superior ◆)
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
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-indigo-500 border-2 border-white dark:border-slate-900 shadow-xs" />

                {/* Círculo perfecto de Sub-Nodo */}
                <div
                  onClick={() => {
                    if (readOnly) return;
                    if (isModelCircle) {
                      setPaletteTab('ai_engine');
                    }
                  }}
                  className={`w-full h-full rounded-full bg-white dark:bg-slate-800 border-2 shadow-md flex items-center justify-center relative transition-transform group-hover/node:scale-105 ${
                    isModelCircle
                      ? aiEngine === 'antigravity'
                        ? 'border-orange-500 ring-2 ring-orange-500/20'
                        : 'border-indigo-500 ring-2 ring-indigo-500/20'
                      : isMemoryCircle
                        ? 'border-pink-400 dark:border-pink-700'
                        : 'border-slate-300 dark:border-slate-600 hover:border-purple-500'
                  }`}
                >
                  {renderOfficialNodeSvg(node.nodeId, 'w-7 h-7')}

                  {/* Botón para quitar herramienta/hito */}
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
                        } else {
                          handleSelectAiEngineModel('wappy', 'gemini-3.6-flash');
                        }
                      }}
                      className="mt-1 px-2 py-0.5 rounded-full text-[8.5px] font-extrabold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition"
                      title="Alternar entre WAPPY Cloud (Rotación de Claves) y Google Antigravity + MCP"
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
