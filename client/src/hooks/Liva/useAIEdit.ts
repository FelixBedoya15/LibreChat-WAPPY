import { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { useAuthContext } from '~/hooks/AuthContext';
import { useGetStartupConfig } from '~/data-provider';
import { EModelEndpoint } from 'librechat-data-provider';
import { NotificationSeverity } from '~/common';
import store from '~/store';

export const useAIEdit = () => {
    const { token } = useAuthContext();
    const { data: startupConfig } = useGetStartupConfig();
    const [isGenerating, setIsGenerating] = useState(false);
    const setToastState = useSetRecoilState(store.toastState);

    const editContent = async (currentContent: string, prompt: string, model: string, endpoint: string) => {
        setIsGenerating(true);
        try {
            // Use provided model and endpoint
            // const model = 'gpt-4o';
            // const endpoint = EModelEndpoint.openAI;

            const text = `
You are an expert editor helping to refine a risk assessment report.
Current Content:
${currentContent}

User Instruction:
${prompt}

CRITICAL OUTPUT RULES:
1. Return ONLY the updated HTML content.
2. Do NOT use markdown code blocks (like \`\`\`html).
3. Do NOT include any conversational text, explanations, or preambles.
4. Maintain the original HTML structure (h1, h2, p, ul, etc.).
      `.trim();

            const response = await fetch(`/api/edit/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    text,
                    model,
                    endpoint,
                    stream: true,
                    conversationId: 'new',
                    parentMessageId: '00000000-0000-0000-0000-000000000000',
                    isContinued: false,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('AI Edit failed:', response.status, response.statusText, errorText);
                throw new Error(`AI Edit failed: ${response.statusText} - ${errorText}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let resultText = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    console.log('AI Edit Chunk:', chunk); // Debug logging

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
                                    resultText += data.message.content;
                                } else if (data.choices?.[0]?.delta?.content) {
                                    resultText += data.choices[0].delta.content;
                                }
                            } catch (e) {
                                console.warn('Error parsing chunk:', e);
                            }
                        }
                    }
                }
            }

            console.log('AI Edit Final Result (Raw):', resultText);

            // Clean up response: remove markdown code blocks if present
            let cleanText = resultText.trim();
            if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '');
            }

            console.log('AI Edit Final Result (Clean):', cleanText);
            return cleanText || 'Error: No response generated.';

        } catch (error) {
            console.error('AI Edit error:', error);
            setToastState({
                open: true,
                message: `AI Edit Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: NotificationSeverity.ERROR,
                showIcon: true,
            });
            return currentContent;
        } finally {
            setIsGenerating(false);
        }
    };

    return { editContent, isGenerating };
};
