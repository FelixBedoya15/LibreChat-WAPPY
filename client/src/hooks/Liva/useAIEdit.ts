import { useState } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useGetStartupConfig } from '~/data-provider';
import { EModelEndpoint } from 'librechat-data-provider';

export const useAIEdit = () => {
    const { token } = useAuthContext();
    const { data: startupConfig } = useGetStartupConfig();
    const [isGenerating, setIsGenerating] = useState(false);

    const editContent = async (currentContent: string, prompt: string) => {
        setIsGenerating(true);
        try {
            // Default to OpenAI for now, or get from config
            // In a real app, we should respect the user's selected model
            const model = 'gpt-4o';
            const endpoint = EModelEndpoint.openAI;

            const text = `
You are an AI assistant helping to edit a risk assessment report.
Current Content:
${currentContent}

User Instruction:
${prompt}

Please provide the updated content in HTML format, maintaining the structure. Do not include markdown code blocks, just the HTML.
      `.trim();

            const payload = {
                text,
                conversationId: 'new', // Use 'new' for temporary context
                endpointOption: {
                    endpoint,
                    model,
                    modelOptions: {
                        model,
                        temperature: 0.7,
                    },
                },
                isContinued: false,
                parentMessageId: '00000000-0000-0000-0000-000000000000', // Dummy parent ID
            };

            const response = await fetch(`/api/edit/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`AI Edit failed: ${response.statusText}`);
            }

            // The response from EditController is a stream or a final JSON depending on implementation.
            // EditController uses sendEvent which sends SSE.
            // We need to handle SSE or just read the stream.

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let resultText = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    // Parse SSE events
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6);
                            if (dataStr === '[DONE]') continue;
                            try {
                                const data = JSON.parse(dataStr);
                                if (data.text) {
                                    resultText += data.text;
                                } else if (data.message?.content) {
                                    // Some endpoints return full message object
                                    // This depends on how EditController formats the event
                                }
                            } catch (e) {
                                // Ignore parse errors for partial chunks
                            }
                        }
                    }
                }
            }

            return resultText || 'Error: No response generated.';

        } catch (error) {
            console.error('AI Edit error:', error);
            return currentContent; // Return original on error
        } finally {
            setIsGenerating(false);
        }
    };

    return { editContent, isGenerating };
};
