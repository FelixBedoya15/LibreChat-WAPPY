import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Settings2,
  Globe,
  FolderSearch,
  Compass,
  HeartPulse,
  ShieldAlert,
  Car,
  FlaskConical,
  Heart,
  Activity,
  ShieldCheck,
  FileSearch,
  Palette,
  FileEdit,
  Scale,
  BookOpen,
  UserCheck,
  Cpu,
  GraduationCap,
  Atom,
  Stethoscope,
  CloudSun,
  MapPin,
  Calculator,
  Notebook as NotebookIcon,
  Clapperboard,
  Cloud,
  Mail,
  Calendar,
  FileText,
  FileSpreadsheet,
  Presentation,
  HardDrive,
  Brain,
  RefreshCw,
  Check,
  ChevronDown,
  Search,
  X,
  Link2,
  ExternalLink,
  Zap,
  Layers,
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { cn } from '~/utils';
import { safeGetItem, safeSetItem } from '~/utils/safeStorage';
import { NotebookLMModal } from '~/components/Nav/SettingsTabs/Account/NotebookLMModal';

/* ─── Types & Constants ──────────────────────────────────────────────────── */

export type TenshiModelId =
  | 'gemini-3.5-flash-lite'
  | 'gemini-3.6-flash'
  | 'gemini-3.8-flash'
  | 'gemini-4-hydrogen';

export interface TenshiConnectorsState {
  antigravity: boolean;
  notebooklm: boolean;
  google_flow: boolean;
  google_drive: boolean;
  google_gmail: boolean;
  google_calendar: boolean;
  google_docs: boolean;
  google_sheets: boolean;
  google_slides: boolean;
  onedrive: boolean;
}

export interface TenshiNotebookItem {
  id: string;
  title: string;
  emoji?: string;
  sources_count?: number;
  updated_at?: string;
}

export interface TenshiSessionPrefs {
  model: TenshiModelId;
  enabledTools: string[];
  connectors: TenshiConnectorsState;
  selectedNotebooks: TenshiNotebookItem[];
}

export const TENSHI_SESSION_PREFS_STORAGE_KEY = 'wappy_tenshi_session_prefs_v1';

export const DEFAULT_TENSHI_MODEL: TenshiModelId = 'gemini-3.5-flash-lite';

export const TENSHI_ALLOWED_MODELS: ReadonlyArray<{
  id: TenshiModelId;
  label: string;
  badge: string;
  description: string;
}> = [
  {
    id: 'gemini-3.5-flash-lite',
    label: 'gemini-3.5-flash-lite',
    badge: 'Recomendado · Rápido',
    description: 'Máxima velocidad y eficiencia para operación diaria',
  },
  {
    id: 'gemini-3.6-flash',
    label: 'gemini-3.6-flash',
    badge: 'Equilibrado',
    description: 'Equilibrio entre rapidez y análisis técnico SG-SST',
  },
  {
    id: 'gemini-3.8-flash',
    label: 'gemini-3.8-flash',
    badge: 'Avanzado',
    description: 'Mayor profundidad en matrices, normativa y documentos',
  },
  {
    id: 'gemini-4-hydrogen',
    label: 'gemini-4-hydrogen',
    badge: 'Máxima potencia',
    description: 'Razonamiento superior para auditorías y casos complejos',
  },
];

const ALLOWED_MODEL_SET = new Set<string>(TENSHI_ALLOWED_MODELS.map((m) => m.id));

export const LIGHTWEIGHT_TENSHI_TOOLS: string[] = [
  'web_search',
  'somos_sst',
  'canvas',
  'consultar_agente_especializado',
  'gestor_automatizaciones',
];

export const DEFAULT_TENSHI_CONNECTORS: TenshiConnectorsState = {
  antigravity: true,
  notebooklm: true,
  google_flow: true,
  google_drive: false,
  google_gmail: false,
  google_calendar: false,
  google_docs: false,
  google_sheets: false,
  google_slides: false,
  onedrive: false,
};

