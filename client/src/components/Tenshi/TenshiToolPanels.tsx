import React, { Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Car,
  FileEdit,
  FlaskConical,
  Heart,
  Loader2,
  Lock,
  Maximize2,
  Minimize2,
  RefreshCw,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { ExpandableButton } from '~/components/Common/ExpandableButton';
import { useAuthContext } from '~/hooks';
import { canAccessTareas } from '~/utils/planAccess';
import { cn } from '~/utils';

/* ─── Canonical Registry & Types ─────────────────────────────────────────── */

export type TenshiPanelToolId =
  | 'editor_live'
  | 'editor_rit'
  | 'matriz_ipevar'
  | 'matriz_pesv'
  | 'matriz_compatibilidad'
  | 'consultar_analitica_psicosocial'
  | 'consultar_analitica_actos_condiciones'
  | 'gestor_automatizaciones'
  | 'wappy_investigar_trabajador_360'
  | 'blog_editor';

export type TenshiHeroTab = 'chat' | 'canvas' | TenshiPanelToolId;

export type TenshiPanelColorGroup =
  | 'blue'
  | 'indigo'
  | 'amber'
  | 'cyan'
  | 'purple'
  | 'rose'
  | 'teal'
  | 'violet'
  | 'emerald'
  | 'sky';

export interface TenshiPanelToolMeta {
  id: TenshiPanelToolId;
  shortLabel: string;
  fullLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  colorGroup: TenshiPanelColorGroup;
  activeTabClass: string;
  iconClass: string;
  badgeClass: string;
  openPillClass: string;
}

export const TENSHI_PANEL_TOOLS: ReadonlyArray<TenshiPanelToolMeta> = [
  {
    id: 'editor_live',
    shortLabel: 'Editor Live',
    fullLabel: 'Editor Live de Documentos',
    icon: FileEdit,
    colorGroup: 'blue',
    activeTabClass:
      'bg-blue-500/15 border-blue-500/45 text-blue-700 dark:text-blue-300 shadow-2xs',
    iconClass: 'text-blue-600 dark:text-blue-400',
    badgeClass: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300',
    openPillClass:
      'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20',
  },
  {
    id: 'editor_rit',
    shortLabel: 'Editor RIT',
    fullLabel: 'Editor RIT (Reglamento Interno)',
    icon: Scale,
    colorGroup: 'indigo',
    activeTabClass:
      'bg-indigo-500/15 border-indigo-500/45 text-indigo-700 dark:text-indigo-300 shadow-2xs',
    iconClass: 'text-indigo-600 dark:text-indigo-400',
    badgeClass: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300',
    openPillClass:
      'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20',
  },
  {
    id: 'matriz_ipevar',
    shortLabel: 'IPEVR',
    fullLabel: 'Matriz IPEVR (GTC 45)',
    icon: Shield,
    colorGroup: 'amber',
    activeTabClass:
      'bg-amber-500/15 border-amber-500/45 text-amber-700 dark:text-amber-300 shadow-2xs',
    iconClass: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
    openPillClass:
      'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20',
  },
  {
    id: 'matriz_pesv',
    shortLabel: 'PESV',
    fullLabel: 'Matriz de Riesgos Viales PESV',
    icon: Car,
    colorGroup: 'cyan',
    activeTabClass:
      'bg-cyan-500/15 border-cyan-500/45 text-cyan-700 dark:text-cyan-300 shadow-2xs',
    iconClass: 'text-cyan-600 dark:text-cyan-400',
    badgeClass: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300',
    openPillClass:
      'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20',
  },
  {
    id: 'matriz_compatibilidad',
    shortLabel: 'Químicos',
    fullLabel: 'Matriz de Compatibilidad Química SGA',
    icon: FlaskConical,
    colorGroup: 'purple',
    activeTabClass:
      'bg-purple-500/15 border-purple-500/45 text-purple-700 dark:text-purple-300 shadow-2xs',
    iconClass: 'text-purple-600 dark:text-purple-400',
    badgeClass: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300',
    openPillClass:
      'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20',
  },
  {
    id: 'consultar_analitica_psicosocial',
    shortLabel: 'Psicosocial',
    fullLabel: 'Analítica Psicosocial y Ánimo',
    icon: Heart,
    colorGroup: 'rose',
    activeTabClass:
      'bg-rose-500/15 border-rose-500/45 text-rose-700 dark:text-rose-300 shadow-2xs',
    iconClass: 'text-rose-600 dark:text-rose-400',
    badgeClass: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300',
    openPillClass:
      'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20',
  },
  {
    id: 'consultar_analitica_actos_condiciones',
    shortLabel: 'Actos/Cond.',
    fullLabel: 'Analítica de Actos y Condiciones',
    icon: Activity,
    colorGroup: 'teal',
    activeTabClass:
      'bg-teal-500/15 border-teal-500/45 text-teal-700 dark:text-teal-300 shadow-2xs',
    iconClass: 'text-teal-600 dark:text-teal-400',
    badgeClass: 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300',
    openPillClass:
      'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20',
  },
  {
    id: 'gestor_automatizaciones',
    shortLabel: 'Flujos',
    fullLabel: 'Flujos y Automatizaciones (/tareas)',
    icon: Workflow,
    colorGroup: 'violet',
    activeTabClass:
      'bg-violet-500/15 border-violet-500/45 text-violet-700 dark:text-violet-300 shadow-2xs',
    iconClass: 'text-violet-600 dark:text-violet-400',
    badgeClass: 'bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300',
    openPillClass:
      'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-500/20',
  },
  {
    id: 'wappy_investigar_trabajador_360',
    shortLabel: 'OSINT 360',
    fullLabel: 'Investigación OSINT Portales Colombia 360°',
    icon: ShieldCheck,
    colorGroup: 'emerald',
    activeTabClass:
      'bg-emerald-500/15 border-emerald-500/45 text-emerald-700 dark:text-emerald-300 shadow-2xs',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
    openPillClass:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20',
  },
  {
    id: 'blog_editor',
    shortLabel: 'Blog SEO',
    fullLabel: 'Gestor de Blog SEO',
    icon: BookOpen,
    colorGroup: 'sky',
    activeTabClass:
      'bg-sky-500/15 border-sky-500/45 text-sky-700 dark:text-sky-300 shadow-2xs',
    iconClass: 'text-sky-600 dark:text-sky-400',
    badgeClass: 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300',
    openPillClass:
      'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20',
  },
];

export const TENSHI_PANEL_TOOLS_MAP: Record<TenshiPanelToolId, TenshiPanelToolMeta> =
  TENSHI_PANEL_TOOLS.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<TenshiPanelToolId, TenshiPanelToolMeta>,
  );

