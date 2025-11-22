const axios = require('axios');
const { v4 } = require('uuid');
const { tool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');
const { logAxiosError } = require('@librechat/api');
const { ContentTypes, EImageOutputType, EModelEndpoint } = require('librechat-data-provider');
const { getUserKey } = require('~/server/services/UserService');

const displayMessage =
    "The tool displayed an image. All generated images are already plainly visible, so don't repeat the descriptions in detail. Do not list download links as they are available in the UI already. The user may download the images by clicking on them, but do not mention anything about downloading to the user.";

function returnValue(value) {
    if (typeof value === 'string') {
        return [value, {}];
    } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return value;
        }
        return [displayMessage, value];
    }
    return value;
}

function createGoogleImageTools(fields = {}) {
    const { req } = fields;
    const imageOutputType = fields.imageOutputType || EImageOutputType.PNG;

    const googleImageGenTool = tool(
        async ({ prompt, n = 1, aspectRatio = '1:1', model = 'imagen-3.0-generate-001' }, runnableConfig) => {
            if (!prompt) {
                throw new Error('Missing required field: prompt');
            }

            try {
                // Get user's Google API key (same one used for Gemini chat)
                const userApiKey = await getUserKey({ userId: req.user.id, name: EModelEndpoint.google });

                if (!userApiKey) {
                    throw new Error('Google API Key not configured. Please add your Google API Key in Settings.');
                }

                // Use Generative Language API (same as Gemini chat)
                const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';

                const requestBody = {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        responseMimeType: 'image/' + imageOutputType,
                        responseModality: 'image',
                        // Imagen 3 specific parameters
                        aspectRatio: aspectRatio,
                        numberOfImages: Math.min(Math.max(1, n), 4),
                    }
                };

                const res = await axios.post(url, requestBody, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': userApiKey,
                    },
                });

                const candidates = res.data.candidates;

                if (!candidates || candidates.length === 0) {
                    return returnValue('No images returned from Google Imagen.');
                }

                const content = [];
                const file_ids = [];

                for (const candidate of candidates) {
                    // Extract base64 image from response
                    const imagePart = candidate.content?.parts?.find(part => part.inlineData);

                    if (imagePart && imagePart.inlineData) {
                        const base64Image = imagePart.inlineData.data;
                        const mimeType = imagePart.inlineData.mimeType || `image/${imageOutputType}`;

                        content.push({
                            type: ContentTypes.IMAGE_URL,
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`,
                            },
                        });
                        file_ids.push(v4());
                    }
                }

                if (content.length === 0) {
                    return returnValue('Failed to process images from Google Imagen response.');
                }

                const response = [
                    {
                        type: ContentTypes.TEXT,
                        text: displayMessage + `\\n\\ngenerated_image_ids: ${JSON.stringify(file_ids)}`,
                    },
                ];

                return [response, { content, file_ids }];

            } catch (error) {
                const message = '[google_image_gen] Problem generating the image:';
                logAxiosError({ error, message });

                if (error.response?.status === 401) {
                    return returnValue('Invalid or expired Google API Key. Please update your API key in Settings.');
                }

                return returnValue(`Something went wrong when trying to generate the image with Google Imagen: ${error.message}`);
            }
        },
        {
            name: 'google_image_gen',
            description: 'Generates images using Google\\'s Imagen model based on a text prompt.Uses the same Google API Key configured for Gemini chat.',
            schema: {
        type: 'object',
        properties: {
            prompt: {
                type: 'string',
                description: 'The text prompt to generate the image from.',
            },
            n: {
                type: 'integer',
                description: 'Number of images to generate (1-4).',
                default: 1,
            },
            aspectRatio: {
                type: 'string',
                description: 'Aspect ratio of the generated image.',
                enum: ['1:1', '16:9', '9:16', '3:4', '4:3'],
                default: '1:1',
            },
            model: {
                type: 'string',
                description: 'Imagen model to use.',
                enum: ['imagen-3.0-generate-001', 'imagen-3.0-fast-generate-001'],
                default: 'imagen-3.0-generate-001',
            },
        },
        required: ['prompt'],
    },
        }
    );

return [googleImageGenTool];
}

module.exports = createGoogleImageTools;
