import { useState, useCallback } from 'react';
import { useUploadFileMutation } from '~/data-provider';
import { useAuthContext } from '~/hooks/AuthContext';
import { EModelEndpoint } from 'librechat-data-provider';

export const useLiveAnalysis = () => {
    const { token } = useAuthContext();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);

    const uploadFileMutation = useUploadFileMutation();

    const analyzeImage = useCallback(async (imageBlob: Blob, width: number, height: number) => {
        setIsAnalyzing(true);
        setAnalysisResult(null);
        setError(null);

        try {
            // 1. Upload Image
            const formData = new FormData();
            formData.append('file', imageBlob, 'capture.jpg');
            // Use a default endpoint for upload, e.g., google since we use Gemini
            formData.append('endpoint', EModelEndpoint.google);
            formData.append('width', width.toString());
            formData.append('height', height.toString());

            const uploadResponse = await uploadFileMutation.mutateAsync(formData);
            console.log('Upload Response:', uploadResponse);
            /* @ts-ignore */
            const file_id = uploadResponse.file_id || uploadResponse.id;

            if (!file_id) {
                throw new Error('Upload failed: No file_id received');
            }

            // 2. Send Request to AI
            const payload = {
                endpoint: EModelEndpoint.google,
                model: 'gemini-1.5-flash', // Use a fast vision model
                text: 'Analyze this image for occupational risks. Be concise. List findings.',
                conversationId: 'new',
                files: [
                    {
                        file_id: file_id,
                        filepath: uploadResponse.filepath,
                        type: uploadResponse.type || 'image/jpeg',
                        height: uploadResponse.height,
                        width: uploadResponse.width,
                    }
                ],
                // Add other necessary fields if required by the backend
            };

            const response = await fetch('/api/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Analysis failed: ${response.status} ${errText}`);
            }

            // 3. Handle Response (Simple text accumulation for now)
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let resultText = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    // Parse SSE format (data: {...})
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6);
                            if (dataStr === '[DONE]') continue;
                            try {
                                const data = JSON.parse(dataStr);
                                if (data.text) {
                                    resultText += data.text;
                                    setAnalysisResult(prev => (prev || '') + data.text);
                                } else if (data.message?.content) {
                                    // Handle different response formats
                                    const content = data.message.content;
                                    if (typeof content === 'string') {
                                        resultText += content;
                                        setAnalysisResult(prev => (prev || '') + content);
                                    }
                                }
                            } catch (e) {
                                // Ignore parse errors for partial chunks
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error("Live Analysis Error:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            setAnalysisResult(`Error: ${errorMessage}`);
            setError(errorMessage);
        } finally {
            setIsAnalyzing(false);
        }
    }, [token, uploadFileMutation]);

    return {
        analyzeImage,
        isAnalyzing,
        analysisResult,
        error,
    };
};
