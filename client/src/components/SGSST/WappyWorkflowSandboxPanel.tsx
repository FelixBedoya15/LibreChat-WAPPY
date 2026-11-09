import React, { useState, useMemo } from 'react';
import {
  Play,
  Copy,
  Check,
  RotateCcw,
  X,
  ShieldCheck,
  Sparkles,
  Clock,
  Cpu,
  Building2,
  GitFork,
  Mail,
  Bell,
  Layers,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Code2,
  Lock,
  Loader2,
  Zap,
  Database,
  ArrowRight,
  ClipboardCheck,
} from 'lucide-react';
import ExpandableButton from '~/components/Common/ExpandableButton';
import { getRotatedAgentAvatar } from './workflowNodesCatalog';

export interface SandboxNodeTraceStep {
  nodeKey?: string;
  nodeId: string;
  title: string;
  category?: string;
  stage?: string;
  status: 'ok' | 'simulated_blocked' | 'skipped' | 'warning' | 'error' | string;
  durationMs: number;
  recordsCount?: number;
  surgicalFields?: string[];
  inputContext?: string;
  inputSummary?: string;
  outputPreview?: string;
  details?: string;
  sourceNodeKey?: string;
  sourceNodeTitle?: string;
  inputItems?: Array<Record<string, any>>;
  outputItems?: Array<Record<string, any>>;
  logs?: Array<{
    timestamp?: string;
    level: 'info' | 'success' | 'warn' | 'error';
    message: string;
    detail?: string;
  }>;
  error?: string | null;
}

export interface SandboxAgentOutput {
  agentKey?: string;
  agentId?: string;
  agentName: string;
  roleLabel?: string;
  avatarName?: string;
  avatarSrc?: string;
  aiEngine?: string;
  modelUsed?: string;
  durationMs?: number;
  promptUsed?: string;
  responseMarkdown: string;
  responseHtml?: string;
}

export interface SandboxEmailPreview {
  blocked?: boolean;
  from?: string;
  recipients: string[];
  subject: string;
  htmlBody?: string;
  textBody?: string;
  reason?: string;
}

export interface SandboxNotificationPreview {
  blocked?: boolean;
  channel?: string;
  title: string;
  message: string;
  tenshiVoiceSummary?: string;
}

export interface SandboxHitoImpactPreview {
  nodeId: string;
  title: string;
  operationMode?: string;
  blocked?: boolean;
  summary: string;
}

export interface SandboxSimulationResponse {
  success?: boolean;
  sandboxMode?: boolean;
  outputsBlocked?: boolean;
  executedAt?: string;
  totalDurationMs: number;
  aiEngine?: string;
  modelUsed: string;
  company?: {
    id?: string;
    name?: string;
    nit?: string;
    sector?: string;
    workersCount?: number;
  };
  ifEvaluation?: {
    included?: boolean;
    conditionMet?: boolean;
    branchTaken: 'SÍ' | 'NO' | string;
    reason?: string;
  };
  finalResponseMarkdown: string;
  finalResponseHtml: string;
  agentOutputs: SandboxAgentOutput[];
  nodeTrace: SandboxNodeTraceStep[];
  interceptedOutputs?: {
    emailsSentCount?: number;
    notificationsSentCount?: number;
    hitosModifiedCount?: number;
    emailPreview?: SandboxEmailPreview;
    notificationPreview?: SandboxNotificationPreview;
    hitoImpacts?: SandboxHitoImpactPreview[];
    acpmPreview?: {
      blocked?: boolean;
      tasksWouldCreate?: number;
      summary?: string;
    };
  };
  emailPreview?: SandboxEmailPreview;
  notificationPreview?: SandboxNotificationPreview;
  hitoImpacts?: SandboxHitoImpactPreview[];
}

export interface WappyWorkflowSandboxPanelProps {
  open: boolean;
  running: boolean;
  result: SandboxSimulationResponse | null;
  error: string | null;
  mockTriggerInput: string;
  onChangeMockTriggerInput: (val: string) => void;
  onRunSimulation: () => void;
  onClearSimulation: () => void;
  onClose: () => void;
  activeStepNodeId: string | null;
  onSelectStepNode: (nodeIdOrKey: string | null) => void;
  emailsStr?: string;
  liveSteps?: SandboxNodeTraceStep[];
  totalPlannedSteps?: number;
  activeStepTitle?: string;
}