const TENSHI_PANEL_TOOL_ID_SET = new Set<string>(TENSHI_PANEL_TOOLS.map((t) => t.id));

export function isTenshiPanelTool(id: string | null | undefined): id is TenshiPanelToolId {
  return typeof id === 'string' && TENSHI_PANEL_TOOL_ID_SET.has(id);
}

export function getTenshiPanelToolMeta(id: string | null | undefined): TenshiPanelToolMeta | null {
  if (!isTenshiPanelTool(id)) return null;
  return TENSHI_PANEL_TOOLS_MAP[id];
}

export function getActivePanelToolsFromEnabled(enabledTools: string[] | null | undefined): TenshiPanelToolMeta[] {
  if (!Array.isArray(enabledTools) || enabledTools.length === 0) return [];
  const enabledSet = new Set(enabledTools);
  return TENSHI_PANEL_TOOLS.filter((tool) => enabledSet.has(tool.id));
}

export function resolveTenshiPanelToolId(raw: string | null | undefined): 'canvas' | TenshiPanelToolId | null {
  if (!raw || typeof raw !== 'string') return null;
  const normalized = raw
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!normalized) return null;

  if (normalized === 'canvas') return 'canvas';
  if (TENSHI_PANEL_TOOL_ID_SET.has(normalized)) {
    return normalized as TenshiPanelToolId;
  }

  // Exact/substring alias matching (ordered from most specific to broadest)
  if (normalized.includes('canvas')) return 'canvas';
  if (normalized.includes('rit') || normalized.includes('reglamento')) return 'editor_rit';
  if (
    normalized.includes('editor_live') ||
    normalized.includes('live_editor') ||
    normalized.includes('editor live') ||
    normalized === 'live'
  ) {
    return 'editor_live';
  }
  if (
    normalized.includes('gtc45') ||
    normalized.includes('gtc 45') ||
    normalized.includes('gtc_45') ||
    normalized.includes('ipevar') ||
    normalized.includes('ipevr')
  ) {
    return 'matriz_ipevar';
  }
  if (normalized.includes('pesv')) return 'matriz_pesv';
  if (
    normalized.includes('quimic') ||
    normalized.includes('compatib') ||
    /\bsga\b/.test(normalized)
  ) {
    return 'matriz_compatibilidad';
  }
  if (normalized.includes('psicosocial') || normalized.includes('animo') || normalized.includes('mood')) {
    return 'consultar_analitica_psicosocial';
  }
  if (normalized.includes('actos') || normalized.includes('condiciones')) {
    return 'consultar_analitica_actos_condiciones';
  }
  if (
    normalized.includes('osint') ||
    normalized.includes('360') ||
    normalized.includes('investigar') ||
    normalized.includes('portales')
  ) {
    return 'wappy_investigar_trabajador_360';
  }
  if (
    normalized.includes('auto') ||
    normalized.includes('flujo') ||
    normalized.includes('tarea') ||
    normalized.includes('cron') ||
    normalized.includes('workflow')
  ) {
    return 'gestor_automatizaciones';
  }
  if (normalized.includes('blog')) return 'blog_editor';

  return null;
}

