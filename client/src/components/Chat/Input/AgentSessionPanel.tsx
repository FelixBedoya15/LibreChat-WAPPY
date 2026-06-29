import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as Ariakit from '@ariakit/react';
import {
    Settings2, Globe, FolderSearch, TerminalSquare, Wrench, Cpu, Check, ChevronDown,
    FileText, Calculator, Brain, HardHat, ShieldCheck, Palette, BarChart3, Cloud, Calendar, Mail, FileSpreadsheet, Presentation,
    HeartPulse, ShieldAlert, Car, FlaskConical, FileEdit, Scale, BookOpen, UserCheck, Heart, Activity,
    Search, Youtube, Image, Binary, Compass, CloudSun, GitFork
} from 'lucide-react';
import type { TEphemeralAgent } from 'librechat-data-provider';
import { useGetModelsQuery } from 'librechat-data-provider/react-query';
import { TooltipAnchor } from '@librechat/client';
import { useAgentSessionOverrides } from '~/hooks/Agents';
import { useLocalize, useAuthContext } from '~/hooks';
import { cn } from '~/utils';
import { UpgradeWall } from '~/components/SGSST/UpgradeWall';

/** Extended version while data-provider package is being rebuilt */
type TEphemeralAgentExtended = TEphemeralAgent & {
    model?: string;
    tools?: string[];
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
    checked,
    onChange,
    id,
}: {
    icon: React.ReactNode;
    label: string;
    checked: boolean;
    onChange: () => void;
    id: string;
}) {
    return (
        <div className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-surface-hover rounded-lg">
            <label
                htmlFor={id}
                className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary"
            >
                {icon}
                <span>{label}</span>
            </label>
            <ToggleSwitch id={id} checked={checked} onChange={onChange} />
        </div>
    );
}

/* ─── Tool Icon Resolver ──────────────────────────────────────────────── */
const getToolIcon = (toolId: string) => {
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

        // --- Google Suite ---
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
    const { user } = useAuthContext();
    const isProOrAdmin = user?.role === 'ADMIN' || user?.role === 'USER_PRO';
    const [isOpen, setIsOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    const {
        hasWebSearch,
        hasFileSearch,
        hasCodeInterpreter,
        externalTools,
        overrides,
        toggleBuiltinTool,
        toggleExternalTool,
        setSessionModel,
        agentModel,
        agentProvider,
    } = useAgentSessionOverrides({ agentId, conversationId });

    const modelsQuery = useGetModelsQuery();
    const modelList = useMemo(() => {
        const data = modelsQuery.data ?? {};
        const allModels = new Set<string>();
        Object.values(data).forEach((list) => {
            if (Array.isArray(list)) {
                list.forEach((m) => allModels.add(m));
            }
        });
        const providerModels = agentProvider ? (data[agentProvider] ?? []) : [];
        return providerModels.length > 0 ? providerModels : [...allModels].sort();
    }, [modelsQuery.data, agentProvider]);

    const hasAnyTools = hasWebSearch || hasFileSearch || hasCodeInterpreter || externalTools.length > 0;
    const sessionModel = (overrides as TEphemeralAgentExtended | null)?.model ?? agentModel ?? '';

    const trigger = (
        <TooltipAnchor
            render={
                <Ariakit.MenuButton
                    id="agent-session-panel-button"
                    aria-label="Opciones de sesión del agente"
                    className={cn(
                        'flex size-9 items-center justify-center rounded-full p-1 transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50',
                        isOpen && 'bg-surface-hover',
                    )}
                >
                    <Settings2 className="icon-md" />
                </Ariakit.MenuButton>
            }
            id="agent-session-panel-button"
            description={localize('com_ui_tools') + ' · Sesión'}
        />
    );

    return (
        <>
            <Ariakit.MenuProvider open={isOpen} setOpen={setIsOpen}>
                {trigger}
                <Ariakit.Menu
                    portal
                    gutter={8}
                    className={cn(
                        'z-50 min-w-[240px] max-w-[300px] overflow-hidden rounded-2xl border border-border-medium/60',
                        'bg-surface-primary shadow-xl shadow-black/10 backdrop-blur-sm',
                        'animate-in fade-in-0 zoom-in-95 data-[leave]:animate-out data-[leave]:fade-out-0 data-[leave]:zoom-out-95',
                    )}
                >
                    {/* ── Model Selector ── */}
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

                    {/* ── Tools ── */}
                    {hasAnyTools && (
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
                            {externalTools.map((toolId) => {
                                const isActive = (overrides as TEphemeralAgentExtended | null)?.tools?.includes(toolId) ?? false;
                                const toolTranslations: Record<string, string> = {
                                    context: 'Contexto',
                                    calculator: 'Calculadora',
                                    memory: 'Memoria',
                                    somos_sst: 'Somos SST',
                                    matriz_ipevar: 'Matriz IPEVAR',
                                    matriz_pesv: 'Matriz PESV',
                                    matriz_compatibilidad: 'Compatibilidad Química',
                                    editor_live: 'Editor Live',
                                    editor_rit: 'Editor RIT',
                                    canvas: 'Canvas',
                                    blog_editor: 'Gestor de Blog',
                                    consultar_agente_especializado: 'Consultar Especialista',
                                    consultar_analitica_psicosocial: 'Consultar Analítica Psicosocial',
                                    consultar_analitica_actos_condiciones: 'Analítica de Actos y Condiciones',
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
                                                icon={getToolIcon(toolId)}
                                                label={displayName}
                                                checked={isActive}
                                                onChange={() => {
                                                    if ((toolId === 'google_drive' || toolId === 'google_calendar' || toolId === 'google_gmail' || toolId === 'google_sheets' || toolId === 'google_docs' || toolId === 'google_slides') && !isActive && !isProOrAdmin) {
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
                    {!hasAnyTools && (
                        <div className="px-3 py-3 text-center">
                            <p className="text-xs text-text-tertiary">Este agente no tiene herramientas adicionales configuradas.</p>
                        </div>
                    )}
                </Ariakit.Menu>
            </Ariakit.MenuProvider>
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
