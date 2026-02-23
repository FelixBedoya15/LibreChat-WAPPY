import { useCallback, useMemo } from 'react';
import { useRecoilState } from 'recoil';
import { Tools, Constants, PermissionBits } from 'librechat-data-provider';
import type { TEphemeralAgent } from 'librechat-data-provider';
import { useListAgentsQuery } from '~/data-provider';
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

    const { data: agentsList } = useListAgentsQuery(
        { requiredPermission: PermissionBits.VIEW },
        { enabled: !!agentId },
    );

    const agent = useMemo(() => {
        if (!agentId || !agentsList?.data) return null;
        return agentsList.data.find((a) => a.id === agentId) ?? null;
    }, [agentId, agentsList]);

    const { hasWebSearch, hasFileSearch, hasCodeInterpreter, externalTools } = useMemo(() => {
        const tools = agent?.tools ?? [];
        const toolSet = new Set(tools);
        const external = tools.filter((t) => !BUILTIN_TOOLS.has(t as Tools));
        return {
            hasWebSearch: toolSet.has(Tools.web_search),
            hasFileSearch: toolSet.has(Tools.file_search),
            hasCodeInterpreter: toolSet.has(Tools.execute_code) || toolSet.has(Tools.code_interpreter),
            externalTools: external,
        };
    }, [agent]);

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
            setEphemeralAgent((prev) => ({ ...(prev ?? {}), model } as TEphemeralAgent));
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