interface TenshiToolDef {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface TenshiToolCategory {
  id: string;
  title: string;
  tools: TenshiToolDef[];
}

const TENSHI_TOOL_CATEGORIES: TenshiToolCategory[] = [
  {
    id: 'core',
    title: 'Core & Búsqueda',
    tools: [
      { id: 'web_search', label: 'Web Buscar', icon: <Globe className="h-4 w-4 text-blue-500" /> },
      {
        id: 'file_search',
        label: 'Búsqueda en Archivos / RAG',
        icon: <FolderSearch className="h-4 w-4 text-amber-500" />,
      },
      {
        id: 'web_scraper_live',
        label: 'Web Scraper Live',
        icon: <Compass className="h-4 w-4 text-teal-500" />,
      },
    ],
  },
  {
    id: 'sgsst',
    title: 'SG-SST & Somos SST',
    tools: [
      {
        id: 'somos_sst',
        label: 'Somos SST (Hitos 1–8)',
        icon: <HeartPulse className="h-4 w-4 text-rose-500" />,
      },
      {
        id: 'matriz_ipevar',
        label: 'Matriz IPEVR (GTC 45)',
        icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
      },
      {
        id: 'matriz_pesv',
        label: 'Matriz PESV',
        icon: <Car className="h-4 w-4 text-orange-500" />,
      },
      {
        id: 'matriz_compatibilidad',
        label: 'Compatibilidad Química SGA',
        icon: <FlaskConical className="h-4 w-4 text-lime-500" />,
      },
      {
        id: 'consultar_analitica_psicosocial',
        label: 'Analítica Psicosocial',
        icon: <Heart className="h-4 w-4 text-pink-500" />,
      },
      {
        id: 'consultar_analitica_actos_condiciones',
        label: 'Analítica Actos y Condiciones',
        icon: <Activity className="h-4 w-4 text-cyan-500" />,
      },
      {
        id: 'wappy_investigar_trabajador_360',
        label: 'OSINT Portales Colombia 360',
        icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
      },
      {
        id: 'forensic_audit',
        label: 'Auditoría Forense Incapacidades',
        icon: <FileSearch className="h-4 w-4 text-rose-500" />,
      },
    ],
  },
  {
    id: 'docs',
    title: 'Documentos & Editores',
    tools: [
      {
        id: 'canvas',
        label: 'Canvas (Word/PDF/HTML)',
        icon: <Palette className="h-4 w-4 text-fuchsia-500" />,
      },
      {
        id: 'editor_live',
        label: 'Editor Live',
        icon: <FileEdit className="h-4 w-4 text-blue-500" />,
      },
      {
        id: 'editor_rit',
        label: 'Editor RIT',
        icon: <Scale className="h-4 w-4 text-indigo-500" />,
      },
      {
        id: 'blog_editor',
        label: 'Gestor de Blog SEO',
        icon: <BookOpen className="h-4 w-4 text-teal-500" />,
      },
    ],
  },
  {
    id: 'platform',
    title: 'Orquestación & Plataforma',
    tools: [
      {
        id: 'consultar_agente_especializado',
        label: 'Consultar Especialista / Paralelo',
        icon: <UserCheck className="h-4 w-4 text-violet-500" />,
      },
      {
        id: 'gestor_automatizaciones',
        label: 'Automatizaciones (/tareas)',
        icon: <Cpu className="h-4 w-4 text-purple-500" />,
      },
      {
        id: 'academia_marketplace_qr',
        label: 'Academia LMS, Marketplace y QR',
        icon: <GraduationCap className="h-4 w-4 text-sky-500" />,
      },
    ],
  },
  {
    id: 'science',
    title: 'APIs Científicas & Utilidades',
    tools: [
      {
        id: 'api_pubchem',
        label: 'Químicos PubChem (NIH)',
        icon: <Atom className="h-4 w-4 text-cyan-500" />,
      },
      {
        id: 'api_medlineplus',
        label: 'Salud MedlinePlus (NIH)',
        icon: <Stethoscope className="h-4 w-4 text-emerald-500" />,
      },
      {
        id: 'api_clima_viento',
        label: 'Clima y Viento SST',
        icon: <CloudSun className="h-4 w-4 text-yellow-500" />,
      },
      {
        id: 'api_emergencias_osm',
        label: 'Centros de Emergencia',
        icon: <MapPin className="h-4 w-4 text-red-500" />,
      },
      {
        id: 'calculator',
        label: 'Calculadora Técnica SST',
        icon: <Calculator className="h-4 w-4 text-emerald-500" />,
      },
    ],
  },
];

export const ALL_TENSHI_TOOL_IDS: string[] = TENSHI_TOOL_CATEGORIES.flatMap((cat) =>
  cat.tools.map((t) => t.id),
);
const ALL_TOOL_ID_SET = new Set<string>(ALL_TENSHI_TOOL_IDS);

/* ─── Persistence Helpers ────────────────────────────────────────────────── */

function sanitizeModel(raw: unknown): TenshiModelId {
  if (typeof raw === 'string' && ALLOWED_MODEL_SET.has(raw)) {
    return raw as TenshiModelId;
  }
  return DEFAULT_TENSHI_MODEL;
}

function sanitizeEnabledTools(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [...LIGHTWEIGHT_TENSHI_TOOLS];
  }
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item === 'string' && ALL_TOOL_ID_SET.has(item) && !seen.has(item)) {
      seen.add(item);
      unique.push(item);
    }
  }
  return unique;
}

function sanitizeConnectors(raw: unknown): TenshiConnectorsState {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_TENSHI_CONNECTORS };
  }
  const obj = raw as Record<string, unknown>;
  return {
    antigravity:
      typeof obj.antigravity === 'boolean' ? obj.antigravity : DEFAULT_TENSHI_CONNECTORS.antigravity,
    notebooklm:
      typeof obj.notebooklm === 'boolean' ? obj.notebooklm : DEFAULT_TENSHI_CONNECTORS.notebooklm,
    google_flow:
      typeof obj.google_flow === 'boolean' ? obj.google_flow : DEFAULT_TENSHI_CONNECTORS.google_flow,
    google_drive:
      typeof obj.google_drive === 'boolean' ? obj.google_drive : DEFAULT_TENSHI_CONNECTORS.google_drive,
    google_gmail:
      typeof obj.google_gmail === 'boolean' ? obj.google_gmail : DEFAULT_TENSHI_CONNECTORS.google_gmail,
    google_calendar:
      typeof obj.google_calendar === 'boolean'
        ? obj.google_calendar
        : DEFAULT_TENSHI_CONNECTORS.google_calendar,
    google_docs:
      typeof obj.google_docs === 'boolean' ? obj.google_docs : DEFAULT_TENSHI_CONNECTORS.google_docs,
    google_sheets:
      typeof obj.google_sheets === 'boolean'
        ? obj.google_sheets
        : DEFAULT_TENSHI_CONNECTORS.google_sheets,
    google_slides:
      typeof obj.google_slides === 'boolean'
        ? obj.google_slides
        : DEFAULT_TENSHI_CONNECTORS.google_slides,
    onedrive: typeof obj.onedrive === 'boolean' ? obj.onedrive : DEFAULT_TENSHI_CONNECTORS.onedrive,
  };
}

function sanitizeNotebooks(raw: unknown): TenshiNotebookItem[] {
  if (!Array.isArray(raw)) return [];
  const out: TenshiNotebookItem[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const nb = item as Record<string, unknown>;
    const id = String(nb.id || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      title: String(nb.title || 'Cuaderno sin título').trim(),
      emoji: typeof nb.emoji === 'string' ? nb.emoji : undefined,
      sources_count: typeof nb.sources_count === 'number' ? nb.sources_count : undefined,
      updated_at: typeof nb.updated_at === 'string' ? nb.updated_at : undefined,
    });
  }
  return out;
}

export function getDefaultTenshiSessionPrefs(): TenshiSessionPrefs {
  return {
    model: DEFAULT_TENSHI_MODEL,
    enabledTools: [...LIGHTWEIGHT_TENSHI_TOOLS],
    connectors: { ...DEFAULT_TENSHI_CONNECTORS },
    selectedNotebooks: [],
  };
}

export function loadTenshiSessionPrefs(userId?: string | null): TenshiSessionPrefs {
  const userKey = String(userId || 'default').trim() || 'default';
  try {
    const raw = safeGetItem(TENSHI_SESSION_PREFS_STORAGE_KEY);
    if (!raw) return getDefaultTenshiSessionPrefs();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return getDefaultTenshiSessionPrefs();

    const record =
      parsed.byUser && typeof parsed.byUser === 'object'
        ? parsed.byUser[userKey]
        : 'model' in parsed || 'enabledTools' in parsed || 'connectors' in parsed
          ? parsed
          : null;

    if (!record || typeof record !== 'object') {
      return getDefaultTenshiSessionPrefs();
    }

    return {
      model: sanitizeModel(record.model),
      enabledTools: sanitizeEnabledTools(record.enabledTools),
      connectors: sanitizeConnectors(record.connectors),
      selectedNotebooks: sanitizeNotebooks(record.selectedNotebooks),
    };
  } catch {
    return getDefaultTenshiSessionPrefs();
  }
}