/* ─── Lazy Panel Imports (1 chunk loaded only on demand) ─────────────────── */

const LazyLiveEditorPanel = React.lazy(() => import('~/components/SGSST/LiveEditorPanel'));
const LazyMatrizIPEVARTable = React.lazy(() => import('~/components/SGSST/MatrizIPEVARTable'));
const LazyMatrizPESVTable = React.lazy(() => import('~/components/SGSST/MatrizPESVTable'));
const LazyMatrizCompatibilidadWorkspace = React.lazy(
  () => import('~/components/SGSST/MatrizCompatibilidadWorkspace'),
);
const LazyMoodAnalyticsDashboard = React.lazy(
  () => import('~/components/SGSST/MoodAnalyticsDashboard'),
);
const LazyActosCondicionesAnalyticsDashboard = React.lazy(
  () => import('~/components/SGSST/ActosCondicionesAnalyticsDashboard'),
);
const LazyAutomatizaciones = React.lazy(() => import('~/components/SGSST/Automatizaciones'));
const LazyWorkerOsint360Modal = React.lazy(() => import('~/components/SGSST/WorkerOsint360Modal'));
const LazyBlogAdminDashboard = React.lazy(() => import('~/components/Blog/BlogAdminDashboard'));

/* ─── Isolated ErrorBoundary (never crashes Tenshi) ──────────────────────── */

interface ToolPanelErrorBoundaryProps {
  toolId: TenshiPanelToolId;
  toolLabel: string;
  onBackToChat: () => void;
  children: React.ReactNode;
}

interface ToolPanelErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ToolPanelErrorBoundary extends React.Component<
  ToolPanelErrorBoundaryProps,
  ToolPanelErrorBoundaryState
