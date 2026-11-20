import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as Ariakit from '@ariakit/react';
import {
    Settings2, Globe, FolderSearch, Notebook as NotebookIcon, TerminalSquare, Wrench, Cpu, Check, ChevronDown,
    FileText, Calculator, Brain, HardHat, ShieldCheck, Palette, BarChart3, Cloud, Calendar, Mail, FileSpreadsheet, Presentation,
    HeartPulse, ShieldAlert, Car, FlaskConical, FileEdit, Scale, BookOpen, UserCheck, Heart, Activity,
    Search, Youtube, Image, Binary, Compass, CloudSun, GitFork, MapPin, Clapperboard, RefreshCw, Sparkles, ExternalLink, Link2, AlertTriangle
} from 'lucide-react';
import type { TEphemeralAgent } from 'librechat-data-provider';
import { useGetModelsQuery } from 'librechat-data-provider/react-query';
import { TooltipAnchor } from '@librechat/client';
import { useAgentSessionOverrides } from '~/hooks/Agents';
import type { NotebookLMNotebookItem } from '~/hooks/Agents/useAgentSessionOverrides';
import { useLocalize, useAuthContext } from '~/hooks';
import { cn, isTextChatModel } from '~/utils';
import { UpgradeWall } from '~/components/SGSST/UpgradeWall';
import { NotebookLMModal } from '~/components/Nav/SettingsTabs/Account/NotebookLMModal';
import { GoogleFlowModal } from '~/components/Nav/SettingsTabs/Account/GoogleFlowModal';
import { ExpandableButton } from '~/components/Common/ExpandableButton';

/** Extended version while data-provider package is being rebuilt */
type TEphemeralAgentExtended = TEphemeralAgent & {
    model?: string;
    tools?: string[];
    notebooklmNotebooks?: NotebookLMNotebookItem[];
};

interface AgentSessionPanelProps {
    agentId: string;
    conversationId?: string | null;
}