export function saveTenshiSessionPrefs(
  prefs: TenshiSessionPrefs,
  userId?: string | null,
): void {
  const userKey = String(userId || 'default').trim() || 'default';
  try {
    let container: { version: number; byUser: Record<string, TenshiSessionPrefs> } = {
      version: 1,
      byUser: {},
    };
    const existingRaw = safeGetItem(TENSHI_SESSION_PREFS_STORAGE_KEY);
    if (existingRaw) {
      const parsed = JSON.parse(existingRaw);
      if (parsed && typeof parsed === 'object' && parsed.byUser && typeof parsed.byUser === 'object') {
        container = { version: 1, byUser: { ...parsed.byUser } };
      }
    }
    container.byUser[userKey] = {
      model: sanitizeModel(prefs.model),
      enabledTools: sanitizeEnabledTools(prefs.enabledTools),
      connectors: sanitizeConnectors(prefs.connectors),
      selectedNotebooks: sanitizeNotebooks(prefs.selectedNotebooks),
    };
    safeSetItem(TENSHI_SESSION_PREFS_STORAGE_KEY, JSON.stringify(container));
  } catch {
    // ignore storage failures
  }
}

/* ─── Subcomponents ──────────────────────────────────────────────────────── */

function ToggleSwitch({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: () => void;
  id: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1',
        checked ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-zinc-700',
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  );
}

function ToolRow({
  icon,
  label,
  subtitle,
  statusDot,
  checked,
  onChange,
  id,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  statusDot?: 'online' | 'offline';
  checked: boolean;
  onChange: () => void;
  id: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-slate-100/80 dark:hover:bg-zinc-800/80">
      <label
        htmlFor={id}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-zinc-200"
      >
        <span className="flex-shrink-0">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-medium">{label}</span>
            {statusDot && (
              <span
                title={
                  statusDot === 'online'
                    ? 'Google Antigravity conectado en tiempo real'
                    : 'Daemon de Google Antigravity sin conexión activa'
                }
                className={cn(
                  'inline-block h-2 w-2 flex-shrink-0 rounded-full',
                  statusDot === 'online'
                    ? 'bg-emerald-500 ring-2 ring-emerald-500/25'
                    : 'bg-slate-400 dark:bg-zinc-600',
                )}
              />
            )}
          </span>
          {subtitle && (
            <span className="block truncate text-[10px] text-slate-400 dark:text-zinc-400">
              {subtitle}
            </span>
          )}
        </span>
      </label>
      <ToggleSwitch id={id} checked={checked} onChange={onChange} />
    </div>
  );
}

const AntigravityTriangleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4 text-orange-500"
  >
    <path d="M12 3 4 20l3.5-1.5L12 9l4.5 9.5L20 20 12 3z" />
    <path d="M8.5 15.5h7" />
  </svg>
);

const GoogleMulticolorIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[16px] w-[16px] flex-shrink-0">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22.81-.6z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z"
    />
  </svg>
);

/* ─── Viewport-Safe Floating Popover Position Hook ───────────────────────── */

interface FloatingCoords {
  left: number;
  bottom?: number;
  top?: number;
  width: number;
  maxHeight: number;
}

