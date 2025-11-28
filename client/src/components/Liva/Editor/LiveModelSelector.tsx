import React, { useMemo } from 'react';
import { EModelEndpoint } from 'librechat-data-provider';
import type { TConversation, TPreset } from 'librechat-data-provider';
import { useGetStartupConfig } from '~/data-provider';
import { ModelSelectorProvider } from '~/components/Chat/Menus/Endpoints/ModelSelectorContext';
import { ModelSelectorChatContext } from '~/components/Chat/Menus/Endpoints/ModelSelectorChatContext';
import { ModelSelectorContent } from '~/components/Chat/Menus/Endpoints/ModelSelector';

interface LiveModelSelectorProps {
    model: string;
    endpoint: EModelEndpoint | string;
    onModelSelect: (model: string, endpoint: string) => void;
}

export default function LiveModelSelector({ model, endpoint, onModelSelect }: LiveModelSelectorProps) {
    const { data: startupConfig } = useGetStartupConfig();
    console.log('LiveModelSelector startupConfig:', startupConfig);
    console.log('LiveModelSelector props:', { model, endpoint });

    // Mock conversation object based on props
    const conversation = useMemo(() => ({
        endpoint,
        model,
        // Add other required fields if necessary, but these should be enough for ModelSelector
        conversationId: 'new',
        title: 'New Chat',
        createdAt: '',
        updatedAt: '',
    } as unknown as TConversation), [model, endpoint]);

    // Mock newConversation function to handle model changes
    const newConversation = (template?: Partial<TConversation>, preset?: Partial<TPreset>) => {
        if (template) {
            const newEndpoint = template.endpoint || endpoint;
            const newModel = template.model || model;
            onModelSelect(newModel, newEndpoint);
        } else if (preset) {
            // Handle preset selection if needed
            const newEndpoint = preset.endpoint || endpoint;
            const newModel = preset.model || model;
            onModelSelect(newModel, newEndpoint);
        }
    };

    const contextValue = useMemo(() => ({
        endpoint,
        model,
        spec: null,
        agent_id: null,
        assistant_id: null,
        conversation,
        newConversation,
    }), [endpoint, model, conversation]);

    return (
        <ModelSelectorChatContext.Provider value={contextValue}>
            <ModelSelectorProvider startupConfig={startupConfig}>
                <div className="w-64">
                    <ModelSelectorContent />
                </div>
            </ModelSelectorProvider>
        </ModelSelectorChatContext.Provider>
    );
}