export const QUICK_MOCK_SCENARIOS: Array<{
  id: string;
  label: string;
  shortBadge: string;
  mockInput: string;
}> = [
  {
    id: 'live_company',
    label: '🟢 Probar solo con los Datos Reales Actuales de mi Empresa (En Vivo)',
    shortBadge: 'En Vivo (BD Real)',
    mockInput: '',
  },
  {
    id: 'emo_alturas',
    label: '⚠️ Simular Trabajador con Examen Médico (EMO) y Curso de Alturas Próximo a Vencer',
    shortBadge: 'EMO + Alturas',
    mockInput:
      '[SIMULACIÓN DISPARADOR SG-SST] Trabajador: Carlos Andrés Mejía Soto (CC 1.037.614.892) · Cargo: Técnico Liniero / Trabajo en Alturas · Alerta detectada: Examen Médico Ocupacional Periódico (EMO) vence en 4 días y Certificado de Reentrenamiento en Trabajo Seguro en Alturas (Res. 4272 de 2021) vencido hace 2 días. Validar restricciones y generar plan de acción inmediato antes de autorizar ingreso a poste o andamio.',
  },
  {
    id: 'qr_peligro_critico',
    label: '🚨 Simular Reporte QR de Peligro Crítico / Acto Inseguro en Planta',
    shortBadge: 'Reporte QR Crítico',
    mockInput:
      '[SIMULACIÓN REPORTE QR EN PLANTA] Fecha: Hoy · Área: Bodega Principal y Zona de Soldadura · Severidad: CRÍTICA · Reportante: Operario de Turno · Descripción: Se evidencia cableado trifásico 220V con aislamiento roto sobre piso húmedo junto a estantería metálica y operario realizando corte con pulidora sin careta facial ni mampara ignífuga. Riesgo inminente de electrocución y proyección de partículas.',
  },
  {
    id: 'correo_incapacidad',
    label: '📩 Simular Correo Entrante con Incapacidad / Restricción Médica Laboral',
    shortBadge: 'Incapacidad / Restricción',
    mockInput:
      '[SIMULACIÓN CORREO ENTRANTE EPS/ARL] De: medicina.laboral@eps-salud.co · Asunto: Concepto de Rehabilitación y Restricciones Médicas — Laura Valentina Gómez (CC 1.018.442.310) · Contenido: Se emite incapacidad temporal por 15 días por lumbago mecánico agudo (CIE-10 M54.5) y restricción médica laboral por 60 días: prohibido levantamiento de cargas superiores a 5 kg, movimientos repetitivos de flexo-extensión de tronco y bipedestación prolongada mayor a 2 horas continuas.',
  },
  {
    id: 'sin_novedades_no',
    label: '✅ Simular Escenario Sin Novedades (Para probar la Rama NO de la Condición Si/No)',
    shortBadge: 'Rama NO (Sin Hallazgos)',
    mockInput:
      '[SIMULACIÓN AUDITORÍA SIN HALLAZGOS CRÍTICOS] Estado operativo 100% en regla: 0 exámenes médicos vencidos, 0 cursos de alturas vencidos, 0 accidentes o incidentes ATEL reportados en el periodo, 0 actos o condiciones inseguras pendientes. Todos los controles del SG-SST se encuentran al día (Probar evaluación por la Rama NO de la Condición Si/No).',
  },
];

function formatSimpleMarkdownToHtml(md: string): string {
  const safe = String(md || '').trim();
  if (!safe) return '<p>Sin contenido generado.</p>';
  if (safe.startsWith('<') && (safe.includes('<div') || safe.includes('<p') || safe.includes('<table') || safe.includes('<h'))) {
    return safe;
  }
  const escaped = safe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split('\n');
  const htmlLines: string[] = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      continue;
    }
    if (line.startsWith('### ')) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      htmlLines.push(
        `<h3 style="font-size:15px;font-weight:800;margin:14px 0 6px;color:#0f766e;">${line.slice(4)}</h3>`,
      );
    } else if (line.startsWith('## ')) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      htmlLines.push(
        `<h2 style="font-size:17px;font-weight:800;margin:16px 0 8px;color:#0f172a;">${line.slice(3)}</h2>`,
      );
    } else if (line.startsWith('# ')) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      htmlLines.push(
        `<h1 style="font-size:19px;font-weight:900;margin:16px 0 8px;color:#0f172a;">${line.slice(2)}</h1>`,
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        htmlLines.push('<ul style="padding-left:18px;margin:8px 0;">');
        inList = true;
      }
      const itemText = line
        .slice(2)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
      htmlLines.push(`<li style="margin-bottom:4px;">${itemText}</li>`);
    } else {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      const formatted = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
      htmlLines.push(`<p style="margin:6px 0;line-height:1.55;">${formatted}</p>`);
    }
  }
  if (inList) {
    htmlLines.push('</ul>');
  }
  return htmlLines.join('\n');
}