function computeUpwardPopoverCoords(
  triggerEl: HTMLElement | null,
  desiredWidth: number,
  desiredMaxHeight = 520,
): FloatingCoords | null {
  if (!triggerEl || typeof window === 'undefined') return null;
  const rect = triggerEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 12;
  const width = Math.min(desiredWidth, vw - margin * 2);

  let left = rect.left;
  if (left + width > vw - margin) {
    left = vw - margin - width;
  }
  if (left < margin) {
    left = margin;
  }

  const spaceAbove = rect.top - margin;
  const spaceBelow = vh - rect.bottom - margin;

  if (spaceAbove >= 220 || spaceAbove >= spaceBelow) {
    return {
      left,
      bottom: Math.max(margin, vh - rect.top + 8),
      width,
      maxHeight: Math.max(200, Math.min(desiredMaxHeight, spaceAbove - 8)),
    };
  }

  return {
    left,
    top: Math.min(vh - margin - 200, rect.bottom + 8),
    width,
    maxHeight: Math.max(200, Math.min(desiredMaxHeight, spaceBelow - 8)),
  };
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export interface TenshiSessionControlsProps {
  prefs: TenshiSessionPrefs;
  onChangePrefs: (
    updater:
      | TenshiSessionPrefs
      | ((prev: TenshiSessionPrefs) => TenshiSessionPrefs),
  ) => void;
  compact?: boolean;
  onExternalModalToggle?: (isOpen: boolean) => void;
}

export default function TenshiSessionControls({
  prefs,
  onChangePrefs,
  compact = false,
  onExternalModalToggle,
}: TenshiSessionControlsProps) {
  const { token, isAuthenticated } = useAuthContext();

  const [openMenu, setOpenMenu] = useState<'none' | 'tools' | 'connectors'>('none');
  const [connectorsTab, setConnectorsTab] = useState<'connectors' | 'notebooks'>('connectors');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [toolSearch, setToolSearch] = useState('');
  const [notebookSearch, setNotebookSearch] = useState('');

  // NotebookLM live state
  const [nbConnected, setNbConnected] = useState(false);
  const [nbEmail, setNbEmail] = useState('');
  const [availableNotebooks, setAvailableNotebooks] = useState<TenshiNotebookItem[]>([]);
  const [isLoadingNotebooks, setIsLoadingNotebooks] = useState(false);
  const [isSavingNotebooks, setIsSavingNotebooks] = useState(false);
  const [nbSyncWarning, setNbSyncWarning] = useState<string | null>(null);
  const [isNotebookLMModalOpen, setIsNotebookLMModalOpen] = useState(false);

  // Google Antigravity live daemon status
  const [antigravityStatus, setAntigravityStatus] = useState<{
    connected: boolean;
    activeMode?: string;
    totalCount?: number;
  }>({ connected: false });

  // Refs for portal positioning & click-outside
  const toolsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const googleTriggerRef = useRef<HTMLButtonElement | null>(null);
  const notebooksPillRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [popoverCoords, setPopoverCoords] = useState<FloatingCoords | null>(null);

  const onChangePrefsRef = useRef(onChangePrefs);
  onChangePrefsRef.current = onChangePrefs;

  useEffect(() => {
    onExternalModalToggle?.(isNotebookLMModalOpen);
  }, [isNotebookLMModalOpen, onExternalModalToggle]);

  // Fetch Antigravity daemon status
  const fetchAntigravityStatus = useCallback(async () => {
    if (!token || !isAuthenticated) return;
    try {
      const res = await fetch('/api/mcp-bridge/antigravity/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setAntigravityStatus({
        connected: Boolean(data?.connected),
        activeMode: typeof data?.activeMode === 'string' ? data.activeMode : undefined,
        totalCount: typeof data?.totalCount === 'number' ? data.totalCount : undefined,
      });
    } catch {
      // silent fallback
    }
  }, [token, isAuthenticated]);

  // Fetch NotebookLM notebooks assigned to Tenshi ("agentId=tenshi")
  const fetchNotebooks = useCallback(
    async (forceRefresh = false) => {
      if (!token || !isAuthenticated) return;
      try {
        setIsLoadingNotebooks(true);
        setNbSyncWarning(null);
        const qs = new URLSearchParams({ agentId: 'tenshi' });
        if (forceRefresh) {
          qs.set('refresh', '1');
        }
        const res = await fetch(`/api/notebooklm/notebooks?${qs.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setNbConnected(Boolean(data?.connected));
        setNbEmail(typeof data?.email === 'string' ? data.email : '');
        const nbs = sanitizeNotebooks(data?.notebooks);
        const assigned = sanitizeNotebooks(data?.assignedNotebooks);
        setAvailableNotebooks(nbs);
        onChangePrefsRef.current((prev) => ({
          ...prev,
          selectedNotebooks: assigned,
        }));
        if (data?.syncWarning) {
          setNbSyncWarning(String(data.syncWarning));
        }
      } catch (err) {
        console.error('[TenshiSessionControls] Error fetching NotebookLM notebooks:', err);
      } finally {
        setIsLoadingNotebooks(false);
      }
    },
    [token, isAuthenticated],
  );

  // Initial sync on mount
  useEffect(() => {
    if (token && isAuthenticated) {
      fetchNotebooks(false);
      fetchAntigravityStatus();
    }
  }, [token, isAuthenticated, fetchNotebooks, fetchAntigravityStatus]);

  // Listen to cross-component NotebookLM sync events
  useEffect(() => {
    const handleExternalUpdate = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.agentId === 'tenshi' && Array.isArray(custom.detail?.assignedNotebooks)) {
        const sanitized = sanitizeNotebooks(custom.detail.assignedNotebooks);
        onChangePrefsRef.current((prev) => ({
          ...prev,
          selectedNotebooks: sanitized,
        }));
      } else {
        fetchNotebooks(false);
      }
    };
    window.addEventListener('wappy-notebooklm-updated', handleExternalUpdate);
    return () => window.removeEventListener('wappy-notebooklm-updated', handleExternalUpdate);
  }, [fetchNotebooks]);

  const saveAssignedNotebooks = useCallback(
    async (nextList: TenshiNotebookItem[]) => {
      const sanitized = sanitizeNotebooks(nextList);
      onChangePrefs((prev) => ({
        ...prev,
        selectedNotebooks: sanitized,
      }));
      if (!token || !isAuthenticated) return;
      try {
        setIsSavingNotebooks(true);
        const res = await fetch('/api/notebooklm/agent-notebooks/tenshi', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notebooks: sanitized }),
        });
        if (res.ok) {
          const data = await res.json();
          const saved = Array.isArray(data?.assignedNotebooks)
            ? sanitizeNotebooks(data.assignedNotebooks)
            : sanitized;
          onChangePrefs((prev) => ({
            ...prev,
            selectedNotebooks: saved,
          }));
          window.dispatchEvent(
            new CustomEvent('wappy-notebooklm-updated', {
              detail: { agentId: 'tenshi', assignedNotebooks: saved },
            }),
          );
        }
      } catch (err) {
        console.error('[TenshiSessionControls] Error saving Tenshi notebooks:', err);
      } finally {
        setIsSavingNotebooks(false);
      }
    },
    [token, isAuthenticated, onChangePrefs],
  );

  const toggleNotebook = useCallback(
    (nb: TenshiNotebookItem) => {
      const exists = prefs.selectedNotebooks.some((item) => item.id === nb.id);
      const next = exists
        ? prefs.selectedNotebooks.filter((item) => item.id !== nb.id)
        : [...prefs.selectedNotebooks, nb];
      saveAssignedNotebooks(next);
    },
    [prefs.selectedNotebooks, saveAssignedNotebooks],
  );

  // Recalculate portal coordinates when open or viewport changes
  const updatePosition = useCallback(() => {
    if (openMenu === 'none') {
      setPopoverCoords(null);
      return;
    }
    const anchor =
      openMenu === 'tools'
        ? toolsTriggerRef.current
        : connectorsTab === 'notebooks' && notebooksPillRef.current
          ? notebooksPillRef.current
          : googleTriggerRef.current;
    const width = openMenu === 'tools' ? 320 : 336;
    const coords = computeUpwardPopoverCoords(anchor, width, 510);
    setPopoverCoords(coords);
  }, [openMenu, connectorsTab]);

  useEffect(() => {
    updatePosition();
    if (openMenu === 'none') return;
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [openMenu, updatePosition]);

  // Click outside & Escape handling
  useEffect(() => {
    if (openMenu === 'none') return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (popoverRef.current?.contains(target)) return;
      if (toolsTriggerRef.current?.contains(target)) return;
      if (googleTriggerRef.current?.contains(target)) return;
      if (notebooksPillRef.current?.contains(target)) return;
      setOpenMenu('none');
      setIsModelDropdownOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu('none');
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenu]);

  // Handlers
  const handleSelectModel = (modelId: TenshiModelId) => {
    onChangePrefs((prev) => ({ ...prev, model: modelId }));
    setIsModelDropdownOpen(false);
  };

  const handleToggleTool = (toolId: string) => {
    onChangePrefs((prev) => {
      const exists = prev.enabledTools.includes(toolId);
      const nextTools = exists
        ? prev.enabledTools.filter((id) => id !== toolId)
        : [...prev.enabledTools, toolId];
      return { ...prev, enabledTools: nextTools };
    });
  };

  const handleApplyLightweightProfile = () => {
    onChangePrefs((prev) => ({ ...prev, enabledTools: [...LIGHTWEIGHT_TENSHI_TOOLS] }));
  };

  const handleEnableAllTools = () => {
    onChangePrefs((prev) => ({ ...prev, enabledTools: [...ALL_TENSHI_TOOL_IDS] }));
  };

  const handleToggleConnector = (key: keyof TenshiConnectorsState) => {
    onChangePrefs((prev) => ({
      ...prev,
      connectors: {
        ...prev.connectors,
        [key]: !prev.connectors[key],
      },
    }));
  };

  const isLightweightActive = useMemo(() => {
    if (prefs.enabledTools.length !== LIGHTWEIGHT_TENSHI_TOOLS.length) return false;
    return LIGHTWEIGHT_TENSHI_TOOLS.every((id) => prefs.enabledTools.includes(id));
  }, [prefs.enabledTools]);

  const isAllToolsActive = prefs.enabledTools.length === ALL_TENSHI_TOOL_IDS.length;

  const filteredCategories = useMemo(() => {
    const q = toolSearch.trim().toLowerCase();
    if (!q) return TENSHI_TOOL_CATEGORIES;
    return TENSHI_TOOL_CATEGORIES.map((cat) => ({
      ...cat,
      tools: cat.tools.filter(
        (t) => t.label.toLowerCase().includes(q) || t.id.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.tools.length > 0);
  }, [toolSearch]);

  const filteredNotebooks = useMemo(() => {
    const q = notebookSearch.trim().toLowerCase();
    if (!q) return availableNotebooks;
    return availableNotebooks.filter((nb) => (nb.title || '').toLowerCase().includes(q));
  }, [availableNotebooks, notebookSearch]);

  const activeModelMeta =
    TENSHI_ALLOWED_MODELS.find((m) => m.id === prefs.model) || TENSHI_ALLOWED_MODELS[0];

  const assignedCount = prefs.selectedNotebooks.length;
  const isNonDefaultModel = prefs.model !== DEFAULT_TENSHI_MODEL;

  const workspaceConnectors: Array<{
    key: keyof TenshiConnectorsState;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      key: 'google_flow',
      label: 'Google Flow (Veo & Imagen)',
      icon: <Clapperboard className="h-4 w-4 text-purple-500" />,
    },
    {
      key: 'google_drive',
      label: 'Google Drive',
      icon: <Cloud className="h-4 w-4 text-emerald-500" />,
    },
    {
      key: 'google_gmail',
      label: 'Google Gmail',
      icon: <Mail className="h-4 w-4 text-red-500" />,
    },
    {
      key: 'google_calendar',
      label: 'Google Calendar',
      icon: <Calendar className="h-4 w-4 text-blue-500" />,
    },
    {
      key: 'google_docs',
      label: 'Google Docs',
      icon: <FileText className="h-4 w-4 text-blue-500" />,
    },
    {
      key: 'google_sheets',
      label: 'Google Sheets',
      icon: <FileSpreadsheet className="h-4 w-4 text-green-500" />,
    },
    {
      key: 'google_slides',
      label: 'Google Slides',
      icon: <Presentation className="h-4 w-4 text-orange-500" />,
    },
    {
      key: 'onedrive',
      label: 'Microsoft OneDrive',
      icon: <HardDrive className="h-4 w-4 text-sky-500" />,
    },
  ];

  const renderPopoverContent = () => {
    if (openMenu === 'none' || !popoverCoords) return null;

    return createPortal(
      <div
        ref={popoverRef}
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: `${popoverCoords.left}px`,
          ...(popoverCoords.bottom !== undefined
            ? { bottom: `${popoverCoords.bottom}px` }
            : { top: `${popoverCoords.top ?? 12}px` }),
          width: `${popoverCoords.width}px`,
          maxWidth: 'calc(100vw - 24px)',
          maxHeight: `${popoverCoords.maxHeight}px`,
          zIndex: 2147483646,
        }}
        className={cn(
          'flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 dark:border-zinc-700/80',
          'bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/20',
          'animate-in fade-in-0 zoom-in-95 duration-150',
        )}
      >
        {/* ═══ POPOVER 1: MODELO IA Y HERRAMIENTAS ═══ */}
        {openMenu === 'tools' && (
          <div className="flex min-h-0 flex-col">
            {/* Sección superior: Modelo IA */}
            <div className="shrink-0 border-b border-slate-200/70 dark:border-zinc-800 px-3 py-2.5 bg-slate-50/70 dark:bg-zinc-900/70">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                    Modelo IA
                  </span>
                </div>
                <span className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                  {activeModelMeta.badge}
                </span>
              </div>

              {/* Selector custom limpio */}
              <div className="relative">
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={isModelDropdownOpen}
                  onClick={() => setIsModelDropdownOpen((v) => !v)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                    'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-100',
                    'hover:border-teal-500/60 focus:border-teal-500 focus:outline-none',
                  )}
                >
                  <span className="truncate">{prefs.model}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 flex-shrink-0 text-slate-400 transition-transform duration-200',
                      isModelDropdownOpen && 'rotate-180 text-teal-500',
                    )}
                  />
                </button>

                {isModelDropdownOpen && (
                  <div
                    role="listbox"
                    className="mt-1.5 space-y-0.5 rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 shadow-lg"
                  >
                    {TENSHI_ALLOWED_MODELS.map((m) => {
                      const isSelected = m.id === prefs.model;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectModel(m.id)}
                          className={cn(
                            'flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors cursor-pointer',
                            isSelected
                              ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
                              : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800',
                          )}
                        >
                          <Check
                            className={cn(
                              'mt-0.5 h-3.5 w-3.5 flex-shrink-0',
                              isSelected ? 'text-teal-600 dark:text-teal-400 opacity-100' : 'opacity-0',
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="truncate text-xs font-bold">{m.label}</span>
                              <span className="shrink-0 rounded-md bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:text-zinc-400">
                                {m.badge}
                              </span>
                            </div>
                            <p className="truncate text-[10px] text-slate-400 dark:text-zinc-400">
                              {m.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {isNonDefaultModel && (
                <button
                  type="button"
                  onClick={() => handleSelectModel(DEFAULT_TENSHI_MODEL)}
                  className="mt-1.5 text-[11px] font-semibold text-teal-600 dark:text-teal-400 underline-offset-2 hover:underline cursor-pointer"
                >
                  Restablecer a {DEFAULT_TENSHI_MODEL}
                </button>
              )}
            </div>

            {/* Acciones rápidas + buscador compacto */}
            <div className="shrink-0 space-y-2 border-b border-slate-200/60 dark:border-zinc-800/80 px-3 py-2">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleApplyLightweightProfile}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-xl border px-2 py-1 text-[11px] font-bold transition-all active:scale-95 cursor-pointer',
                      isLightweightActive
                        ? 'border-teal-500/50 bg-teal-500/15 text-teal-700 dark:text-teal-300'
                        : 'border-slate-200 dark:border-zinc-700 bg-slate-500/5 text-slate-600 dark:text-zinc-300 hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-300',
                    )}
                  >
                    <Zap className="h-3 w-3" />
                    <span>Perfil rápido</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleEnableAllTools}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-xl border px-2 py-1 text-[11px] font-bold transition-all active:scale-95 cursor-pointer',
                      isAllToolsActive
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-zinc-700 bg-slate-500/5 text-slate-600 dark:text-zinc-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300',
                    )}
                  >
                    <Layers className="h-3 w-3" />
                    <span>Activar todas</span>
                  </button>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-slate-400 dark:text-zinc-400">
                  {prefs.enabledTools.length}/{ALL_TENSHI_TOOL_IDS.length}
                </span>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  placeholder="Filtrar herramientas..."
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/80 dark:bg-zinc-800/80 py-1.5 pl-8 pr-7 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none"
                />
                {toolSearch && (
                  <button
                    type="button"
                    onClick={() => setToolSearch('')}
                    aria-label="Limpiar filtro"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista agrupada de herramientas con scroll interno */}
            <div className="max-h-[320px] min-h-0 flex-1 overflow-y-auto px-2 py-2 space-y-2.5">
              {filteredCategories.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                  No se encontraron herramientas para “{toolSearch}”.
                </p>
              ) : (
                filteredCategories.map((cat) => {
                  const activeInCat = cat.tools.filter((t) =>
                    prefs.enabledTools.includes(t.id),
                  ).length;
                  return (
                    <div key={cat.id}>
                      <div className="mb-1 flex items-center justify-between px-2.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                          {cat.title}
                        </span>
                        <span className="text-[10px] font-bold text-teal-600/80 dark:text-teal-400/80">
                          {activeInCat}/{cat.tools.length}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {cat.tools.map((tool) => (
                          <ToolRow
                            key={tool.id}
                            id={`tenshi-tool-${tool.id}`}
                            icon={tool.icon}
                            label={tool.label}
                            checked={prefs.enabledTools.includes(tool.id)}
                            onChange={() => handleToggleTool(tool.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ═══ POPOVER 2: CONECTORES & CUADERNOS ═══ */}
        {openMenu === 'connectors' && (
          <div className="flex min-h-0 flex-col">
            {/* Barra superior de 2 Pestañas (Conectores | Cuadernos) */}
            <div className="flex shrink-0 items-center gap-1 border-b border-slate-200/70 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 p-1.5">
              <button
                type="button"
                onClick={() => setConnectorsTab('connectors')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer border',
                  connectorsTab === 'connectors'
                    ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 border-slate-200/80 dark:border-zinc-700 shadow-2xs'
                    : 'border-transparent text-slate-500 dark:text-zinc-400 hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 hover:text-slate-800 dark:hover:text-zinc-200',
                )}
              >
                <span>Conectores</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setConnectorsTab('notebooks');
                  if (availableNotebooks.length === 0 && !isLoadingNotebooks) {
                    fetchNotebooks(false);
                  }
                }}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer border',
                  connectorsTab === 'notebooks'
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                    : 'border-transparent text-slate-500 dark:text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400',
                )}
              >
                <NotebookIcon className="h-3.5 w-3.5 text-emerald-500" />
                <span>Cuadernos</span>
                <span
                  className={cn(
                    'inline-flex h-4 min-w-[16px] items-center justify-center rounded-md px-1 text-[10px] font-extrabold',
                    assignedCount > 0
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-200/80 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300',
                  )}
                >
                  {assignedCount > 0 ? assignedCount : availableNotebooks.length}
                </span>
              </button>
            </div>

            {/* PESTAÑA 1: CONECTORES */}
            {connectorsTab === 'connectors' && (
              <div className="max-h-[380px] min-h-0 flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
                {/* 1. Google Antigravity con indicador en vivo */}
                <ToolRow
                  id="tenshi-connector-antigravity"
                  icon={<AntigravityTriangleIcon />}
                  label="Google Antigravity"
                  subtitle={
                    antigravityStatus.connected
                      ? `Daemon activo${antigravityStatus.activeMode ? ` · ${antigravityStatus.activeMode}` : ''}`
                      : 'Daemon desconectado'
                  }
                  statusDot={antigravityStatus.connected ? 'online' : 'offline'}
                  checked={prefs.connectors.antigravity}
                  onChange={() => handleToggleConnector('antigravity')}
                />

                {/* 2. Google NotebookLM + caja inline 2° Cerebro */}
                <div>
                  <ToolRow
                    id="tenshi-connector-notebooklm"
                    icon={<NotebookIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                    label="Google NotebookLM"
                    checked={prefs.connectors.notebooklm}
                    onChange={() => handleToggleConnector('notebooklm')}
                  />

                  {prefs.connectors.notebooklm && (
                    <div className="mx-1.5 mb-2 mt-1 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Brain className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                          <span className="truncate text-[11px] font-bold text-slate-800 dark:text-zinc-100">
                            2° Cerebro ({assignedCount}/{availableNotebooks.length})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => fetchNotebooks(true)}
                            disabled={isLoadingNotebooks}
                            title="Sincronizar cuadernos de Google NotebookLM"
                            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-1 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                          >
                            <RefreshCw
                              className={cn(
                                'h-3 w-3',
                                isLoadingNotebooks && 'animate-spin',
                              )}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConnectorsTab('notebooks')}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                          >
                            Pestaña →
                          </button>
                        </div>
                      </div>

                      {!nbConnected && !isLoadingNotebooks ? (
                        <div className="flex flex-col gap-1.5 pt-0.5">
                          <p className="text-[11px] leading-tight text-slate-600 dark:text-zinc-300">
                            Conecta tu Google NotebookLM para elegir qué cuadernos usará Tenshi.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenu('none');
                              setIsNotebookLMModalOpen(true);
                            }}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            <span>Vincular mi NotebookLM</span>
                          </button>
                        </div>
                      ) : isLoadingNotebooks && availableNotebooks.length === 0 ? (
                        <div className="flex items-center gap-2 py-2 text-[11px] text-slate-500 dark:text-zinc-400">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                          <span>Cargando cuadernos disponibles...</span>
                        </div>
                      ) : availableNotebooks.length === 0 ? (
                        <div className="flex items-center justify-between gap-2 py-1">
                          <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                            No se detectaron cuadernos.
                          </span>
                          <button
                            type="button"
                            onClick={() => fetchNotebooks(true)}
                            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            Sincronizar
                          </button>
                        </div>
                      ) : (
                        <div className="max-h-[145px] space-y-1 overflow-y-auto pr-0.5">
                          {availableNotebooks.map((nb) => {
                            const isAssigned = prefs.selectedNotebooks.some(
                              (item) => item.id === nb.id,
                            );
                            return (
                              <button
                                key={nb.id}
                                type="button"
                                onClick={() => toggleNotebook(nb)}
                                className={cn(
                                  'flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-all cursor-pointer border',
                                  isAssigned
                                    ? 'border-emerald-500/35 bg-emerald-500/15 font-semibold text-emerald-700 dark:text-emerald-300'
                                    : 'border-transparent text-slate-600 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-zinc-800/70',
                                )}
                              >
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <span className="flex-shrink-0 text-sm">
                                    {nb.emoji || '📓'}
                                  </span>
                                  <span className="truncate text-[11px]">{nb.title}</span>
                                </div>
                                <div
                                  className={cn(
                                    'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                                    isAssigned
                                      ? 'border-emerald-500 bg-emerald-500 text-white'
                                      : 'border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900',
                                  )}
                                >
                                  {isAssigned && <Check className="h-2.5 w-2.5" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3-10. Resto de conectores Google Workspace + OneDrive */}
                {workspaceConnectors.map((conn) => (
                  <ToolRow
                    key={conn.key}
                    id={`tenshi-connector-${conn.key}`}
                    icon={conn.icon}
                    label={conn.label}
                    checked={prefs.connectors[conn.key]}
                    onChange={() => handleToggleConnector(conn.key)}
                  />
                ))}
              </div>
            )}

            {/* PESTAÑA 2: CUADERNOS (2° Cerebro · Tenshi) */}
            {connectorsTab === 'notebooks' && (
              <div className="flex min-h-0 flex-1 flex-col p-3">
                {/* Cabecera del Segundo Cerebro */}
                <div className="mb-2.5 shrink-0 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <Brain className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-zinc-100">
                          2° Cerebro · Tenshi
                        </p>
                        <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          {assignedCount > 0
                            ? `${assignedCount} cuaderno(s) activo(s) como fuente`
                            : 'Elige cuadernos prioritarios para Tenshi'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchNotebooks(true)}
                      disabled={isLoadingNotebooks}
                      title="Sincronizar cuadernos desde Google NotebookLM"
                      className="flex shrink-0 items-center gap-1 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                    >
                      <RefreshCw
                        className={cn('h-3 w-3', isLoadingNotebooks && 'animate-spin')}
                      />
                      <span>Sync</span>
                    </button>
                  </div>
                </div>

                {!prefs.connectors.notebooklm && (
                  <div className="mb-2.5 flex shrink-0 items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-2">
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                      Google NotebookLM está desactivado.
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleConnector('notebooklm')}
                      className="shrink-0 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
                    >
                      Activar
                    </button>
                  </div>
                )}

                {!nbConnected && !isLoadingNotebooks ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 p-4 text-center">
                    <NotebookIcon className="mb-2 h-7 w-7 text-emerald-500" />
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                      Conecta tu Google NotebookLM
                    </p>
                    <p className="mt-1 mb-3 text-[11px] text-slate-500 dark:text-zinc-400">
                      Vincula tu sesión privada para ver tus cuadernos y asignarlos al 2° Cerebro de Tenshi.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenu('none');
                        setIsNotebookLMModalOpen(true);
                      }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      <span>Vincular mi NotebookLM</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Buscador local + Todos / Limpiar */}
                    {availableNotebooks.length > 0 && (
                      <div className="mb-2 flex shrink-0 items-center gap-1.5">
                        <div className="relative flex-1 min-w-0">
                          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={notebookSearch}
                            onChange={(e) => setNotebookSearch(e.target.value)}
                            placeholder="Buscar cuaderno..."
                            className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/80 dark:bg-zinc-800/80 py-1 pl-7 pr-2 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => saveAssignedNotebooks(availableNotebooks)}
                          disabled={isSavingNotebooks}
                          className="shrink-0 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                        >
                          Todos
                        </button>
                        {assignedCount > 0 && (
                          <button
                            type="button"
                            onClick={() => saveAssignedNotebooks([])}
                            disabled={isSavingNotebooks}
                            className="shrink-0 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                    )}

                    {nbSyncWarning && (
                      <div className="mb-2 flex shrink-0 items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[10px] text-amber-700 dark:text-amber-300">
                        <span className="truncate">{nbSyncWarning}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenu('none');
                            setIsNotebookLMModalOpen(true);
                          }}
                          className="flex-shrink-0 font-bold underline cursor-pointer"
                        >
                          Reconectar
                        </button>
                      </div>
                    )}

                    {/* Lista scrollable de cuadernos */}
                    <div className="max-h-[235px] min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
                      {isLoadingNotebooks && availableNotebooks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <RefreshCw className="mb-2 h-5 w-5 animate-spin text-emerald-500" />
                          <p className="text-xs text-slate-500 dark:text-zinc-400">
                            Sincronizando tus cuadernos de NotebookLM...
                          </p>
                        </div>
                      ) : filteredNotebooks.length === 0 ? (
                        <div className="rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 p-4 text-center">
                          <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {notebookSearch
                              ? 'Ningún cuaderno coincide con tu búsqueda.'
                              : 'No se encontraron cuadernos en tu cuenta.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => fetchNotebooks(true)}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Volver a sincronizar</span>
                          </button>
                        </div>
                      ) : (
                        filteredNotebooks.map((nb) => {
                          const isAssigned = prefs.selectedNotebooks.some(
                            (item) => item.id === nb.id,
                          );
                          return (
                            <button
                              key={nb.id}
                              type="button"
                              onClick={() => toggleNotebook(nb)}
                              className={cn(
                                'flex w-full items-center justify-between gap-2.5 rounded-xl border p-2 text-left transition-all cursor-pointer',
                                isAssigned
                                  ? 'border-emerald-500/40 bg-emerald-500/10 shadow-2xs'
                                  : 'border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-800/40 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100/70 dark:hover:bg-zinc-800',
                              )}
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white dark:bg-zinc-900 text-base shadow-2xs border border-slate-200/50 dark:border-zinc-700/50">
                                  {nb.emoji || '📓'}
                                </span>
                                <div className="min-w-0">
                                  <p
                                    className={cn(
                                      'truncate text-xs',
                                      isAssigned
                                        ? 'font-bold text-emerald-700 dark:text-emerald-300'
                                        : 'font-medium text-slate-800 dark:text-zinc-100',
                                    )}
                                  >
                                    {nb.title}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-400">
                                    <span>{nb.sources_count ?? 0} fuente(s)</span>
                                    {isAssigned && (
                                      <span className="rounded bg-emerald-500/20 px-1 py-0.2 font-bold text-emerald-700 dark:text-emerald-300">
                                        2° Cerebro
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={cn(
                                  'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors',
                                  isAssigned
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : 'border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900',
                                )}
                              >
                                {isAssigned && <Check className="h-3 w-3" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Pie con correo vinculado y accesos */}
                    <div className="mt-2.5 flex shrink-0 items-center justify-between border-t border-slate-200/70 dark:border-zinc-800 pt-2 text-[10px] text-slate-400 dark:text-zinc-400">
                      <span className="max-w-[175px] truncate">
                        {nbEmail ? `Conectado: ${nbEmail}` : 'Sesión privada activa'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenu('none');
                            setIsNotebookLMModalOpen(true);
                          }}
                          className="font-bold text-slate-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          Configurar
                        </button>
                        <a
                          href="https://notebooklm.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <span>Abrir</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>,
      document.body,
    );
  };

  return (
    <>
      <div className="flex min-w-0 items-center gap-1">
        {/* Botón 1 — Sliders (Modelo IA y Herramientas) */}
        <button
          ref={toolsTriggerRef}
          type="button"
          aria-label="Modelo IA y Herramientas de Tenshi"
          aria-expanded={openMenu === 'tools'}
          title={`Modelo: ${prefs.model} · ${prefs.enabledTools.length} herramienta(s) activa(s)`}
          onClick={() => {
            setIsModelDropdownOpen(false);
            setOpenMenu((prev) => (prev === 'tools' ? 'none' : 'tools'));
          }}
          className={cn(
            'relative inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-xl border px-2 text-xs font-bold transition-all duration-200 ease-in-out sm:hover:-rotate-2 sm:hover:scale-105 active:scale-95 cursor-pointer',
            openMenu === 'tools'
              ? 'border-teal-500/50 bg-teal-500/20 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/30'
              : 'border-slate-300/60 dark:border-zinc-700 bg-slate-500/10 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-300',
          )}
        >
          <Settings2 className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="rounded-md bg-teal-500/15 px-1 py-0.5 text-[10px] font-extrabold leading-none text-teal-700 dark:text-teal-300">
            {prefs.enabledTools.length}
          </span>
          {isNonDefaultModel && (
            <span
              className="pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-zinc-900"
              title={`Modelo personalizado: ${prefs.model}`}
            />
          )}
        </button>

        {/* Botón 2 — G (Conectores Google & OneDrive + Cuadernos) */}
        <button
          ref={googleTriggerRef}
          type="button"
          aria-label="Conectores Google y Cuadernos de NotebookLM"
          aria-expanded={openMenu === 'connectors'}
          title="Conectores Google, OneDrive y Cuadernos NotebookLM"
          onClick={() => {
            if (openMenu === 'connectors' && connectorsTab === 'connectors') {
              setOpenMenu('none');
            } else {
              setConnectorsTab('connectors');
              setOpenMenu('connectors');
              fetchAntigravityStatus();
            }
          }}
          className={cn(
            'relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ease-in-out sm:hover:-rotate-2 sm:hover:scale-105 active:scale-95 cursor-pointer',
            openMenu === 'connectors'
              ? 'border-emerald-500/50 bg-emerald-500/15 ring-1 ring-emerald-500/30'
              : 'border-slate-300/60 dark:border-zinc-700 bg-slate-500/10 dark:bg-zinc-800/80 hover:border-emerald-500/40 hover:bg-emerald-500/10',
          )}
        >
          <GoogleMulticolorIcon />
          {prefs.connectors.notebooklm && assignedCount > 0 && (
            <span className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-md bg-emerald-500 px-1 text-[9px] font-black text-white shadow-xs">
              {assignedCount}
            </span>
          )}
        </button>

        {/* Píldora rápida: Cuadernos (N) cuando NotebookLM está activo */}
        {prefs.connectors.notebooklm && (
          <button
            ref={notebooksPillRef}
            type="button"
            aria-label="Cuadernos de Google NotebookLM (2° Cerebro de Tenshi)"
            title={
              assignedCount > 0
                ? `2° Cerebro (${assignedCount}): ${prefs.selectedNotebooks.map((n) => n.title).join(', ')}`
                : 'Abrir pestaña de Cuadernos NotebookLM'
            }
            onClick={() => {
              if (openMenu === 'connectors' && connectorsTab === 'notebooks') {
                setOpenMenu('none');
              } else {
                setConnectorsTab('notebooks');
                setOpenMenu('connectors');
                if (availableNotebooks.length === 0 && !isLoadingNotebooks) {
                  fetchNotebooks(false);
                }
              }
            }}
            className={cn(
              'inline-flex h-8 max-w-[130px] shrink-0 items-center gap-1 rounded-xl border px-2 text-[11px] font-bold transition-all duration-200 ease-in-out sm:hover:-rotate-1 sm:hover:scale-[1.03] active:scale-95 cursor-pointer',
              assignedCount > 0 || (openMenu === 'connectors' && connectorsTab === 'notebooks')
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                : 'border-slate-300/60 dark:border-zinc-700 bg-slate-500/10 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-300',
            )}
          >
            <NotebookIcon className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
            <span className={cn('truncate', compact ? 'hidden sm:inline' : 'inline')}>
              {assignedCount > 0 ? `Cuadernos (${assignedCount})` : 'Cuadernos'}
            </span>
            {compact && assignedCount > 0 && (
              <span className="sm:hidden inline-flex h-4 min-w-[16px] items-center justify-center rounded-md bg-emerald-500/20 px-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                {assignedCount}
              </span>
            )}
          </button>
        )}
      </div>

      {renderPopoverContent()}

      <NotebookLMModal
        isOpen={isNotebookLMModalOpen}
        onClose={() => setIsNotebookLMModalOpen(false)}
        onStatusChange={() => fetchNotebooks(true)}
      />
    </>
  );
}