/* ─── Toggle Switch ───────────────────────────────────────────────────── */
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
            onClick={onChange}
            className={cn(
                'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1',
                checked ? 'bg-green-500' : 'bg-surface-tertiary',
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

/* ─── Tool Row ────────────────────────────────────────────────────────── */
function ToolRow({
    icon,
    label,
    subtitle,
    subtitleClassName,
    statusDot,
    statusTitle,
    actionButton,
    checked,
    onChange,
    id,
}: {
    icon: React.ReactNode;
    label: string;
    subtitle?: string;
    subtitleClassName?: string;
    statusDot?: 'online' | 'warning' | 'offline';
    statusTitle?: string;
    actionButton?: React.ReactNode;
    checked: boolean;
    onChange: () => void;
    id: string;
}) {
    return (
        <div className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-surface-hover rounded-lg">
            <label
                htmlFor={id}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-text-secondary"
            >
                <span className="flex-shrink-0">{icon}</span>
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                        <span className="truncate">{label}</span>
                        {statusDot && (
                            <span
                                title={
                                    statusTitle ||
                                    (statusDot === 'online'
                                        ? 'Conectado y activo'
                                        : statusDot === 'warning'
                                          ? 'Sesión expirada — Reconectar'
                                          : 'Sin conexión activa')
                                }
                                className={cn(
                                    'inline-block h-2 w-2 flex-shrink-0 rounded-full',
                                    statusDot === 'online'
                                        ? 'bg-emerald-500 ring-2 ring-emerald-500/25'
                                        : statusDot === 'warning'
                                          ? 'bg-amber-500 ring-2 ring-rose-500/35'
                                          : 'bg-slate-400 dark:bg-zinc-600',
                                )}
                            />
                        )}
                    </span>
                    {subtitle && (
                        <span
                            className={cn(
                                'block truncate text-[10px] text-text-tertiary',
                                subtitleClassName,
                            )}
                        >
                            {subtitle}
                        </span>
                    )}
                </span>
            </label>
            <div className="flex shrink-0 items-center gap-1.5">
                {actionButton}
                <ToggleSwitch id={id} checked={checked} onChange={onChange} />
            </div>
        </div>
    );
}

/* ─── Tool Icon Resolver ──────────────────────────────────────────────── */
const getToolIcon = (toolId: string) => {
    const lowerId = toolId.toLowerCase();
    if (lowerId.includes('getchemicalcid')) {
        return <Search className="h-4 w-4 text-sky-500" />;
    }
    if (lowerId.includes('getghsclassification')) {
        return <FlaskConical className="h-4 w-4 text-lime-500" />;
    }
    if (lowerId.includes('searchlocationorresource')) {
        return <MapPin className="h-4 w-4 text-red-500" />;
    }
    switch (toolId) {
        // --- Core / Wappy Custom Tools ---
        case 'context':
            return <FileText className="h-4 w-4 text-violet-500" />;
        case 'calculator':
            return <Calculator className="h-4 w-4 text-emerald-500" />;
        case 'memory':
            return <Brain className="h-4 w-4 text-pink-500" />;
        case 'somos_sst':
            return <HeartPulse className="h-4 w-4 text-rose-500" />;
        case 'matriz_ipevar':
            return <ShieldAlert className="h-4 w-4 text-amber-500" />;
        case 'matriz_pesv':
            return <Car className="h-4 w-4 text-orange-500" />;
        case 'matriz_compatibilidad':
            return <FlaskConical className="h-4 w-4 text-lime-500" />;
        case 'editor_live':
            return <FileEdit className="h-4 w-4 text-blue-500" />;
        case 'editor_rit':
            return <Scale className="h-4 w-4 text-indigo-500" />;
        case 'canvas':
            return <Palette className="h-4 w-4 text-fuchsia-500" />;
        case 'blog_editor':
            return <BookOpen className="h-4 w-4 text-teal-500" />;
        case 'consultar_agente_especializado':
            return <UserCheck className="h-4 w-4 text-violet-500" />;
        case 'consultar_analitica_psicosocial':
            return <Heart className="h-4 w-4 text-pink-500" />;
        case 'consultar_analitica_actos_condiciones':
            return <Activity className="h-4 w-4 text-cyan-500" />;
        case 'gestor_automatizaciones':
            return <Cpu className="h-4 w-4 text-purple-500" />;

        // --- Google Suite ---
        case 'google_antigravity':
            return (
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
        case 'google_flow':
            return <Clapperboard className="h-4 w-4 text-purple-500" />;
        case 'google_drive':
            return <Cloud className="h-4 w-4 text-emerald-500" />;
        case 'google_calendar':
            return <Calendar className="h-4 w-4 text-blue-500" />;
        case 'google_gmail':
            return <Mail className="h-4 w-4 text-red-500" />;
        case 'google_sheets':
            return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
        case 'google_docs':
            return <FileText className="h-4 w-4 text-blue-500" />;
        case 'google_slides':
            return <Presentation className="h-4 w-4 text-orange-500" />;

        // --- Standard / External APIs / Plugins ---
        case 'google':
        case 'google_search':
        case 'google-search':
            return <Search className="h-4 w-4 text-blue-500" />;
        case 'youtube':
            return <Youtube className="h-4 w-4 text-red-500" />;
        case 'image_gen_oai':
        case 'dalle':
        case 'stable-diffusion':
        case 'flux':
        case 'google-image-gen':
            return <Image className="h-4 w-4 text-sky-500" />;
        case 'wolfram':
            return <Binary className="h-4 w-4 text-red-600" />;
        case 'web-browser':
        case 'tavily_search_results_json':
        case 'traversaal_search':
        case 'azure-ai-search':
            return <Compass className="h-4 w-4 text-teal-500" />;
        case 'open_weather':
            return <CloudSun className="h-4 w-4 text-yellow-500" />;
        case 'n8n':
            return <GitFork className="h-4 w-4 text-amber-500" />;

        default:
            return <Wrench className="h-4 w-4 text-text-secondary" />;
    }
};

/* ─── Main Panel ──────────────────────────────────────────────────────── */
export default function AgentSessionPanel({ agentId, conversationId }: AgentSessionPanelProps) {
    const localize = useLocalize();
    const { user, token } = useAuthContext();
    const isProOrAdmin = user?.role === 'ADMIN' || user?.role === 'USER_PRO' || user?.role === 'USER_IPEVAR' || user?.role === 'IPEVAR';
    const [isGeneralOpen, setIsGeneralOpen] = useState(false);
    const [isGoogleOpen, setIsGoogleOpen] = useState(false);
    const [googleMenuTab, setGoogleMenuTab] = useState<'connectors' | 'notebooks'>('connectors');
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isNotebookLMModalOpen, setIsNotebookLMModalOpen] = useState(false);
    const [isGoogleFlowModalOpen, setIsGoogleFlowModalOpen] = useState(false);

    // Estado de cuadernos de Google NotebookLM y asignación por agente ("Segundo Cerebro")
    const [nbConnected, setNbConnected] = useState(false);
    const [nbEmail, setNbEmail] = useState('');
    const [notebookSessionExpired, setNotebookSessionExpired] = useState(false);
    const [nbDbscBound, setNbDbscBound] = useState(false);
    const [availableNotebooks, setAvailableNotebooks] = useState<NotebookLMNotebookItem[]>([]);
    const [assignedNotebooks, setAssignedNotebooks] = useState<NotebookLMNotebookItem[]>([]);
    const [isLoadingNotebooks, setIsLoadingNotebooks] = useState(false);
    const [isSavingNotebooks, setIsSavingNotebooks] = useState(false);
    const [notebookSearch, setNotebookSearch] = useState('');
    const [nbSyncWarning, setNbSyncWarning] = useState<string | null>(null);

    // Estado en vivo de Google Flow (Veo & Imagen)
    const [flowConnected, setFlowConnected] = useState(false);
    const [flowSessionExpired, setFlowSessionExpired] = useState(false);
    const [flowEmail, setFlowEmail] = useState('');

    const {
        hasWebSearch,
        hasFileSearch,
        hasCodeInterpreter,
        externalTools,
        overrides,
        toggleBuiltinTool,
        toggleExternalTool,
        setSessionModel,
        setSessionNotebooklmNotebooks,
        agentName,
        agentModel,
        agentProvider,
    } = useAgentSessionOverrides({ agentId, conversationId });

    const modelsQuery = useGetModelsQuery();
    const modelList = useMemo(() => {
        const data = modelsQuery.data ?? {};
        const allModels = new Set<string>();
        Object.values(data).forEach((list) => {
            if (Array.isArray(list)) {
                list.forEach((m) => {
                    if (isTextChatModel(m)) {
                        allModels.add(m);
                    }
                });
            }
        });
        const providerModels = agentProvider
            ? (data[agentProvider] ?? []).filter((m) => isTextChatModel(m))
            : [];
        return providerModels.length > 0 ? providerModels : [...allModels].sort();
    }, [modelsQuery.data, agentProvider]);

    const sessionModel = (overrides as TEphemeralAgentExtended | null)?.model ?? agentModel ?? '';

    // Filter tools into Google and General categories (excluding always-on background system tools)
    const alwaysOnHiddenTools = ['wappy_renderizar_widget_interactivo', 'wappy_memoria_procedimental', 'memory'];
    const googleToolIds = [
        'google_antigravity',
        'google_flow',
        'google_drive',
        'google_gmail',
        'google_calendar',
        'google_docs',
        'google_sheets',
        'google_slides',
    ];
    const googleTools = googleToolIds.filter((id) => externalTools.includes(id));
    const notebookLmTools = externalTools.filter((id) => id.includes('_mcp_notebooklm'));
    const generalExternalTools = externalTools.filter(
        (id) => !googleToolIds.includes(id) && !id.includes('_mcp_notebooklm') && !alwaysOnHiddenTools.includes(id)
    );
    
    const isNotebookLmActive = notebookLmTools.length > 0 && notebookLmTools.some(id => (overrides as TEphemeralAgentExtended | null)?.tools?.includes(id));
    
    const toggleNotebookLm = () => {
        notebookLmTools.forEach(toolId => {
            const isActive = (overrides as TEphemeralAgentExtended | null)?.tools?.includes(toolId);
            if (isNotebookLmActive && isActive) {
                toggleExternalTool(toolId);
            } else if (!isNotebookLmActive && !isActive) {
                toggleExternalTool(toolId);
            }
        });
    };

    const fetchNotebookStatus = useCallback(async () => {
        if (!token) return;
        try {
            const activeCompanyId =
                typeof window !== 'undefined'
                    ? (localStorage.getItem('wappy_active_company_id') || '').trim()
                    : '';
            const qs =
                activeCompanyId && activeCompanyId !== 'default'
                    ? `?companyId=${encodeURIComponent(activeCompanyId)}`
                    : '';
            const res = await fetch(`/api/notebooklm/status${qs}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                if (data?.sessionExpired === true || data?.isValid === false) {
                    setNotebookSessionExpired(true);
                }
                return;
            }
            if (!data || typeof data !== 'object') return;
            const connected = Boolean(data?.connected);
            const expired = Boolean(data?.sessionExpired || (connected && data?.isValid === false));
            setNbConnected(connected);
            setNotebookSessionExpired(expired);
            setNbDbscBound(Boolean(connected && data?.dbscBound === true));
            setNbEmail(typeof data?.email === 'string' ? data.email.trim() : '');
        } catch {
            // silent fallback
        }
    }, [token]);

    const fetchGoogleFlowStatus = useCallback(async () => {
        if (!token) return;
        try {
            const activeCompanyId =
                typeof window !== 'undefined'
                    ? (localStorage.getItem('wappy_active_company_id') || '').trim()
                    : '';
            const qs =
                activeCompanyId && activeCompanyId !== 'default'
                    ? `?companyId=${encodeURIComponent(activeCompanyId)}`
                    : '';
            const res = await fetch(`/api/googleflow/status${qs}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                if (data?.sessionExpired === true || data?.isValid === false) {
                    setFlowSessionExpired(true);
                }
                return;
            }
            if (!data || typeof data !== 'object') return;
            const connected = Boolean(data?.connected);
            const expired = Boolean(data?.sessionExpired || (connected && data?.isValid === false));
            setFlowConnected(connected);
            setFlowSessionExpired(expired);
            setFlowEmail(typeof data?.email === 'string' ? data.email.trim() : '');
        } catch {
            // silent fallback
        }
    }, [token]);

    const fetchNotebooks = useCallback(
        async (forceRefresh = false) => {
            if (!token || !agentId) return;
            try {
                setIsLoadingNotebooks(true);
                setNbSyncWarning(null);
                const qs = new URLSearchParams({ agentId });
                const activeCompanyId =
                    typeof window !== 'undefined'
                        ? (localStorage.getItem('wappy_active_company_id') || '').trim()
                        : '';
                if (activeCompanyId && activeCompanyId !== 'default') {
                    qs.set('companyId', activeCompanyId);
                }
                if (forceRefresh) {
                    qs.set('refresh', '1');
                }
                const res = await fetch(`/api/notebooklm/notebooks?${qs.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json().catch(() => null);
                if (!res.ok) {
                    if (data?.sessionExpired === true || data?.isValid === false) {
                        setNotebookSessionExpired(true);
                        if (typeof data?.syncWarning === 'string' && data.syncWarning.trim()) {
                            setNbSyncWarning(data.syncWarning.trim());
                        }
                    }
                    return;
                }
                if (!data) return;

                const connected = Boolean(data?.connected);
                const expired = Boolean(
                    data?.sessionExpired === true || (connected && data?.isValid === false),
                );
                const dbscBound = Boolean(connected && data?.dbscBound === true);
                const syncWarning =
                    typeof data?.syncWarning === 'string' && data.syncWarning.trim()
                        ? data.syncWarning.trim()
                        : null;

                setNbConnected(connected);
                setNbEmail(typeof data?.email === 'string' ? data.email.trim() : '');
                setNotebookSessionExpired(expired);
                setNbDbscBound(dbscBound);
                const nbs: NotebookLMNotebookItem[] = Array.isArray(data?.notebooks)
                    ? data.notebooks
                    : [];
                const assigned: NotebookLMNotebookItem[] = Array.isArray(data?.assignedNotebooks)
                    ? data.assignedNotebooks
                    : [];
                setAvailableNotebooks(nbs);
                setAssignedNotebooks(assigned);
                setSessionNotebooklmNotebooks(assigned);
                setNbSyncWarning(syncWarning);
            } catch (err) {
                console.error('[AgentSessionPanel] Error fetching NotebookLM notebooks:', err);
            } finally {
                setIsLoadingNotebooks(false);
            }
        },
        [token, agentId, setSessionNotebooklmNotebooks],
    );

    useEffect(() => {
        if (token && agentId) {
            fetchNotebooks(false);
            fetchNotebookStatus();
            fetchGoogleFlowStatus();
        }
    }, [token, agentId, fetchNotebooks, fetchNotebookStatus, fetchGoogleFlowStatus]);

    useEffect(() => {
        const applyAuthExpiredDetail = (detail?: { reason?: string; message?: string } | null) => {
            setNotebookSessionExpired(true);
            const reason =
                typeof detail?.message === 'string' && detail.message.trim()
                    ? detail.message.trim()
                    : typeof detail?.reason === 'string' && detail.reason.trim()
                      ? detail.reason.trim()
                      : null;
            if (reason) {
                setNbSyncWarning(reason);
            }
            fetchGoogleFlowStatus();
        };
        const handleExternalUpdate = (e: Event) => {
            const custom = e as CustomEvent;
            if (
                custom?.detail?.authExpired === true ||
                custom?.detail?.sessionExpired === true ||
                custom?.detail?.isValid === false
            ) {
                applyAuthExpiredDetail(custom?.detail);
                return;
            }
            if (custom?.detail?.agentId === agentId && Array.isArray(custom?.detail?.assignedNotebooks)) {
                setAssignedNotebooks(custom.detail.assignedNotebooks);
                setSessionNotebooklmNotebooks(custom.detail.assignedNotebooks);
            } else {
                fetchNotebooks(Boolean(custom?.detail?.refresh));
                fetchGoogleFlowStatus();
            }
        };
        const handleAuthExpired = (e: Event) => {
            const custom = e as CustomEvent<{ reason?: string; message?: string } | undefined>;
            applyAuthExpiredDetail(custom?.detail);
        };
        const handleFlowUpdate = (e: Event) => {
            const custom = e as CustomEvent;
            if (
                custom?.detail?.authExpired === true ||
                custom?.detail?.sessionExpired === true ||
                custom?.detail?.isValid === false
            ) {
                setFlowSessionExpired(true);
                return;
            }
            fetchGoogleFlowStatus();
        };
        const handleFlowAuthExpired = () => {
            setFlowSessionExpired(true);
        };
        const handleCompanyChange = () => {
            fetchNotebooks(false);
            fetchNotebookStatus();
            fetchGoogleFlowStatus();
        };
        window.addEventListener('wappy-notebooklm-updated', handleExternalUpdate);
        window.addEventListener('wappy-notebooklm-auth-expired', handleAuthExpired);
        window.addEventListener('notebooklm_auth_expired', handleAuthExpired);
        window.addEventListener('wappy-googleflow-updated', handleFlowUpdate);
        window.addEventListener('wappy-googleflow-auth-expired', handleFlowAuthExpired);
        window.addEventListener('googleflow_auth_expired', handleFlowAuthExpired);
        window.addEventListener('wappy-company-changed', handleCompanyChange);
        window.addEventListener('wappy-empresa-cambiada', handleCompanyChange);
        return () => {
            window.removeEventListener('wappy-notebooklm-updated', handleExternalUpdate);
            window.removeEventListener('wappy-notebooklm-auth-expired', handleAuthExpired);
            window.removeEventListener('notebooklm_auth_expired', handleAuthExpired);
            window.removeEventListener('wappy-googleflow-updated', handleFlowUpdate);
            window.removeEventListener('wappy-googleflow-auth-expired', handleFlowAuthExpired);
            window.removeEventListener('googleflow_auth_expired', handleFlowAuthExpired);
            window.removeEventListener('wappy-company-changed', handleCompanyChange);
            window.removeEventListener('wappy-empresa-cambiada', handleCompanyChange);
        };
    }, [agentId, fetchNotebooks, fetchNotebookStatus, fetchGoogleFlowStatus, setSessionNotebooklmNotebooks]);

    const safeAvailableNotebooks = useMemo(
        () => (Array.isArray(availableNotebooks) ? availableNotebooks : []),
        [availableNotebooks],
    );
    const safeAssignedNotebooks = useMemo(
        () => (Array.isArray(assignedNotebooks) ? assignedNotebooks : []),
        [assignedNotebooks],
    );

    const saveAssignedNotebooks = useCallback(
        async (nextList: NotebookLMNotebookItem[]) => {
            if (!token || !agentId) return;
            const normalizedList = Array.isArray(nextList) ? nextList : [];
            setAssignedNotebooks(normalizedList);
            setSessionNotebooklmNotebooks(normalizedList);
            try {
                setIsSavingNotebooks(true);
                const res = await fetch(`/api/notebooklm/agent-notebooks/${encodeURIComponent(agentId)}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ notebooks: normalizedList }),
                });
                if (res.ok) {
                    const data = await res.json();
                    const saved: NotebookLMNotebookItem[] = Array.isArray(data?.assignedNotebooks)
                        ? data.assignedNotebooks
                        : normalizedList;
                    setAssignedNotebooks(saved);
                    setSessionNotebooklmNotebooks(saved);
                    window.dispatchEvent(
                        new CustomEvent('wappy-notebooklm-updated', {
                            detail: { agentId, assignedNotebooks: saved },
                        }),
                    );
                }
            } catch (err) {
                console.error('[AgentSessionPanel] Error saving agent notebooks:', err);
            } finally {
                setIsSavingNotebooks(false);
            }
        },
        [token, agentId, setSessionNotebooklmNotebooks],
    );

    const toggleNotebookForAgent = useCallback(
        (nb: NotebookLMNotebookItem) => {
            if (!nb?.id) return;
            const current = Array.isArray(assignedNotebooks) ? assignedNotebooks : [];
            const exists = current.some((item) => item?.id === nb.id);
            const next = exists
                ? current.filter((item) => item?.id !== nb.id)
                : [...current, nb];
            saveAssignedNotebooks(next);
        },
        [assignedNotebooks, saveAssignedNotebooks],
    );

    const filteredNotebooks = useMemo(() => {
        const q = (notebookSearch || '').trim().toLowerCase();
        if (!q) return safeAvailableNotebooks;
        return safeAvailableNotebooks.filter((nb) => (nb?.title || '').toLowerCase().includes(q));
    }, [safeAvailableNotebooks, notebookSearch]);

    const hasGoogleTools = googleTools.length > 0 || notebookLmTools.length > 0;
    const hasGeneralTools = hasWebSearch || hasFileSearch || hasCodeInterpreter || generalExternalTools.length > 0;

    const toolTranslations: Record<string, string> = {
        context: 'Contexto',
        calculator: 'Calculadora',
        memory: 'Memoria',
        somos_sst: 'Somos SST',
        matriz_ipevar: 'Matriz IPEVR',
        matriz_pesv: 'Matriz PESV',
        matriz_compatibilidad: 'Compatibilidad Química',
        editor_live: 'Editor Live',
        editor_rit: 'Editor RIT',
        canvas: 'Canvas',
        blog_editor: 'Gestor de Blog',
        consultar_agente_especializado: 'Consultar Especialista',
        consultar_analitica_psicosocial: 'Consultar Analítica Psicosocial',
        consultar_analitica_actos_condiciones: 'Analítica de Actos y Condiciones',
        gestor_automatizaciones: 'Automatizaciones',
        google_antigravity: 'Google Antigravity',
        google_flow: 'Google Flow (Veo & Imagen)',
        google_drive: 'Google Drive',
        google_calendar: 'Google Calendar',
        google_gmail: 'Google Gmail',
        google_sheets: 'Google Sheets',
        google_docs: 'Google Docs',
        google_slides: 'Google Slides',
        google: 'Google Search',
        youtube: 'YouTube',
        dalle: 'DALL-E-3',
        tavily_search_results_json: 'Tavily Search',
        'stable-diffusion': 'Stable Diffusion',
        'azure-ai-search': 'Azure AI Search',
        open_weather: 'OpenWeather',
        flux: 'Flux Image Gen',
        'google-image-gen': 'Google Image Gen',
        n8n: 'n8n Webhook',
        traversaal_search: 'Traversaal',
        image_gen_oai: 'OpenAI Imagen',
        wolfram: 'Wolfram|Alpha',
        'web-browser': 'Navegador Web'
    };

    const generalTrigger = (
        <TooltipAnchor
            render={
                <Ariakit.MenuButton
                    id="agent-session-panel-button"
                    aria-label="Opciones de sesión del agente"
                    className={cn(
                        'flex size-9 items-center justify-center rounded-full p-1 transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50',
                        isGeneralOpen && 'bg-surface-hover',
                    )}
                >
                    <Settings2 className="icon-md" />
                </Ariakit.MenuButton>
            }
            id="agent-session-panel-button"
            description={localize('com_ui_tools') + ' · Sesión'}
        />
    );

    const nbOperational = nbConnected && !notebookSessionExpired;
    const flowOperational = flowConnected && !flowSessionExpired;
    const isFlowActive = (overrides as TEphemeralAgentExtended | null)?.tools?.includes('google_flow') ?? false;
    const hasAnyGoogleSessionExpired =
        (isNotebookLmActive && notebookSessionExpired) || (isFlowActive && flowSessionExpired);

    const googleTrigger = (
        <TooltipAnchor
            render={
                <Ariakit.MenuButton
                    id="google-tools-panel-button"
                    aria-label="Herramientas de Google Workspace"
                    onClick={() => {
                        if (!isGoogleOpen) {
                            setGoogleMenuTab('connectors');
                            fetchNotebookStatus();
                            fetchGoogleFlowStatus();
                        }
                    }}
                    className={cn(
                        'relative flex size-9 items-center justify-center rounded-full p-1 transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50',
                        isGoogleOpen && 'bg-surface-hover',
                    )}
                >
                    <div className="flex h-5 w-5 items-center justify-center">
                        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22.81-.6z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z"/>
                        </svg>
                    </div>
                    {hasAnyGoogleSessionExpired ? (
                        <span
                            title="Sesión de Google expirada — Reconectar"
                            className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-md border border-rose-500/50 bg-amber-500/90 px-1 text-[9px] font-extrabold text-amber-950 shadow-sm"
                        >
                            !
                        </span>
                    ) : isNotebookLmActive && safeAssignedNotebooks.length > 0 ? (
                        <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/90 px-1 text-[9px] font-bold text-white shadow-sm">
                            {safeAssignedNotebooks.length}
                        </span>
                    ) : null}
                </Ariakit.MenuButton>
            }
            id="google-tools-panel-button"
            description={
                hasAnyGoogleSessionExpired
                    ? 'Herramientas de Google · Sesión expirada (Reconectar)'
                    : 'Herramientas de Google & Cuadernos de NotebookLM'
            }
        />
    );

    return (
        <>
            <div className="flex items-center gap-1.5">
                {/* ── MENÚ 1: HERRAMIENTAS GENERALES ── */}
                <Ariakit.MenuProvider open={isGeneralOpen} setOpen={setIsGeneralOpen}>
                    {generalTrigger}
                    <Ariakit.Menu
                        portal
                        gutter={8}
                        className={cn(
                            'z-50 min-w-[240px] max-w-[300px] overflow-hidden rounded-2xl border border-border-medium/60',
                            'bg-surface-primary shadow-xl shadow-black/10 backdrop-blur-sm',
                            'animate-in fade-in-0 zoom-in-95 data-[leave]:animate-out data-[leave]:fade-out-0 data-[leave]:zoom-out-95',
                        )}
                    >
                        {/* Model Selector */}
                        <div className="border-b border-border-medium/50 px-3 py-2.5">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Cpu className="h-3.5 w-3.5 text-text-secondary" />
                                <span className="text-xs font-medium text-text-secondary">Modelo IA</span>
                            </div>
                            <Ariakit.SelectProvider
                                value={sessionModel}
                                setValue={(val) => setSessionModel(val)}
                            >
                                <Ariakit.Select
                                    onClick={(e) => e.stopPropagation()}
                                    className={cn(
                                        'flex w-full items-center justify-between gap-2 rounded-lg',
                                        'border border-border-medium bg-surface-secondary px-2.5 py-1.5',
                                        'text-xs text-text-primary cursor-pointer',
                                        'hover:border-teal-500/60 hover:bg-surface-hover',
                                        'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50',
                                        'transition-colors duration-150',
                                    )}
                                >
                                    <span className="truncate">{sessionModel || 'Seleccionar modelo...'}</span>
                                    <ChevronDown className="h-3 w-3 flex-shrink-0 text-text-tertiary" />
                                </Ariakit.Select>
                                <Ariakit.SelectPopover
                                    portal
                                    gutter={4}
                                    sameWidth
                                    className={cn(
                                        'z-[9999] max-h-60 overflow-y-auto rounded-xl',
                                        'border border-border-medium/70 bg-surface-primary',
                                        'shadow-2xl shadow-black/30 backdrop-blur-sm',
                                        'animate-in fade-in-0 zoom-in-95',
                                        'py-1',
                                    )}
                                >
                                    {modelList.length === 0 && (
                                        <Ariakit.SelectItem
                                            value={agentModel ?? ''}
                                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-tertiary"
                                        >
                                            {agentModel ?? 'Cargando...'}
                                        </Ariakit.SelectItem>
                                    )}
                                    {modelList.map((m) => (
                                        <Ariakit.SelectItem
                                            key={m}
                                            value={m}
                                            className={cn(
                                                'flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer',
                                                'text-text-primary hover:bg-teal-500/10 hover:text-teal-400',
                                                'transition-colors duration-100 outline-none',
                                                m === sessionModel && 'text-teal-400 bg-teal-500/10',
                                            )}
                                        >
                                            <Check
                                                className={cn(
                                                    'h-3 w-3 flex-shrink-0',
                                                    m === sessionModel ? 'text-teal-400 opacity-100' : 'opacity-0',
                                                )}
                                            />
                                            <span className="truncate">{m}</span>
                                        </Ariakit.SelectItem>
                                    ))}
                                </Ariakit.SelectPopover>
                            </Ariakit.SelectProvider>
                            {sessionModel !== agentModel && agentModel && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setSessionModel(agentModel); }}
                                    className="mt-1 text-[10px] text-text-tertiary hover:text-teal-400 underline transition-colors"
                                >
                                    Restablecer a {agentModel}
                                </button>
                            )}
                        </div>

                        {/* General Tools List */}
                        {hasGeneralTools && (
                            <div className="py-1.5 max-h-[340px] overflow-y-auto pr-1">
                                {hasWebSearch && (
                                    <Ariakit.MenuItem
                                        hideOnClick={false}
                                        render={
                                            <ToolRow
                                                id="agent-session-web-search"
                                                icon={<Globe className="h-4 w-4 text-blue-500" />}
                                                label={localize('com_ui_web_search')}
                                                checked={overrides?.web_search ?? false}
                                                onChange={() => toggleBuiltinTool('web_search')}
                                            />
                                        }
                                    />
                                )}
                                {hasFileSearch && (
                                    <Ariakit.MenuItem
                                        hideOnClick={false}
                                        render={
                                            <ToolRow
                                                id="agent-session-file-search"
                                                icon={<FolderSearch className="h-4 w-4 text-amber-500" />}
                                                label={localize('com_assistants_file_search')}
                                                checked={overrides?.file_search ?? false}
                                                onChange={() => toggleBuiltinTool('file_search')}
                                            />
                                        }
                                    />
                                )}
                                {hasCodeInterpreter && (
                                    <Ariakit.MenuItem
                                        hideOnClick={false}
                                        render={
                                            <ToolRow
                                                id="agent-session-code"
                                                icon={<TerminalSquare className="h-4 w-4 text-purple-500" />}
                                                label={localize('com_assistants_code_interpreter')}
                                                checked={overrides?.execute_code ?? false}
                                                onChange={() => toggleBuiltinTool('execute_code')}
                                            />
                                        }
                                    />
                                )}
                                
                                {generalExternalTools.map((toolId) => {
                                    const isActive = (overrides as TEphemeralAgentExtended | null)?.tools?.includes(toolId) ?? false;
                                    let displayName = toolTranslations[toolId];
                                    if (!displayName) {
                                        const lowerId = toolId.toLowerCase();
                                        if (lowerId.includes('getchemicalcid')) {
                                            displayName = 'Buscar ID de Químico';
                                        } else if (lowerId.includes('getghsclassification')) {
                                            displayName = 'Consultar Clasificación SGA';
                                        } else if (lowerId.includes('searchlocationorresource')) {
                                            displayName = 'Localizar Recursos de Emergencia';
                                        } else {
                                            displayName = toolId
                                                .split('_')
                                                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                                .join(' ');
                                        }
                                    }
                                    return (
                                        <Ariakit.MenuItem
                                            key={toolId}
                                            hideOnClick={false}
                                            render={
                                                <ToolRow
                                                    id={`agent-session-tool-${toolId}`}
                                                    icon={getToolIcon(toolId)}
                                                    label={displayName}
                                                    checked={isActive}
                                                    onChange={() => toggleExternalTool(toolId)}
                                                />
                                            }
                                        />
                                    );
                                })}
                            </div>
                        )}
                        {!hasGeneralTools && (
                            <div className="px-3 py-3 text-center">
                                <p className="text-xs text-text-tertiary">No hay herramientas generales configuradas.</p>
                            </div>
                        )}
                    </Ariakit.Menu>
                </Ariakit.MenuProvider>

                {/* ── MENÚ 2: HERRAMIENTAS DE GOOGLE WORKSPACE + PESTAÑA DE CUADERNOS NOTEBOOKLM ── */}
                {hasGoogleTools && (
                    <Ariakit.MenuProvider open={isGoogleOpen} setOpen={setIsGoogleOpen}>
                        {googleTrigger}
                        <Ariakit.Menu
                            portal
                            gutter={8}
                            className={cn(
                                'z-50 w-[330px] max-w-[92vw] overflow-hidden rounded-2xl border border-border-medium/60',
                                'bg-surface-primary shadow-xl shadow-black/15 backdrop-blur-sm',
                                'animate-in fade-in-0 zoom-in-95 data-[leave]:animate-out data-[leave]:fade-out-0 data-[leave]:zoom-out-95',
                            )}
                        >
                            {/* Barra superior de Pestañas (Conectores vs Cuadernos / 2° Cerebro) */}
                            {notebookLmTools.length > 0 && (
                                <div className="flex items-center gap-1 border-b border-border-medium/50 bg-surface-secondary/50 p-1.5">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setGoogleMenuTab('connectors');
                                        }}
                                        className={cn(
                                            'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all',
                                            googleMenuTab === 'connectors'
                                                ? 'bg-surface-primary text-text-primary shadow-xs border border-border-light'
                                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/60',
                                        )}
                                    >
                                        <span>Conectores</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setGoogleMenuTab('notebooks');
                                            if (safeAvailableNotebooks.length === 0 && !isLoadingNotebooks) {
                                                fetchNotebooks(false);
                                            }
                                        }}
                                        title={
                                            notebookSessionExpired
                                                ? 'Sesión de NotebookLM expirada. Haz clic para reconectar'
                                                : 'Cuadernos de Google NotebookLM'
                                        }
                                        className={cn(
                                            'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all min-w-0',
                                            notebookSessionExpired
                                                ? googleMenuTab === 'notebooks'
                                                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 shadow-xs border border-amber-500/40'
                                                    : 'text-amber-700 dark:text-amber-300 hover:bg-amber-500/10'
                                                : googleMenuTab === 'notebooks'
                                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-xs border border-emerald-500/30'
                                                  : 'text-text-secondary hover:text-emerald-500 hover:bg-emerald-500/10',
                                        )}
                                    >
                                        {notebookSessionExpired ? (
                                            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                                        ) : (
                                            <NotebookIcon className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                                        )}
                                        <span className="truncate">Cuadernos</span>
                                        {notebookSessionExpired ? (
                                            <span className="inline-flex h-4 min-w-[16px] flex-shrink-0 items-center justify-center rounded-md border border-rose-500/40 bg-rose-500/15 px-1 text-[10px] font-extrabold text-rose-700 dark:text-rose-300">
                                                !
                                            </span>
                                        ) : (
                                            <span
                                                className={cn(
                                                    'inline-flex h-4 min-w-[16px] flex-shrink-0 items-center justify-center rounded-md px-1 text-[10px] font-bold',
                                                    safeAssignedNotebooks.length > 0
                                                        ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                                        : 'bg-surface-tertiary text-text-secondary',
                                                )}
                                            >
                                                {safeAssignedNotebooks.length > 0
                                                    ? safeAssignedNotebooks.length
                                                    : safeAvailableNotebooks.length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* PESTAÑA 1: CONECTORES DE GOOGLE */}
                            {googleMenuTab === 'connectors' && (
                                <div className="py-1.5 max-h-[400px] overflow-y-auto pr-1">
                                    {googleTools.includes('google_antigravity') && (() => {
                                        const toolId = 'google_antigravity';
                                        const isActive = (overrides as TEphemeralAgentExtended | null)?.tools?.includes(toolId) ?? false;
                                        const displayName = toolTranslations[toolId] ?? 'Google Antigravity';
                                        return (
                                            <Ariakit.MenuItem
                                                key={toolId}
                                                hideOnClick={false}
                                                render={
                                                    <ToolRow
                                                        id={`agent-session-tool-${toolId}`}
                                                        icon={getToolIcon(toolId)}
                                                        label={displayName}
                                                        checked={isActive}
                                                        onChange={() => toggleExternalTool(toolId)}
                                                    />
                                                }
                                            />
                                        );
                                    })()}
                                    {notebookLmTools.length > 0 && (
                                        <div>
                                            <Ariakit.MenuItem
                                                hideOnClick={false}
                                                render={
                                                    <ToolRow
                                                        id="agent-session-notebooklm"
                                                        icon={
                                                            notebookSessionExpired ? (
                                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                            ) : (
                                                                <NotebookIcon className="h-4 w-4 text-emerald-600" />
                                                            )
                                                        }
                                                        label="Google NotebookLM"
                                                        subtitle={
                                                            notebookSessionExpired
                                                                ? 'Sesión expirada — Reconectar'
                                                                : nbOperational
                                                                  ? nbEmail
                                                                      ? `Conectado · ${nbEmail}`
                                                                      : 'Sesión privada activa'
                                                                  : 'Sin vincular'
                                                        }
                                                        subtitleClassName={
                                                            notebookSessionExpired
                                                                ? 'font-semibold text-amber-600 dark:text-amber-400'
                                                                : undefined
                                                        }
                                                        statusDot={
                                                            nbOperational
                                                                ? 'online'
                                                                : notebookSessionExpired
                                                                  ? 'warning'
                                                                  : 'offline'
                                                        }
                                                        statusTitle={
                                                            nbOperational
                                                                ? 'Google NotebookLM conectado y válido'
                                                                : notebookSessionExpired
                                                                  ? 'Sesión de Google NotebookLM expirada — Reconectar'
                                                                  : 'Google NotebookLM sin vincular'
                                                        }
                                                        actionButton={
                                                            notebookSessionExpired ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setIsGoogleOpen(false);
                                                                        setIsNotebookLMModalOpen(true);
                                                                    }}
                                                                    title="Reconectar sesión privada de Google NotebookLM"
                                                                    className="inline-flex shrink-0 items-center gap-0.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200 hover:bg-amber-500/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                                                >
                                                                    Reconectar
                                                                </button>
                                                            ) : undefined
                                                        }
                                                        checked={isNotebookLmActive}
                                                        onChange={toggleNotebookLm}
                                                    />
                                                }
                                            />

                                            {/* Sección desplegada debajo de Google NotebookLM cuando está activo */}
                                            {isNotebookLmActive && (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={cn(
                                                        'mx-2.5 mb-2 mt-0.5 rounded-xl border p-2.5',
                                                        notebookSessionExpired
                                                            ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-rose-500/10'
                                                            : 'border-emerald-500/25 bg-emerald-500/5',
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            {notebookSessionExpired ? (
                                                                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                                                            ) : (
                                                                <Brain className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                                                            )}
                                                            <span
                                                                className={cn(
                                                                    'truncate text-[11px] font-bold',
                                                                    notebookSessionExpired
                                                                        ? 'text-rose-700 dark:text-rose-300'
                                                                        : 'text-text-primary',
                                                                )}
                                                            >
                                                                {notebookSessionExpired
                                                                    ? 'NotebookLM expirado'
                                                                    : `2° Cerebro (${safeAssignedNotebooks.length}/${safeAvailableNotebooks.length})`}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => fetchNotebooks(true)}
                                                                disabled={isLoadingNotebooks}
                                                                title="Sincronizar cuadernos de Google NotebookLM"
                                                                className="rounded-md p-1 text-text-tertiary hover:bg-surface-hover hover:text-emerald-500 transition-colors"
                                                            >
                                                                <RefreshCw
                                                                    className={cn(
                                                                        'h-3 w-3',
                                                                        isLoadingNotebooks && 'animate-spin text-emerald-500',
                                                                    )}
                                                                />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setGoogleMenuTab('notebooks')}
                                                                className={cn(
                                                                    'rounded-lg px-2 py-0.5 text-[10px] font-bold transition-colors',
                                                                    notebookSessionExpired
                                                                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25'
                                                                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25',
                                                                )}
                                                            >
                                                                Pestaña →
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {notebookSessionExpired ? (
                                                        <div className="flex flex-col items-start gap-2 pt-0.5">
                                                            <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-snug break-words">
                                                                {nbSyncWarning ||
                                                                    'Sesión de NotebookLM expirada. Reconéctala para consultar tus cuadernos.'}
                                                            </p>
                                                            <div className="flex w-full flex-wrap items-center justify-start gap-2">
                                                                <ExpandableButton
                                                                    size="sm"
                                                                    variant="amber"
                                                                    icon={<RefreshCw className="h-3.5 w-3.5" />}
                                                                    badge="Reconectar"
                                                                    label="Abrir NotebookLM"
                                                                    title="Sesión de NotebookLM expirada. Haz clic para reconectar"
                                                                    onClick={() => {
                                                                        setIsGoogleOpen(false);
                                                                        setIsNotebookLMModalOpen(true);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : !nbConnected && !isLoadingNotebooks ? (
                                                        <div className="flex flex-col items-start gap-2 pt-0.5">
                                                            <p className="text-[11px] text-text-secondary leading-tight">
                                                                Conecta tu Google NotebookLM para elegir qué cuadernos usará este agente.
                                                            </p>
                                                            <div className="flex w-full flex-wrap items-center justify-start gap-2">
                                                                <ExpandableButton
                                                                    size="sm"
                                                                    variant="emerald"
                                                                    icon={<Link2 className="h-3.5 w-3.5" />}
                                                                    badge="Vincular"
                                                                    label="Vincular mi NotebookLM"
                                                                    title="Vincular mi NotebookLM"
                                                                    onClick={() => {
                                                                        setIsGoogleOpen(false);
                                                                        setIsNotebookLMModalOpen(true);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : isLoadingNotebooks && safeAvailableNotebooks.length === 0 ? (
                                                        <div className="flex items-center gap-2 py-2 text-[11px] text-text-secondary">
                                                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                                                            <span>Cargando cuadernos disponibles...</span>
                                                        </div>
                                                    ) : safeAvailableNotebooks.length === 0 ? (
                                                        <div className="flex items-center justify-between gap-2 py-1">
                                                            <span className="text-[11px] text-text-tertiary">
                                                                No se detectaron cuadernos.
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => fetchNotebooks(true)}
                                                                className="text-[11px] font-semibold text-emerald-500 hover:underline"
                                                            >
                                                                Sincronizar
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1 max-h-[145px] overflow-y-auto pr-0.5">
                                                            {safeAvailableNotebooks.map((nb) => {
                                                                const isAssigned = safeAssignedNotebooks.some(
                                                                    (item) => item?.id === nb?.id,
                                                                );
                                                                return (
                                                                    <button
                                                                        key={nb.id}
                                                                        type="button"
                                                                        onClick={() => toggleNotebookForAgent(nb)}
                                                                        className={cn(
                                                                            'flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-all',
                                                                            isAssigned
                                                                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30'
                                                                                : 'hover:bg-surface-hover text-text-secondary border border-transparent',
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                                            <span className="flex-shrink-0 text-sm">
                                                                                {nb?.emoji || '📓'}
                                                                            </span>
                                                                            <span className="truncate text-[11px]">
                                                                                {nb?.title || 'Sin título'}
                                                                            </span>
                                                                        </div>
                                                                        <div
                                                                            className={cn(
                                                                                'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                                                                                isAssigned
                                                                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                                                                    : 'border-border-medium bg-surface-primary',
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
                                    )}
                                    {googleTools
                                        .filter((toolId) => toolId !== 'google_antigravity')
                                        .map((toolId) => {
                                            const isActive = (overrides as TEphemeralAgentExtended | null)?.tools?.includes(toolId) ?? false;
                                            const isFlow = toolId === 'google_flow';
                                            const displayName = toolTranslations[toolId] ?? toolId
                                                .split('_')
                                                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                                .join(' ');
                                            return (
                                                <Ariakit.MenuItem
                                                    key={toolId}
                                                    hideOnClick={false}
                                                    render={
                                                        <ToolRow
                                                            id={`agent-session-tool-${toolId}`}
                                                            icon={
                                                                isFlow && flowSessionExpired ? (
                                                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                                ) : (
                                                                    getToolIcon(toolId)
                                                                )
                                                            }
                                                            label={displayName}
                                                            subtitle={
                                                                isFlow
                                                                    ? flowSessionExpired
                                                                        ? 'Sesión expirada — Reconectar'
                                                                        : flowOperational
                                                                          ? flowEmail
                                                                              ? `Conectado · ${flowEmail}`
                                                                              : 'Sesión privada activa'
                                                                          : 'Sin vincular'
                                                                    : undefined
                                                            }
                                                            subtitleClassName={
                                                                isFlow && flowSessionExpired
                                                                    ? 'font-semibold text-amber-600 dark:text-amber-400'
                                                                    : undefined
                                                            }
                                                            statusDot={
                                                                isFlow
                                                                    ? flowOperational
                                                                        ? 'online'
                                                                        : flowSessionExpired
                                                                          ? 'warning'
                                                                          : 'offline'
                                                                    : undefined
                                                            }
                                                            statusTitle={
                                                                isFlow
                                                                    ? flowOperational
                                                                        ? 'Google Flow conectado y válido'
                                                                        : flowSessionExpired
                                                                          ? 'Sesión de Google Flow expirada — Reconectar'
                                                                          : 'Google Flow sin vincular'
                                                                    : undefined
                                                            }
                                                            actionButton={
                                                                isFlow && flowSessionExpired ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setIsGoogleOpen(false);
                                                                            setIsGoogleFlowModalOpen(true);
                                                                        }}
                                                                        title="Reconectar sesión privada de Google Flow"
                                                                        className="inline-flex shrink-0 items-center gap-0.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200 hover:bg-amber-500/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                                                    >
                                                                        Reconectar
                                                                    </button>
                                                                ) : isFlow && !flowConnected ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setIsGoogleOpen(false);
                                                                            setIsGoogleFlowModalOpen(true);
                                                                        }}
                                                                        title="Vincular cuenta privada de Google Flow"
                                                                        className="inline-flex shrink-0 items-center gap-0.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                                                    >
                                                                        Conectar
                                                                    </button>
                                                                ) : undefined
                                                            }
                                                            checked={isActive}
                                                            onChange={() => {
                                                                if (!isActive && !isProOrAdmin && toolId !== 'google_flow') {
                                                                    setIsUpgradeModalOpen(true);
                                                                } else {
                                                                    toggleExternalTool(toolId);
                                                                }
                                                            }}
                                                        />
                                                    }
                                                />
                                            );
                                        })}
                                </div>
                            )}

                            {/* PESTAÑA 2: CUADERNOS DISPONIBLES (SEGUNDO CEREBRO POR AGENTE) */}
                            {googleMenuTab === 'notebooks' && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex flex-col p-3 overflow-x-hidden"
                                >
                                    {/* Cabecera del Segundo Cerebro del Agente */}
                                    <div
                                        className={cn(
                                            'mb-2.5 rounded-xl border p-2.5',
                                            notebookSessionExpired
                                                ? 'border-amber-500/35 bg-amber-500/10'
                                                : 'border-emerald-500/25 bg-emerald-500/10',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div
                                                    className={cn(
                                                        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
                                                        notebookSessionExpired
                                                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                                            : 'bg-emerald-500/20 text-emerald-500',
                                                    )}
                                                >
                                                    {notebookSessionExpired ? (
                                                        <AlertTriangle className="h-4 w-4" />
                                                    ) : (
                                                        <Brain className="h-4 w-4" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-bold text-text-primary">
                                                        2° Cerebro: {agentName || 'Agente Activo'}
                                                    </p>
                                                    <p
                                                        className={cn(
                                                            'text-[10px] font-medium break-words',
                                                            notebookSessionExpired
                                                                ? 'text-rose-700 dark:text-rose-300'
                                                                : 'text-emerald-600 dark:text-emerald-400',
                                                        )}
                                                    >
                                                        {notebookSessionExpired
                                                            ? 'Sesión de NotebookLM expirada — requiere reconectar'
                                                            : safeAssignedNotebooks.length > 0
                                                              ? `${safeAssignedNotebooks.length} cuaderno(s) asignado(s) como fuente`
                                                              : 'Elige cuadernos para este especialista'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => fetchNotebooks(true)}
                                                disabled={isLoadingNotebooks}
                                                title="Actualizar cuadernos desde Google NotebookLM"
                                                className={cn(
                                                    'flex shrink-0 items-center gap-1 rounded-lg border bg-surface-primary px-2 py-1 text-[10px] font-semibold transition-colors',
                                                    notebookSessionExpired
                                                        ? 'border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10'
                                                        : 'border-emerald-500/30 text-text-secondary hover:border-emerald-500 hover:text-emerald-500',
                                                )}
                                            >
                                                <RefreshCw
                                                    className={cn(
                                                        'h-3 w-3',
                                                        isLoadingNotebooks &&
                                                            (notebookSessionExpired
                                                                ? 'animate-spin text-amber-500'
                                                                : 'animate-spin text-emerald-500'),
                                                    )}
                                                />
                                                <span>Sync</span>
                                            </button>
                                        </div>
                                        <p className="mt-1.5 text-[10px] text-text-secondary leading-snug">
                                            Asigna cuadernos específicos a cada agente como su fuente de información.{' '}
                                            <strong className="text-text-primary">Tenshi</strong> siempre tiene acceso total a todos tus cuadernos.
                                        </p>
                                    </div>

                                    {/* Aviso compacto de sesión expirada con botón directo a reconexión */}
                                    {notebookSessionExpired && (
                                        <div className="mb-2.5 flex flex-col items-start gap-2 rounded-xl border border-rose-500/35 bg-gradient-to-r from-amber-500/10 to-rose-500/10 p-2.5">
                                            <div className="flex w-full min-w-0 items-start gap-2">
                                                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11px] font-bold leading-snug text-rose-700 dark:text-rose-300">
                                                        Sesión de NotebookLM expirada
                                                    </p>
                                                    <p className="mt-0.5 break-words text-[10px] leading-snug text-amber-800 dark:text-amber-200">
                                                        {nbSyncWarning ||
                                                            'Google cerró o bloqueó tu sesión anterior. Reconéctala en 1 clic para que Tenshi pueda leer tus cuadernos.'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex w-full flex-wrap items-center justify-start gap-2">
                                                <ExpandableButton
                                                    size="sm"
                                                    variant="amber"
                                                    icon={<RefreshCw className="h-3.5 w-3.5" />}
                                                    badge="Reconectar"
                                                    label="Abrir modal de NotebookLM"
                                                    title="Sesión de NotebookLM expirada. Haz clic para reconectar"
                                                    onClick={() => {
                                                        setIsGoogleOpen(false);
                                                        setIsNotebookLMModalOpen(true);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Aviso compacto de cookies DBSC (~1 hora) cuando la sesión aún es válida */}
                                    {!notebookSessionExpired && nbConnected && nbDbscBound && (
                                        <div className="mb-2.5 flex flex-col items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-amber-800 dark:text-amber-200">
                                            <div className="flex w-full min-w-0 items-start gap-2">
                                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                                                <p className="min-w-0 flex-1 break-words text-[10px] leading-snug">
                                                    Sesión con bloqueo temporal DBSC de Chrome (~1 hora). Usa el{' '}
                                                    <strong>Conector Automático 1-Clic</strong> para mantenerla estable por meses.
                                                </p>
                                            </div>
                                            <div className="flex w-full flex-wrap items-center justify-start gap-2">
                                                <ExpandableButton
                                                    size="sm"
                                                    variant="amber"
                                                    icon={<Sparkles className="h-3.5 w-3.5" />}
                                                    badge="1-Clic"
                                                    label="Reconectar sin DBSC"
                                                    title="Abrir modal para reconectar sin bloqueo DBSC"
                                                    onClick={() => {
                                                        setIsGoogleOpen(false);
                                                        setIsNotebookLMModalOpen(true);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {!isNotebookLmActive && (
                                        <div className="mb-2.5 flex flex-col items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-2">
                                            <span className="w-full break-words text-[11px] font-medium text-amber-700 dark:text-amber-300">
                                                Google NotebookLM está desactivado en este chat.
                                            </span>
                                            <div className="flex w-full flex-wrap items-center justify-start gap-2">
                                                <ExpandableButton
                                                    size="sm"
                                                    variant="emerald"
                                                    icon={<Check className="h-3.5 w-3.5" />}
                                                    badge="Activar"
                                                    label="Activar NotebookLM"
                                                    onClick={toggleNotebookLm}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {!nbConnected && !notebookSessionExpired && !isLoadingNotebooks ? (
                                        <div className="flex flex-col items-center justify-center rounded-xl border border-border-medium/60 bg-surface-secondary/50 p-4 text-center">
                                            <NotebookIcon className="mb-2 h-7 w-7 text-emerald-500" />
                                            <p className="text-xs font-bold text-text-primary">
                                                Conecta tu Google NotebookLM
                                            </p>
                                            <p className="mt-1 mb-3 text-[11px] text-text-secondary">
                                                Vincula tu sesión privada para ver tus cuadernos disponibles y asignarlos como Segundo Cerebro a cada agente.
                                            </p>
                                            <div className="flex flex-wrap items-center justify-center gap-2">
                                                <ExpandableButton
                                                    size="md"
                                                    variant="emerald"
                                                    icon={<Link2 className="h-4 w-4" />}
                                                    badge="Conectar"
                                                    label="Conectar Google NotebookLM"
                                                    onClick={() => {
                                                        setIsGoogleOpen(false);
                                                        setIsNotebookLMModalOpen(true);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Buscador y acciones rápidas */}
                                            {safeAvailableNotebooks.length > 0 && (
                                                <div className="mb-2 flex items-center gap-1.5">
                                                    <div className="relative flex-1 min-w-0">
                                                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-text-tertiary" />
                                                        <input
                                                            type="text"
                                                            value={notebookSearch}
                                                            onChange={(e) => setNotebookSearch(e.target.value)}
                                                            placeholder="Buscar cuaderno..."
                                                            className="w-full rounded-lg border border-border-medium bg-surface-secondary pl-7 pr-2 py-1 text-xs text-text-primary placeholder:text-text-tertiary focus:border-emerald-500 focus:outline-none"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => saveAssignedNotebooks(safeAvailableNotebooks)}
                                                        disabled={isSavingNotebooks}
                                                        className="shrink-0 rounded-lg border border-border-medium bg-surface-secondary px-2 py-1 text-[10px] font-semibold text-text-secondary hover:border-emerald-500/50 hover:text-emerald-500 transition-colors"
                                                    >
                                                        Todos
                                                    </button>
                                                    {safeAssignedNotebooks.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => saveAssignedNotebooks([])}
                                                            disabled={isSavingNotebooks}
                                                            className="shrink-0 rounded-lg border border-border-medium bg-surface-secondary px-2 py-1 text-[10px] font-semibold text-text-tertiary hover:text-red-400 transition-colors"
                                                        >
                                                            Limpiar
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {!notebookSessionExpired && nbSyncWarning && (
                                                <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[10px] text-amber-700 dark:text-amber-300">
                                                    <span className="truncate">{nbSyncWarning}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsGoogleOpen(false);
                                                            setIsNotebookLMModalOpen(true);
                                                        }}
                                                        className="flex-shrink-0 font-bold underline"
                                                    >
                                                        Reconectar
                                                    </button>
                                                </div>
                                            )}

                                            {/* Lista de cuadernos disponibles */}
                                            <div className="max-h-[240px] space-y-1.5 overflow-y-auto pr-0.5">
                                                {isLoadingNotebooks && safeAvailableNotebooks.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                                        <RefreshCw className="mb-2 h-5 w-5 animate-spin text-emerald-500" />
                                                        <p className="text-xs text-text-secondary">
                                                            Sincronizando tus cuadernos de NotebookLM...
                                                        </p>
                                                    </div>
                                                ) : filteredNotebooks.length === 0 ? (
                                                    <div className="rounded-xl border border-border-light bg-surface-secondary/40 p-4 text-center">
                                                        <p className="text-xs text-text-secondary">
                                                            {notebookSearch
                                                                ? 'Ningún cuaderno coincide con tu búsqueda.'
                                                                : notebookSessionExpired
                                                                  ? 'Reconecta tu sesión para sincronizar tus cuadernos.'
                                                                  : 'No se encontraron cuadernos en tu cuenta de NotebookLM.'}
                                                        </p>
                                                        {notebookSessionExpired ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setIsGoogleOpen(false);
                                                                    setIsNotebookLMModalOpen(true);
                                                                }}
                                                                className="mt-2 inline-flex items-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-200 hover:bg-amber-500/25 transition-colors cursor-pointer"
                                                            >
                                                                <RefreshCw className="h-3 w-3" />
                                                                <span>Reconectar sesión</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => fetchNotebooks(true)}
                                                                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 hover:underline"
                                                            >
                                                                <RefreshCw className="h-3 w-3" />
                                                                <span>Volver a sincronizar</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    filteredNotebooks.map((nb) => {
                                                        const isAssigned = safeAssignedNotebooks.some(
                                                            (item) => item?.id === nb?.id,
                                                        );
                                                        return (
                                                            <button
                                                                key={nb.id}
                                                                type="button"
                                                                onClick={() => toggleNotebookForAgent(nb)}
                                                                className={cn(
                                                                    'flex w-full items-center justify-between gap-2.5 rounded-xl border p-2 text-left transition-all',
                                                                    isAssigned
                                                                        ? 'border-emerald-500/40 bg-emerald-500/10 shadow-2xs'
                                                                        : 'border-border-light bg-surface-secondary/40 hover:border-border-medium hover:bg-surface-hover',
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-surface-primary text-base shadow-2xs">
                                                                        {nb?.emoji || '📓'}
                                                                    </span>
                                                                    <div className="min-w-0">
                                                                        <p
                                                                            className={cn(
                                                                                'truncate text-xs',
                                                                                isAssigned
                                                                                    ? 'font-bold text-emerald-700 dark:text-emerald-300'
                                                                                    : 'font-medium text-text-primary',
                                                                            )}
                                                                        >
                                                                            {nb?.title || 'Sin título'}
                                                                        </p>
                                                                        <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
                                                                            <span>
                                                                                {nb?.sources_count ?? 0} fuente(s)
                                                                            </span>
                                                                            {isAssigned && (
                                                                                <span className="rounded bg-emerald-500/20 px-1 py-0.2 font-semibold text-emerald-600 dark:text-emerald-400">
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
                                                                            : 'border-border-medium bg-surface-primary',
                                                                    )}
                                                                >
                                                                    {isAssigned && <Check className="h-3 w-3" />}
                                                                </div>
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            {/* Pie de pestaña con estado de cuenta y enlace a configuración */}
                                            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border-medium/40 pt-2 text-[10px] text-text-tertiary">
                                                <span
                                                    className={cn(
                                                        'truncate max-w-[180px]',
                                                        notebookSessionExpired && 'font-semibold text-rose-600 dark:text-rose-400',
                                                    )}
                                                    title={
                                                        notebookSessionExpired
                                                            ? `Sesión expirada${nbEmail ? ` (${nbEmail})` : ''}`
                                                            : nbOperational
                                                              ? nbEmail
                                                                  ? `Conectado: ${nbEmail}`
                                                                  : 'Sesión privada activa'
                                                              : undefined
                                                    }
                                                >
                                                    {notebookSessionExpired
                                                        ? `Sesión expirada${nbEmail ? ` (${nbEmail})` : ''}`
                                                        : nbOperational
                                                          ? nbEmail
                                                              ? `Conectado: ${nbEmail}`
                                                              : 'Sesión privada activa'
                                                          : isLoadingNotebooks
                                                            ? 'Verificando sesión...'
                                                            : 'Sin vincular'}
                                                </span>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsGoogleOpen(false);
                                                            setIsNotebookLMModalOpen(true);
                                                        }}
                                                        className={cn(
                                                            'font-semibold transition-colors',
                                                            notebookSessionExpired
                                                                ? 'text-amber-600 dark:text-amber-400 hover:underline'
                                                                : 'text-text-secondary hover:text-emerald-500',
                                                        )}
                                                    >
                                                        {notebookSessionExpired ? 'Reconectar' : 'Configurar'}
                                                    </button>
                                                    <a
                                                        href="https://notebooklm.google.com"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-0.5 font-semibold text-emerald-500 hover:underline"
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
                        </Ariakit.Menu>
                    </Ariakit.MenuProvider>
                )}

                {/* ── PESTAÑA RÁPIDA EN BARRA DE CHAT: CUADERNOS / SEGUNDO CEREBRO (cuando NotebookLM está activo) ── */}
                {hasGoogleTools && isNotebookLmActive && (
                    <TooltipAnchor
                        render={
                            <button
                                type="button"
                                id="notebooklm-quick-tab-button"
                                title={
                                    notebookSessionExpired
                                        ? 'Sesión de NotebookLM expirada. Haz clic para reconectar'
                                        : safeAssignedNotebooks.length > 0
                                          ? `Cuadernos (${safeAssignedNotebooks.length}) activos en Segundo Cerebro`
                                          : 'Abrir pestaña de Cuadernos de NotebookLM'
                                }
                                aria-label={
                                    notebookSessionExpired
                                        ? 'Sesión de NotebookLM expirada. Haz clic para reconectar'
                                        : 'Cuadernos de Google NotebookLM (Segundo Cerebro)'
                                }
                                onClick={() => {
                                    setGoogleMenuTab('notebooks');
                                    setIsGoogleOpen(true);
                                    if (safeAvailableNotebooks.length === 0 && !isLoadingNotebooks) {
                                        fetchNotebooks(false);
                                    }
                                }}
                                className={cn(
                                    'flex h-8 items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 focus:outline-none shrink-0',
                                    notebookSessionExpired
                                        ? 'border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-rose-500/25 hover:bg-amber-500/25 hover:border-rose-500/50'
                                        : safeAssignedNotebooks.length > 0
                                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                                          : 'border-border-medium/60 bg-surface-secondary/70 text-text-secondary hover:border-emerald-500/40 hover:text-emerald-500',
                                )}
                            >
                                {notebookSessionExpired ? (
                                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                                ) : (
                                    <NotebookIcon className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                                )}
                                <span className="hidden sm:inline max-w-[165px] truncate">
                                    {notebookSessionExpired
                                        ? 'Cuadernos (Reconectar)'
                                        : safeAssignedNotebooks.length > 0
                                          ? `Cuadernos (${safeAssignedNotebooks.length})`
                                          : 'Cuadernos'}
                                </span>
                                {notebookSessionExpired ? (
                                    <span className="sm:hidden inline-flex h-4 min-w-[16px] items-center justify-center rounded-md border border-rose-500/40 bg-rose-500/15 px-1 text-[10px] font-extrabold text-rose-700 dark:text-rose-300">
                                        !
                                    </span>
                                ) : safeAssignedNotebooks.length > 0 ? (
                                    <span className="sm:hidden inline-flex h-4 min-w-[16px] items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/15 px-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                        {safeAssignedNotebooks.length}
                                    </span>
                                ) : null}
                            </button>
                        }
                        id="notebooklm-quick-tab-button"
                        description={
                            notebookSessionExpired
                                ? 'Sesión de NotebookLM expirada. Haz clic para reconectar'
                                : safeAssignedNotebooks.length > 0
                                  ? `Segundo Cerebro (${safeAssignedNotebooks.length}): ${safeAssignedNotebooks
                                        .map((n) => n?.title?.trim() || 'Cuaderno')
                                        .join(', ')}${nbDbscBound ? ' · Bloqueo temporal DBSC (~1h)' : ''}`
                                  : 'Abrir pestaña de Cuadernos de NotebookLM (Segundo Cerebro del Agente)'
                        }
                    />
                )}
            </div>

            <NotebookLMModal
                isOpen={isNotebookLMModalOpen}
                onClose={() => setIsNotebookLMModalOpen(false)}
            />

            <GoogleFlowModal
                isOpen={isGoogleFlowModalOpen}
                onClose={() => setIsGoogleFlowModalOpen(false)}
            />

            {isUpgradeModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-sm duration-300 animate-in zoom-in-95">
                        <button
                            onClick={() => setIsUpgradeModalOpen(false)}
                            className="absolute -top-10 right-0 z-50 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white backdrop-blur-md hover:text-gray-300"
                        >
                            Cerrar ✕
                        </button>
                        <UpgradeWall
                            title="Integración de Google Exclusiva"
                            description="La conexión y uso de herramientas de Google Drive y Google Calendar están reservados para usuarios del plan Wappy Pro."
                            plan={user?.role || 'USER'}
                            isPopup={true}
                            hideFeatures={true}
                        />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