> {
  constructor(props: ToolPanelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ToolPanelErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Ocurrió un error inesperado al cargar la herramienta.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(`[TenshiEmbeddedToolHost] Error in panel "${this.props.toolId}":`, error, info);
  }

  componentDidUpdate(prevProps: ToolPanelErrorBoundaryProps): void {
    if (prevProps.toolId !== this.props.toolId && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center p-6 bg-surface-secondary/30">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-extrabold text-text-primary">
              No se pudo mostrar {this.props.toolLabel}
            </h3>
            <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
              {this.state.errorMessage}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <ExpandableButton
                type="button"
                variant="cyan"
                size="sm"
                icon={<RefreshCw className="h-3.5 w-3.5" />}
                label="Reintentar"
                onClick={this.handleRetry}
              />
              <ExpandableButton
                type="button"
                variant="neutral"
                size="sm"
                icon={<ArrowLeft className="h-3.5 w-3.5" />}
                label="Volver a Chat"
                onClick={this.props.onBackToChat}
              />
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/* ─── Embedded Tool Host Component ───────────────────────────────────────── */

export interface TenshiEmbeddedToolHostProps {
  toolId: TenshiPanelToolId;
  userId?: string | null;
  activeConvoId?: string | null;
  onBackToChat: () => void;
  onSendPromptToTenshi?: (prompt: string) => void;
}

export const TenshiEmbeddedToolHost: React.FC<TenshiEmbeddedToolHostProps> = ({
  toolId,
  userId,
  activeConvoId,
  onBackToChat,
  onSendPromptToTenshi,
}) => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  const meta = TENSHI_PANEL_TOOLS_MAP[toolId];
  const safeUserId = String(userId || user?.id || (user as any)?._id || 'session').trim() || 'session';
  const hasTareasAccess = canAccessTareas(user);

  // Reset fullscreen state when switching between embedded tools
  useEffect(() => {
    setIsPanelExpanded(false);
  }, [toolId]);

  // Escape exits fullscreen portal cleanly without closing Tenshi Hero
  useEffect(() => {
    if (!isPanelExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsPanelExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isPanelExpanded]);

  if (!meta) return null;

  const Icon = meta.icon;

  const renderActiveToolBody = () => {
    switch (toolId) {
      case 'editor_live':
        return (
          <LazyLiveEditorPanel
            conversationId={`tenshi-live-${safeUserId}`}
            embeddedInTenshi={true}
            title="Editor Live"
          />
        );

      case 'editor_rit':
        return (
          <LazyLiveEditorPanel
            conversationId={`tenshi-rit-${safeUserId}`}
            embeddedInTenshi={true}
            title="Editor RIT"
            emptyStateTitle="Editor RIT en espera"
            emptyStateMessage={
              <>
                Pídele al agente que proceda a{' '}
                <span className="font-bold text-blue-600">cargar la plantilla del RIT</span> para
                comenzar a editarlo.
              </>
            }
          />
        );

      case 'matriz_ipevar':
        return (
          <div className="h-full w-full overflow-y-auto overflow-x-hidden p-3 sm:p-4">
            <LazyMatrizIPEVARTable conversationId={activeConvoId ?? null} isOfficialApp={true} />
          </div>
        );

      case 'matriz_pesv':
        return (
          <div className="h-full w-full overflow-y-auto overflow-x-hidden p-3 sm:p-4">
            <LazyMatrizPESVTable conversationId={activeConvoId ?? null} isOfficialApp={true} />
          </div>
        );

      case 'matriz_compatibilidad':
        return (
          <div className="h-full w-full overflow-y-auto overflow-x-hidden p-3 sm:p-4">
            <LazyMatrizCompatibilidadWorkspace />
          </div>
        );

      case 'consultar_analitica_psicosocial':
        return (
          <div className="h-full w-full overflow-y-auto overflow-x-hidden p-3 sm:p-4">
            <LazyMoodAnalyticsDashboard isMaximized={isPanelExpanded} />
          </div>
        );

      case 'consultar_analitica_actos_condiciones':
        return (
          <div className="h-full w-full overflow-y-auto overflow-x-hidden p-3 sm:p-4">
            <LazyActosCondicionesAnalyticsDashboard
              isMaximized={isPanelExpanded}
              onSendToChat={onSendPromptToTenshi}
            />
          </div>
        );

      case 'gestor_automatizaciones':
        if (!hasTareasAccess) {
          return (
            <div className="flex h-full w-full items-center justify-center p-6 bg-surface-secondary/30">
              <div className="w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm p-6 sm:p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-base font-extrabold text-text-primary">
                  Tareas y Flujos Autónomos IA
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                  Las tareas programadas y flujos autónomos de agentes IA son exclusivos de
                  Administradores y cuentas Wappy Pro.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  <ExpandableButton
                    type="button"
                    variant="teal"
                    size="sm"
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                    label="Ver Planes WAPPY Pro"
                    onClick={() => {
                      setIsPanelExpanded(false);
                      navigate('/planes');
                    }}
                  />
                  <ExpandableButton
                    type="button"
                    variant="neutral"
                    size="sm"
                    icon={<ArrowLeft className="h-3.5 w-3.5" />}
                    label="Volver a Chat"
                    onClick={() => {
                      setIsPanelExpanded(false);
                      onBackToChat();
                    }}
                  />
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="h-full w-full overflow-y-auto overflow-x-hidden">
            <LazyAutomatizaciones hideMainHeader={true} />
          </div>
        );

      case 'wappy_investigar_trabajador_360':
        return (
          <LazyWorkerOsint360Modal
            isOpen={true}
            embedded={true}
            onClose={() => {
              setIsPanelExpanded(false);
              onBackToChat();
            }}
          />
        );

      case 'blog_editor':
        return (
          <div className="h-full w-full overflow-y-auto overflow-x-hidden">
            <LazyBlogAdminDashboard embedded={true} />
          </div>
        );

      default:
        return null;
    }
  };

  const hostShell = (
    <div
      className={cn(
        'flex min-h-0 flex-col overflow-hidden bg-surface-primary dark:bg-zinc-950 text-text-primary',
        isPanelExpanded
          ? 'fixed inset-0 z-[99999] h-screen w-screen animate-in fade-in duration-150'
          : 'h-full w-full flex-1',
      )}
    >
      {/* Micro-barra superior discreta del panel embebido */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/70 dark:border-zinc-800/80 bg-slate-50/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border',
              meta.badgeClass,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold text-slate-800 dark:text-zinc-100 leading-tight">
              {meta.fullLabel}
            </p>
            <p className="truncate text-[10px] font-medium text-slate-500 dark:text-zinc-400 leading-tight">
              Herramienta activa en Tenshi
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <ExpandableButton
            type="button"
            variant="orange"
            size="sm"
            icon={
              isPanelExpanded ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )
            }
            label={isPanelExpanded ? 'Restaurar' : 'Pantalla completa'}
            title={
              isPanelExpanded
                ? 'Restaurar dentro del panel de Tenshi'
                : 'Expandir herramienta a pantalla completa'
            }
            onClick={() => setIsPanelExpanded((prev) => !prev)}
          />
          <ExpandableButton
            type="button"
            variant="neutral"
            size="sm"
            icon={<ArrowLeft className="h-3.5 w-3.5" />}
            label="Volver a Chat"
            title="Volver al chat con Tenshi"
            onClick={() => {
              setIsPanelExpanded(false);
              onBackToChat();
            }}
          />
        </div>
      </div>

      {/* Cuerpo único del panel activo (1 solo panel montado a la vez) */}
      <div className="relative min-h-0 flex-1 w-full overflow-hidden">
        <ToolPanelErrorBoundary
          key={toolId}
          toolId={toolId}
          toolLabel={meta.fullLabel}
          onBackToChat={() => {
            setIsPanelExpanded(false);
            onBackToChat();
          }}
        >
          <Suspense
            fallback={
              <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 p-6 text-center">
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-2xl border',
                    meta.badgeClass,
                  )}
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                  Cargando {meta.shortLabel}...
                </p>
              </div>
            }
          >
            {renderActiveToolBody()}
          </Suspense>
        </ToolPanelErrorBoundary>
      </div>
    </div>
  );

  if (isPanelExpanded && typeof document !== 'undefined') {
    return createPortal(hostShell, document.body);
  }

  return hostShell;
};

export default TenshiEmbeddedToolHost;