export default function WappyWorkflowSandboxPanel({
  open,
  running,
  result,
  error,
  mockTriggerInput,
  onChangeMockTriggerInput,
  onRunSimulation,
  onClearSimulation,
  onClose,
  activeStepNodeId,
  onSelectStepNode,
  emailsStr = '',
  liveSteps = [],
  totalPlannedSteps = 0,
  activeStepTitle = '',
}: WappyWorkflowSandboxPanelProps) {
  const [activeTab, setActiveTab] = useState<'response' | 'trace' | 'outputs' | 'mock'>('response');
  const [showRawMarkdown, setShowRawMarkdown] = useState<boolean>(false);
  const [showCustomMockBox, setShowCustomMockBox] = useState<boolean>(false);
  const [selectedAgentIdx, setSelectedAgentIdx] = useState<number>(-1); // -1 = Consolidada
  const [selectedTraceIdx, setSelectedTraceIdx] = useState<number>(0);
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);

  const activeScenarioId = useMemo(() => {
    const trimmed = (mockTriggerInput || '').trim();
    const matched = QUICK_MOCK_SCENARIOS.find((s) => s.mockInput.trim() === trimmed);
    return matched ? matched.id : 'custom';
  }, [mockTriggerInput]);

  const nodeTrace = useMemo<SandboxNodeTraceStep[]>(() => {
    if (!result) return [];
    const raw = Array.isArray(result.nodeTrace)
      ? result.nodeTrace
      : Array.isArray((result as any).trace)
        ? (result as any).trace
        : [];
    return raw;
  }, [result]);

  const agentOutputs = useMemo<SandboxAgentOutput[]>(() => {
    if (!result) return [];
    const raw = Array.isArray(result.agentOutputs)
      ? result.agentOutputs
      : Array.isArray((result as any).agents)
        ? (result as any).agents
        : [];
    return raw;
  }, [result]);

  const finalMarkdown = useMemo(() => {
    if (!result) return '';
    return (
      result.finalResponseMarkdown?.trim() ||
      (result as any).finalResponse?.trim() ||
      (result as any).response?.trim() ||
      agentOutputs[agentOutputs.length - 1]?.responseMarkdown?.trim() ||
      ''
    );
  }, [result, agentOutputs]);

  const finalHtml = useMemo(() => {
    if (!result) return '';
    if (result.finalResponseHtml?.trim()) {
      return result.finalResponseHtml;
    }
    return formatSimpleMarkdownToHtml(finalMarkdown);
  }, [result, finalMarkdown]);

  const emailPreview = useMemo<SandboxEmailPreview>(() => {
    const raw = result?.interceptedOutputs?.emailPreview || result?.emailPreview;
    const fallbackRecipients = emailsStr
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    return {
      blocked: true,
      from: raw?.from || 'notificaciones@wappy.club',
      recipients:
        Array.isArray(raw?.recipients) && raw!.recipients.length > 0
          ? raw!.recipients
          : fallbackRecipients.length > 0
            ? fallbackRecipients
            : ['sst@tuempresa.com (Destinatario configurado)'],
      subject:
        raw?.subject ||
        `[MODO DESARROLLO · NO ENVIADO] Bitácora SG-SST — ${result?.company?.name || 'Empresa Activa'}`,
      htmlBody: raw?.htmlBody || finalHtml,
      textBody: raw?.textBody || finalMarkdown,
      reason:
        raw?.reason ||
        'Interceptado por el Escenario de Desarrollo (Modo Sandbox). Cero correos externos despachados.',
    };
  }, [result, emailsStr, finalHtml, finalMarkdown]);

  const notificationPreview = useMemo<SandboxNotificationPreview>(() => {
    const raw = result?.interceptedOutputs?.notificationPreview || result?.notificationPreview;
    return {
      blocked: true,
      channel: raw?.channel || 'Campanita WAPPY + Chat de Tenshi IA',
      title:
        raw?.title ||
        `🛡️ Reporte Automatizado SG-SST (${result?.company?.name || 'Empresa Activa'})`,
      message:
        raw?.message ||
        (finalMarkdown
          ? finalMarkdown.slice(0, 420) + (finalMarkdown.length > 420 ? '…' : '')
          : 'Notificación interna interceptada en Modo Desarrollo.'),
      tenshiVoiceSummary:
        raw?.tenshiVoiceSummary ||
        'Hola equipo SST, ejecuté la simulación del flujo en el Escenario de Desarrollo sin disparar alertas externas.',
    };
  }, [result, finalMarkdown]);

  const hitoImpacts = useMemo<SandboxHitoImpactPreview[]>(() => {
    const raw = result?.interceptedOutputs?.hitoImpacts || result?.hitoImpacts;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return nodeTrace
      .filter((step) => step.category === 'hito' || step.stage === 'hitos' || step.nodeId?.startsWith('hito'))
      .map((step) => ({
        nodeId: step.nodeId,
        title: step.title,
        operationMode: 'Simulación sin escritura en BD',
        blocked: true,
        summary:
          step.outputPreview ||
          'Actualización de Hito SST simulada en memoria (sin alterar registros productivos).',
      }));
  }, [result, nodeTrace]);

  const currentTraceStep = useMemo<SandboxNodeTraceStep | null>(() => {
    if (nodeTrace.length === 0) return null;
    const safeIdx = Math.min(Math.max(0, selectedTraceIdx), nodeTrace.length - 1);
    return nodeTrace[safeIdx] || nodeTrace[0];
  }, [nodeTrace, selectedTraceIdx]);

  const handleCopyFinalResponse = () => {
    if (!finalMarkdown) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(finalMarkdown).catch(() => {});
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2500);
    }
  };

  if (!open) return null;

  const totalSec = result?.totalDurationMs
    ? (result.totalDurationMs / 1000).toFixed(1)
    : '0.0';
  const branchTaken = result?.ifEvaluation?.branchTaken || 'SÍ';

  return (
    <div
      id="wappy-workflow-sandbox-panel"
      className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/70 dark:border-[#C7F303]/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl transition-all min-w-0 max-w-full"
    >
      {/* Luces ambientales WAPPY */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-teal-500/10 blur-3xl" />

      {/* ─── 1. CABECERA EJECUTIVA DEL ESCENARIO DE DESARROLLO ─── */}
      <div className="relative z-10 p-4 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-700 dark:text-[#C7F303] shrink-0 shadow-xs">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-[#C7F303] dark:to-teal-300 bg-clip-text text-transparent">
                  🧪 ESCENARIO DE DESARROLLO & SIMULACIÓN EN VIVO (MODO SANDBOX)
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[10px] font-extrabold bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-[#C7F303]">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  🛡️ SALIDAS BLOQUEADAS: 0 correos enviados · 0 alertas disparadas
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Prueba tu flujo completo con datos reales de tu empresa o escenarios simulados y verifica la respuesta exacta del Agente IA sin enviar correos ni notificaciones externas.
              </p>
            </div>
          </div>

          {/* Botonera WAPPY (ExpandableButton sin alwaysExpanded) */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <ExpandableButton
              size="sm"
              variant="emerald"
              disabled={running}
              icon={
                running ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )
              }
              label={running ? 'Ejecutando Simulación...' : 'Dar Play al Flujo (Sin Enviar Salidas)'}
              title="Dar Play al Flujo en Modo Desarrollo (Sin Enviar Salidas)"
              onClick={() => {
                setActiveTab('response');
                onRunSimulation();
              }}
            />

            {result && (
              <ExpandableButton
                size="sm"
                variant="teal"
                icon={
                  copiedResponse ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )
                }
                label={copiedResponse ? '¡Respuesta Copiada!' : 'Copiar Respuesta Final'}
                title="Copiar Respuesta Final al portapapeles"
                onClick={handleCopyFinalResponse}
              />
            )}

            {(result || error || mockTriggerInput) && (
              <ExpandableButton
                size="sm"
                variant="amber"
                disabled={running}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                label="Limpiar Simulación"
                title="Limpiar resultado de la simulación actual"
                onClick={() => {
                  setSelectedAgentIdx(-1);
                  setSelectedTraceIdx(0);
                  onClearSimulation();
                }}
              />
            )}

            <ExpandableButton
              size="sm"
              variant="neutral"
              icon={<X className="w-3.5 h-3.5" />}
              label="Cerrar Escenario"
              title="Cerrar Escenario de Desarrollo"
              onClick={onClose}
            />
          </div>
        </div>

        {/* Resumen de métricas cuando hay resultado */}
        {result && (
          <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              ⏱️ Tiempo total: <strong>{totalSec}s</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
              <Cpu className="w-3.5 h-3.5" />
              🧠 Motor / Modelo: <strong>{result.modelUsed || 'gemini-3.6-flash'}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30">
              <Building2 className="w-3.5 h-3.5" />
              🏢 Empresa: <strong>{result.company?.name || 'Empresa Activa'}</strong>
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${
                String(branchTaken).toUpperCase().includes('NO')
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              🔀 Condición Si/No: <strong>Rama {branchTaken}</strong>
            </span>
          </div>
        )}
      </div>

      {/* ─── 2. BARRA DE ESCENARIOS RÁPIDOS DE PRUEBA (INPUT MOCK EN 1 CLIC) ─── */}
      <div className="relative z-10 px-4 py-3 bg-slate-50/90 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Escenarios Rápidos de Prueba (Elige un disparador en 1 clic antes de pulsar ▶ Dar Play):
          </span>
          <button
            type="button"
            onClick={() => setShowCustomMockBox((v) => !v)}
            className="text-[10.5px] font-extrabold text-purple-600 dark:text-[#C7F303] hover:underline flex items-center gap-1"
          >
            {showCustomMockBox ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Ocultar entrada personalizada
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Personalizar dato de entrada (Mock)
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_MOCK_SCENARIOS.map((sc) => {
            const isSelected = activeScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  onChangeMockTriggerInput(sc.mockInput);
                  if (sc.id !== 'live_company') {
                    setShowCustomMockBox(true);
                  }
                }}
                className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold transition text-left border ${
                  isSelected
                    ? 'bg-emerald-500/15 dark:bg-[#C7F303]/20 border-emerald-500 dark:border-[#C7F303] text-emerald-900 dark:text-[#C7F303] shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                }`}
              >
                {sc.label}
              </button>
            );
          })}
        </div>

        {showCustomMockBox && (
          <div className="mt-2.5">
            <textarea
              rows={2}
              value={mockTriggerInput}
              onChange={(e) => onChangeMockTriggerInput(e.target.value)}
              placeholder="Escribe aquí un evento simulado (ej. reporte QR, correo entrante, alerta de vencimiento) o déjalo vacío para probar solo con los datos reales actuales de tu empresa..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        )}
      </div>

      {/* ─── 3. BARRA DE LAS 4 PESTAÑAS DEL ESCENARIO DE DESARROLLO ─── */}
      <div className="relative z-10 px-4 pt-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
        {[
          {
            id: 'response' as const,
            label: '✨ 1. Respuesta Final del Flujo (Vista Previa)',
            badge: agentOutputs.length > 1 ? `${agentOutputs.length} Agentes IA` : 'Consolidada',
          },
          {
            id: 'trace' as const,
            label: `🔗 2. Traza Nodo por Nodo (${nodeTrace.length} pasos)`,
            badge: `${nodeTrace.length}`,
          },
          {
            id: 'outputs' as const,
            label: '🛡️ 3. Salidas Interceptadas (Sin Enviar)',
            badge: '0 Enviadas',
          },
          {
            id: 'mock' as const,
            label: '🧪 4. Entrada de Prueba (Mock)',
            badge: mockTriggerInput.trim() ? 'Mock Activo' : 'BD en Vivo',
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-t-xl text-xs font-extrabold transition flex items-center gap-2 border-b-2 ${
                isActive
                  ? 'border-emerald-500 dark:border-[#C7F303] text-emerald-700 dark:text-[#C7F303] bg-emerald-500/10 dark:bg-[#C7F303]/10'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-lg text-[9.5px] font-black ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-[#C7F303]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── 4. CUERPO DE LAS 4 PESTAÑAS ─── */}
      <div className="relative z-10 p-4">
        {/* Estado de error */}
        {error && (
          <div className="mb-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div>
                <div className="font-extrabold">Error al ejecutar la simulación en el Escenario de Desarrollo</div>
                <p className="mt-0.5 text-[11px] opacity-90">{error}</p>
              </div>
            </div>
            <ExpandableButton
              size="sm"
              variant="emerald"
              icon={<Play className="w-3.5 h-3.5" />}
              label="Reintentar Simulación"
              onClick={onRunSimulation}
            />
          </div>
        )}

        {/* Estado ejecutando en vivo paso por paso */}
        {running && (
          <div className="py-6 px-4 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/5 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-[#C7F303]">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {activeStepTitle
                  ? `⏳ Ejecutando Paso #${liveSteps.length + 1}${totalPlannedSteps ? ` de ${totalPlannedSteps}` : ''}: ${activeStepTitle}...`
                  : 'Ejecutando Flujo Consecutivo en Escenario de Desarrollo (Modo Sandbox)...'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mt-1">
                Avanzando nodo por nodo en el orden exacto de tus conexiones ({liveSteps.length}
                {totalPlannedSteps ? ` / ${totalPlannedSteps}` : ''} pasos completados). Nodos desconectados ignorados y salidas bloqueadas.
              </p>
            </div>
            {liveSteps.length > 0 && (
              <div className="w-full max-w-2xl mt-2 flex flex-wrap items-center justify-center gap-1.5">
                {liveSteps.map((st, idx) => (
                  <span
                    key={`${st.nodeKey || st.nodeId}_${idx}`}
                    className={`px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold flex items-center gap-1 border ${
                      st.status === 'simulated_blocked'
                        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-800 dark:text-[#C7F303] border-emerald-500/30'
                    }`}
                  >
                    <span>
                      {st.status === 'simulated_blocked' ? '🛡️' : '✓'} Paso #{idx + 1}: {st.title}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Estado inicial sin probar aún */}
        {!running && !result && !error && activeTab !== 'mock' && (
          <div className="py-8 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-[#C7F303]">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Listo para probar tu flujo sin enviar correos ni notificaciones
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mt-1">
                Selecciona arriba un escenario rápido (o usa los datos reales en vivo de tu empresa) y pulsa el botón <strong>▶ Dar Play al Flujo</strong> para ver la respuesta exacta y la traza nodo por nodo.
              </p>
            </div>
            <ExpandableButton
              size="md"
              variant="emerald"
              icon={<Play className="w-4 h-4 fill-current" />}
              label="Dar Play al Flujo (Sin Enviar Salidas)"
              onClick={onRunSimulation}
            />
          </div>
        )}

        {/* ─── PESTAÑA 1: RESPUESTA FINAL DEL FLUJO (VISTA PREVIA) ─── */}
        {!running && result && activeTab === 'response' && (
          <div className="space-y-3">
            {/* Banner superior obligatorio de confirmación */}
            <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#C7F303] shrink-0" />
                ✅ Esta es la respuesta exacta que producirá tu flujo al final. Ningún correo ni notificación externa fue enviado.
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowRawMarkdown((v) => !v)}
                  className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800 border border-emerald-500/30 text-[10.5px] font-extrabold text-emerald-800 dark:text-[#C7F303] flex items-center gap-1 hover:bg-white transition"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  {showRawMarkdown ? 'Ver Vista Formateada' : 'Ver Markdown Puro'}
                </button>
              </div>
            </div>

            {/* Selector / Tarjetas de Agentes IA cuando hay 1 o múltiples Agentes IA en el flujo */}
            {agentOutputs.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  {agentOutputs.length > 1
                    ? `Orquestación Multi-Agente IA (${agentOutputs.length} Agentes ejecutados en cadena):`
                    : 'Agente IA Ejecutado en la Simulación:'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {agentOutputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSelectedAgentIdx(-1)}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                        selectedAgentIdx === -1
                          ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/30'
                          : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-700 dark:text-[#C7F303]">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          Respuesta Final Consolidada
                        </div>
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-[#C7F303]">
                          Dictamen unificado de los {agentOutputs.length} Agentes IA
                        </div>
                      </div>
                    </button>
                  )}

                  {agentOutputs.map((ag, idx) => {
                    const avatarInfo = getRotatedAgentAvatar(idx, ag.avatarSrc);
                    const isSelected =
                      agentOutputs.length === 1 ? true : selectedAgentIdx === idx;
                    return (
                      <button
                        key={ag.agentKey || `ag_${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedAgentIdx(idx);
                          if (ag.agentKey) {
                            onSelectStepNode(ag.agentKey);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                          isSelected
                            ? 'bg-purple-500/10 border-purple-500 ring-1 ring-purple-500/30'
                            : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-slate-900 dark:to-purple-950/90 border border-emerald-200 dark:border-purple-800 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={ag.avatarSrc || avatarInfo.src}
                            alt={ag.avatarName || avatarInfo.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/assets/tenshi.png';
                            }}
                            className="w-10 h-10 object-contain drop-shadow-sm"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                              {ag.agentName || `Agente IA #${idx + 1}`}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-500/15 text-purple-700 dark:text-purple-300 shrink-0">
                              {ag.durationMs ? `${(ag.durationMs / 1000).toFixed(1)}s` : `#${idx + 1}`}
                            </span>
                          </div>
                          <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 truncate">
                            {ag.roleLabel || avatarInfo.roleHint} · {ag.modelUsed || result.modelUsed}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Visor de la Respuesta (Consolidada o del Agente seleccionado) */}
            {(() => {
              const selectedAgent =
                selectedAgentIdx >= 0 && agentOutputs[selectedAgentIdx]
                  ? agentOutputs[selectedAgentIdx]
                  : null;
              const activeMarkdown = selectedAgent
                ? selectedAgent.responseMarkdown || finalMarkdown
                : finalMarkdown;
              const activeHtml = selectedAgent
                ? selectedAgent.responseHtml?.trim()
                  ? selectedAgent.responseHtml
                  : formatSimpleMarkdownToHtml(activeMarkdown)
                : finalHtml;

              return (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 sm:p-5 shadow-inner max-h-[480px] overflow-y-auto">
                  {showRawMarkdown ? (
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200 leading-relaxed">
                      {activeMarkdown || 'Sin respuesta disponible.'}
                    </pre>
                  ) : (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 dark:[&_th]:border-slate-700 [&_th]:bg-slate-100 dark:[&_th]:bg-slate-800 [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-800 [&_td]:p-2 [&_h1]:text-base [&_h1]:font-black [&_h2]:text-sm [&_h2]:font-extrabold [&_h3]:text-xs [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5"
                      dangerouslySetInnerHTML={{ __html: activeHtml }}
                    />
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ─── PESTAÑA 2: TRAZA NODO POR NODO ─── */}
        {!running && result && activeTab === 'trace' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Columna izquierda: Lista de pasos ejecutados */}
            <div className="lg:col-span-5 space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
              {nodeTrace.map((step, idx) => {
                const isSelected = selectedTraceIdx === idx;
                const isBlockedOutput =
                  step.status === 'simulated_blocked' ||
                  step.category === 'output' ||
                  step.stage === 'outputs';
                return (
                  <button
                    key={`${step.nodeKey || step.nodeId}_${idx}`}
                    type="button"
                    onClick={() => {
                      setSelectedTraceIdx(idx);
                      onSelectStepNode(step.nodeKey || step.nodeId);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-500/15 dark:bg-[#C7F303]/15 border-emerald-500 dark:border-[#C7F303] shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-white dark:bg-[#C7F303] dark:text-[#0E1300] text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {step.title}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span>⏱️ {step.durationMs || 0} ms</span>
                          {typeof step.recordsCount === 'number' && (
                            <span>· 📊 {step.recordsCount} reg.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[9.5px] font-extrabold shrink-0 border ${
                        isBlockedOutput
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {isBlockedOutput ? '🛡️ Simulado' : '✓ Listo'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Columna derecha: Detalle del nodo seleccionado */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 p-4 space-y-3">
              {currentTraceStep ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-[#C7F303]">
                        Paso #{selectedTraceIdx + 1} · {currentTraceStep.stage || currentTraceStep.category || 'Nodo del Flujo'}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {currentTraceStep.title}
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      ⏱️ Duración ({currentTraceStep.durationMs || 0} ms)
                    </span>
                  </div>

                  {/* Entrada */}
                  <div>
                    <div className="text-[10.5px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      📥 Contexto de Entrada
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {currentTraceStep.inputContext?.trim() ||
                        'Entrada recibida del paso anterior del lienzo WAPPY.'}
                    </div>
                  </div>

                  {/* Campos quirúrgicos */}
                  <div>
                    <div className="text-[10.5px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      🎯 Campos Quirúrgicos / Filtros Aplicados
                    </div>
                    {Array.isArray(currentTraceStep.surgicalFields) &&
                    currentTraceStep.surgicalFields.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {currentTraceStep.surgicalFields.map((f) => (
                          <span
                            key={f}
                            className="px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-[10.5px] font-bold"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Lectura estándar completa del nodo ({currentTraceStep.recordsCount ?? 0} registros reales leídos).
                      </div>
                    )}
                  </div>

                  {/* Vista previa de salida */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10.5px] font-extrabold uppercase text-slate-500 dark:text-slate-400">
                        📤 Vista Previa de Salida entregada al siguiente nodo
                      </span>
                      {typeof currentTraceStep.recordsCount === 'number' && (
                        <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400">
                          {currentTraceStep.recordsCount} registros reales leídos
                        </span>
                      )}
                    </div>
                    <pre className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-[210px] overflow-y-auto">
                      {currentTraceStep.outputPreview?.trim() ||
                        currentTraceStep.details?.trim() ||
                        'Paso completado y transmitido al siguiente nodo.'}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-500">Selecciona un nodo de la lista izquierda para inspeccionar su traza.</div>
              )}
            </div>
          </div>
        )}

        {/* ─── PESTAÑA 3: SALIDAS INTERCEPTADAS (SIN ENVIAR) ─── */}
        {!running && result && activeTab === 'outputs' && (
          <div className="space-y-4">
            {/* 1. Vista Previa de Correo (Bitácora a Gmail) */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Vista Previa de Correo (Bitácora a Gmail)
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-[10px] font-black">
                  🔒 BLOQUEADO EN MODO DESARROLLO (NO ENVIADO)
                </span>
              </div>
              <div className="p-4 space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-bold text-slate-500">De:</span>{' '}
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {emailPreview.from || 'notificaciones@wappy.club'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Para:</span>{' '}
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {emailPreview.recipients.join(', ')}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-bold text-slate-500">Asunto:</span>{' '}
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {emailPreview.subject}
                    </span>
                  </div>
                </div>
                <div
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 max-h-[260px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: emailPreview.htmlBody || finalHtml,
                  }}
                />
              </div>
            </div>

            {/* 2. Vista Previa de Notificación WAPPY y Chat de Tenshi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-purple-500" />
                    Notificación en WAPPY y Chat de Tenshi
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[9.5px] font-black">
                    🛡️ Simulado
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                  <img
                    src="/assets/tenshi.png"
                    alt="Tenshi IA"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/assets/tenshi.png';
                    }}
                    className="w-10 h-10 object-contain shrink-0"
                  />
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      {notificationPreview.title}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap line-clamp-5">
                      {notificationPreview.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Vista Previa de Impacto en Hitos SST y ACPM */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ClipboardCheck className="w-4 h-4 text-teal-500" />
                    Impacto en Hitos SST y ACPM
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[9.5px] font-black">
                    BD Protegida
                  </span>
                </div>
                {hitoImpacts.length > 0 ? (
                  <div className="space-y-2">
                    {hitoImpacts.map((h, i) => (
                      <div
                        key={`${h.nodeId}_${i}`}
                        className="p-2.5 rounded-xl bg-teal-500/5 border border-teal-500/20 text-xs"
                      >
                        <div className="font-extrabold text-teal-800 dark:text-teal-300">
                          🛡️ {h.title}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {h.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    {result.interceptedOutputs?.acpmPreview?.summary ||
                      'Ningún registro de Hitos SST ni tarea ACPM fue alterado durante esta corrida en Modo Desarrollo.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── PESTAÑA 4: ENTRADA DE PRUEBA (MOCK) ─── */}
        {activeTab === 'mock' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Personaliza aquí el mensaje, evento o payload JSON/texto con el que deseas poner a prueba tu flujo antes de volver a pulsar <strong>▶ Dar Play</strong>. Si lo dejas en blanco, el flujo se probará únicamente con los registros reales actuales de tu empresa en MongoDB.
            </div>
            <textarea
              rows={5}
              value={mockTriggerInput}
              onChange={(e) => onChangeMockTriggerInput(e.target.value)}
              placeholder="Escribe o pega aquí el texto de prueba (ej. un correo entrante con incapacidad, un reporte QR de peligro crítico o un caso específico que quieras evaluar)..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                {mockTriggerInput.trim()
                  ? `🧪 Usando entrada simulada (${mockTriggerInput.length} caracteres)`
                  : '🟢 Usando exclusivamente Datos Reales en Vivo de tu Empresa Activa'}
              </span>
              <div className="flex items-center gap-2">
                {mockTriggerInput && (
                  <ExpandableButton
                    size="sm"
                    variant="amber"
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    label="Restablecer a Datos Reales en Vivo"
                    onClick={() => onChangeMockTriggerInput('')}
                  />
                )}
                <ExpandableButton
                  size="sm"
                  variant="emerald"
                  disabled={running}
                  icon={<Play className="w-3.5 h-3.5 fill-current" />}
                  label="Dar Play con esta Entrada"
                  onClick={() => {
                    setActiveTab('response');
                    onRunSimulation();
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
