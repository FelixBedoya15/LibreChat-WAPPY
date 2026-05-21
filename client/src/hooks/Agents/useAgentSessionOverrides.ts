import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRecoilState } from 'recoil';
import { Tools, Constants } from 'librechat-data-provider';
import type { TEphemeralAgent } from 'librechat-data-provider';
import { useGetAgentByIdQuery } from '~/data-provider';
import { ephemeralAgentByConvoId } from '~/store';

const BUILTIN_TOOLS = new Set([
    Tools.file_search,
    Tools.web_search,
    Tools.execute_code,
    Tools.code_interpreter,
    Tools.memory,
]);

/** Extended version while data-provider package is being rebuilt */
type TEphemeralAgentExtended = TEphemeralAgent & {
    model?: string;
    tools?: string[];
    _defaultsApplied?: string; // tracks which agentId defaults have been applied
};

interface UseAgentSessionOverridesProps {
    agentId?: string | null;
    conversationId?: string | null;
}

export interface AgentSessionOverrides {
    /** Tools the agent has configured (only built-in toggleable ones) */
    hasWebSearch: boolean;
    hasFileSearch: boolean;
    hasCodeInterpreter: boolean;
    /** External (non-builtin) tool IDs the agent has */
    externalTools: string[];
    /** Current ephemeral overrides */
    overrides: TEphemeralAgent | null;
    /** Toggle a built-in tool (web_search, file_search, execute_code) */
    toggleBuiltinTool: (toolKey: 'web_search' | 'file_search' | 'execute_code') => void;
    /** Toggle an external tool by id */
    toggleExternalTool: (toolId: string) => void;
    /** Override the model for this session */
    setSessionModel: (model: string) => void;
    /** Agent's original model (fallback) */
    agentModel: string | null;
    /** Agent's original provider */
    agentProvider: string | undefined;
}

export default function useAgentSessionOverrides({
    agentId,
    conversationId,
}: UseAgentSessionOverridesProps): AgentSessionOverrides {
    const key = conversationId ?? Constants.NEW_CONVO;
    const [ephemeralAgent, setEphemeralAgent] = useRecoilState(ephemeralAgentByConvoId(key));

    const { data: agent } = useGetAgentByIdQuery(agentId);

    const { hasWebSearch, hasFileSearch, hasCodeInterpreter, externalTools } = useMemo(() => {
        const tools = agent?.tools ?? [];
        
        // Merge currently active session overrides. This ensures that if a chat already has 
        // a tool active (like matriz_ipevar), the new agent inherits the ability to use it
        // and the UI toggle remains visible.
        const activeOverrides = (ephemeralAgent as TEphemeralAgentExtended | null)?.tools ?? [];
        const combinedTools = Array.from(new Set([...tools, ...activeOverrides]));
        
        const toolSet = new Set(combinedTools);
        const external = combinedTools.filter((t) => !BUILTIN_TOOLS.has(t as Tools));
        return {
            hasWebSearch: toolSet.has(Tools.web_search),
            hasFileSearch: toolSet.has(Tools.file_search),
            hasCodeInterpreter: toolSet.has(Tools.execute_code) || toolSet.has(Tools.code_interpreter),
            externalTools: external,
        };
    }, [agent, ephemeralAgent]);

    // Track which agent we've already applied defaults for (avoids re-applying on every render)
    const defaultsAppliedRef = useRef<string>('');

    /**
     * Auto-activate all agent tools on first load.
     * - Built-in tools: web_search, file_search, execute_code are set to true.
     * - External tools (context, etc.): added to the tools array.
     * Only runs once per agentId+conversationId combination.
     */
    useEffect(() => {
        if (!agentId || !agent) return;

        const appliedKey = `${agentId}:${key}`;
        if (defaultsAppliedRef.current === appliedKey) return;

        const ext = agent.tools?.filter((t) => !BUILTIN_TOOLS.has(t as Tools)) ?? [];

        setEphemeralAgent((prev) => {
            const prevExt = prev as TEphemeralAgentExtended | null;
            // If we've already applied defaults for this agent in this session, skip
            if (prevExt?._defaultsApplied === appliedKey) return prev;

            const updates: Partial<TEphemeralAgentExtended> = {
                _defaultsApplied: appliedKey,
            };

            // Activate built-in tools if the agent has them
            const toolSet = new Set(agent.tools ?? []);
            if (toolSet.has(Tools.web_search)) updates[Tools.web_search] = true;
            if (toolSet.has(Tools.file_search)) updates[Tools.file_search] = true;
            if (toolSet.has(Tools.execute_code) || toolSet.has(Tools.code_interpreter)) {
                updates[Tools.execute_code] = true;
            }

            // Activate external tools by merging them into the tools array.
            // NOTE: 'editor_live' and 'matriz_ipevar' are intentionally excluded
            // from auto-activation so their panels start closed and the user
            // controls them via the toggle in the chat input.
            const PANEL_TOOLS = new Set(['editor_live', 'matriz_ipevar', 'somos_sst', 'editor_rit', 'canvas']);
            const autoActivateExt = ext.filter((t) => !PANEL_TOOLS.has(t));
            
            // ALWAYS preserve previously active tools when switching agents!
            // BUT: panel tools (editor_live, editor_rit, canvas, matriz_ipevar, etc.)
            // must only be preserved if the NEW agent explicitly supports them.
            // Without this filter, stale editor_live/editor_rit from a previous
            // session block the Canvas panel even when the agent only has canvas.
            const newAgentToolSet = new Set(agent.tools ?? []);
            const PANEL_TOOLS_SET = new Set([
              'editor_live', 'editor_rit', 'canvas', 'matriz_ipevar', 'somos_sst',
            ]);
            const prevTools = (prevExt?.tools ?? []).filter((t) => {
              if (!PANEL_TOOLS_SET.has(t)) return true; // Always keep non-panel tools
              return newAgentToolSet.has(t); // Panel tools: only if new agent supports them
            });
            const merged = Array.from(new Set([...prevTools, ...autoActivateExt]));
            updates.tools = merged;

            return { ...(prev ?? {}), ...updates } as TEphemeralAgent;
        });

        defaultsAppliedRef.current = appliedKey;
    }, [agentId, agent, key, setEphemeralAgent]);

    const toggleBuiltinTool = useCallback(
        (toolKey: 'web_search' | 'file_search' | 'execute_code') => {
            setEphemeralAgent((prev) => ({
                ...(prev ?? {}),
                [toolKey]: !prev?.[toolKey],
            }));
        },
        [setEphemeralAgent],
    );

    const toggleExternalTool = useCallback(
        (toolId: string) => {
            setEphemeralAgent((prev) => {
                const prevExt = prev as TEphemeralAgentExtended | null;
                const prevTools = prevExt?.tools ?? [];
                const isActive = prevTools.includes(toolId);
                const nextTools = isActive
                    ? prevTools.filter((t) => t !== toolId)
                    : [...prevTools, toolId];
                return { ...(prev ?? {}), tools: nextTools } as TEphemeralAgent;
            });
        },
        [setEphemeralAgent],
    );

    const setSessionModel = useCallback(
        (model: string) => {
            setEphemeralAgent((prev) => {
                return { ...(prev ?? {}), model } as TEphemeralAgent;
            });
        },
        [setEphemeralAgent],
    );

    return {
        hasWebSearch,
        hasFileSearch,
        hasCodeInterpreter,
        externalTools,
        overrides: ephemeralAgent,
        toggleBuiltinTool,
        toggleExternalTool,
        setSessionModel,
        agentModel: agent?.model ?? null,
        agentProvider: agent?.provider,
    };
}
