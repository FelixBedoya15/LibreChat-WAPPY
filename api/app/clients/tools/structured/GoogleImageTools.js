const { z } = require('zod');
const axios = require('axios');
const { v4 } = require('uuid');
const { Tool } = require('@langchain/core/tools');
const { logAxiosError } = require('@librechat/api');
const { ContentTypes, EImageOutputType, EModelEndpoint } = require('librechat-data-provider');
const { getUserKey } = require('~/server/services/UserService');

const displayMessage =
    "The tool displayed an image. All generated images are already plainly visible, so don't repeat the descriptions in detail. Do not list download links as they are available in the UI already. The user may download the images by clicking on them, but do not mention anything about downloading to the user.";

class GoogleImageTools extends Tool {
    constructor(fields = {}) {
        super();

        this.userId = fields.userId;
        this.fileStrategy = fields.fileStrategy;
        this.imageOutputType = fields.imageOutputType || EImageOutputType.PNG;
        this.req = fields.req;
        this.override = fields.override ?? false;

        this.name = 'google-image-gen';
        this.description =
            "Generates images using Google's Imagen model based on a text prompt. Uses the same Google API Key configured for Gemini chat.";

        this.schema = z.object({
            prompt: z.string().describe('The text prompt to generate the image from.'),
            n: z.number().int().default(1).describe('Number of images to generate (1-4).'),
            aspectRatio: z
                .enum(['1:1', '16:9', '9:16', '3:4', '4:3'])
                .default('1:1')
                .describe('Aspect ratio of the generated image.'),
            model: z
                .enum(['gemini-2.0-flash-exp', 'imagen-3.0-generate-001', 'imagen-3.0-fast-generate-001'])
                .default('gemini-2.0-flash-exp')
                .describe('Model to use for generation. Use gemini-2.0-flash-exp for free preview.'),
        });
    }

    returnValue(value) {
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

    async _call(input) {
        const { prompt, n = 1, aspectRatio = '1:1', model = 'gemini-2.0-flash-exp' } = input;

        if (!prompt) {
            throw new Error('Missing required field: prompt');
        }

        try {
            // Get user's Google API key (same one used for Gemini chat)
            let userApiKey;
            if (!this.override && this.userId) {
                userApiKey = await getUserKey({ userId: this.userId, name: EModelEndpoint.google });
                if (!userApiKey) {
                    throw new Error(
                        'Google API Key not configured. Please add your Google API Key in Settings.',
                    );
                }
            } else if (!this.override) {
                if (this.req?.user?.id) {
                    userApiKey = await getUserKey({ userId: this.req.user.id, name: EModelEndpoint.google });
                }
            }

            if (!userApiKey && !this.override) {
                throw new Error('Google API Key not configured or User ID missing.');
            }

            // Use Generative Language API
            const url =
                'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';

            const requestBody = {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    responseMimeType: 'image/' + this.imageOutputType,
                    responseModality: 'image',
                    aspectRatio: aspectRatio,
                    numberOfImages: Math.min(Math.max(1, n), 4),
                },
            };

            const res = await axios.post(url, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': userApiKey,
                },
            });

            const candidates = res.data.candidates;

            if (!candidates || candidates.length === 0) {
                return this.returnValue('No images returned from Google API.');
            }

            const content = [];
            const file_ids = [];

            for (const candidate of candidates) {
                // Extract base64 image from response
                const imagePart = candidate.content?.parts?.find((part) => part.inlineData);

                if (imagePart && imagePart.inlineData) {
                    const base64Image = imagePart.inlineData.data;
                    const mimeType = imagePart.inlineData.mimeType || `image/${this.imageOutputType}`;

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
                return this.returnValue('Failed to process images from Google API response.');
            }

            const response = [
                {
                    type: ContentTypes.TEXT,
                    text: displayMessage + `\n\ngenerated_image_ids: ${JSON.stringify(file_ids)}`,
                },
            ];

            return [response, { content, file_ids }];
        } catch (error) {
            const message = '[google_image_gen] Problem generating the image:';
            // Log detailed error for debugging
            if (error.response) {
                console.error('[google_image_gen] API Error Data:', JSON.stringify(error.response.data, null, 2));
            }
            logAxiosError({ error, message });

            if (error.response?.status === 401) {
                return this.returnValue(
                    'Invalid or expired Google API Key. Please update your API key in Settings.',
                );
            }

            if (error.response?.status === 400) {
                const errorDetails = error.response.data?.error?.message || 'Bad Request';
                return this.returnValue(`Google API Error (400): ${errorDetails}`);
            }

            return this.returnValue(
                `Something went wrong when trying to generate the image with Google: ${error.message}`,
            );
        }
    }
}

module.exports = GoogleImageTools;
