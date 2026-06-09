import React, { useState, useMemo } from 'react';
import * as Ariakit from '@ariakit/react';
import { Settings2, Globe, FolderSearch, TerminalSquare, Wrench, Cpu, Check, ChevronDown } from 'lucide-react';
import type { TEphemeralAgent } from 'librechat-data-provider';
import { useGetModelsQuery } from 'librechat-data-provider/react-query';
import { TooltipAnchor } from '@librechat/client';
import { useAgentSessionOverrides } from '~/hooks/Agents';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

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

/* ─── Main Panel ──────────────────────────────────────────────────────── */
export default function AgentSessionPanel({ agentId, conversationId }: AgentSessionPanelProps) {
    const localize = useLocalize();
    const [isOpen, setIsOpen] = useState(false);

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
                    <div className="py-1.5">
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
                                editor_live: 'Editor Live',
                                editor_rit: 'Editor RIT',
                                canvas: 'Canvas',
                                consultar_analitica_psicosocial: 'Consultar Analítica Psicosocial',
                                consultar_analitica_actos_condiciones: 'Analítica de Actos y Condiciones'
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
                                            icon={<Wrench className="h-4 w-4 text-text-secondary" />}
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
                {!hasAnyTools && (
                    <div className="px-3 py-3 text-center">
                        <p className="text-xs text-text-tertiary">Este agente no tiene herramientas adicionales configuradas.</p>
                    </div>
                )}
            </Ariakit.Menu>
        </Ariakit.MenuProvider>
    );
}
