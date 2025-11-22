const { z } = require('zod');
const { v4 } = require('uuid');
const { Tool } = require('@langchain/core/tools');
const { GoogleGenerativeAI: GenAI } = require('@google/generative-ai');
const { getUserKey } = require('~/server/services/UserService');
const { ContentTypes, EImageOutputType, EModelEndpoint } = require('librechat-data-provider');

const displayMessage =
    "Google Imagen displayed an image. All generated images are already plainly visible, so don't repeat the descriptions in detail. Do not list download links as they are available in the UI already. The user may download the images by clicking on them, but do not mention anything about downloading to the user.";

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
                .enum(['gemini-2.0-flash-preview-image-generation', 'imagen-3.0-generate-001', 'imagen-3.0-fast-generate-001'])
                .default('gemini-2.0-flash-preview-image-generation')
                .describe('Model to use for generation. Use gemini-2.0-flash-preview-image-generation for free preview.'),
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
        const { prompt, n = 1, aspectRatio = '1:1', model = 'gemini-2.0-flash-preview-image-generation' } = input;

        if (!prompt) {
            throw new Error('Missing required field: prompt');
        }

        try {
            // Logic mirrored from api/server/services/Endpoints/google/initialize.js
            const { GOOGLE_KEY } = process.env;
            const isUserProvided = GOOGLE_KEY === 'user_provided';

            let userApiKey = null;

            // 1. If user_provided, ALWAYS try to get user's saved key
            if (isUserProvided && this.userId) {
                try {
                    userApiKey = await getUserKey({ userId: this.userId, name: 'google' });
                    console.log('[google_image_gen] Retrieved user key from database');
                } catch (e) {
                    console.log('[google_image_gen] No user key found in database:', e.message);
                }
            }

            // 2. If not user_provided or user key not found, check if GOOGLE_KEY has a value
            if (!userApiKey && GOOGLE_KEY && GOOGLE_KEY !== 'user_provided') {
                userApiKey = GOOGLE_KEY;
                console.log('[google_image_gen] Using GOOGLE_KEY from env');
            }

            // 3. Fallback to GOOGLE_API_KEY (common alternative) if still no key
            if (!userApiKey) {
                userApiKey = process.env.GOOGLE_API_KEY;
                if (userApiKey) {
                    console.log('[google_image_gen] Using GOOGLE_API_KEY from env');
                }
            }

            if (!userApiKey && !this.override) {
                throw new Error('Google API Key not configured. Please add your Google API Key in Settings or configure GOOGLE_KEY/GOOGLE_API_KEY in .env.');
            }

            // Log masked key for debugging
            const maskedKey = userApiKey ? `${userApiKey.substring(0, 4)}...${userApiKey.substring(userApiKey.length - 4)}` : 'undefined';
            console.log(`[google_image_gen] Using API Key: ${maskedKey}`);

            // Use Google Generative AI library (same as GoogleClient.js)
            const genAI = new GenAI(userApiKey);
            const generativeModel = genAI.getGenerativeModel({ model });

            const requestOptions = {
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

            const result = await generativeModel.generateContent(requestOptions);
            const response = await result.response;
            const candidates = response.candidates;

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

            const responseMsg = [
                {
                    type: ContentTypes.TEXT,
                    text: displayMessage + `\n\ngenerated_image_ids: ${JSON.stringify(file_ids)}`,
                },
            ];

            return [responseMsg, { content, file_ids }];
        } catch (error) {
            const message = '[google_image_gen] Problem generating the image:';
            // Log detailed error for debugging
            console.error(message, error);

            let debugInfo = `User ID: ${this.userId || 'undefined'}`;
            const keyStatus = process.env.GOOGLE_API_KEY ? 'System Key Present' : 'System Key Missing';

            if (error.message?.includes('API key not valid')) {
                return this.returnValue(
                    `Invalid or expired Google API Key. Please update your API key in Settings.\nDebug: ${debugInfo}, KeyStatus: ${keyStatus}`
                );
            }

            if (error.message?.includes('400')) {
                const errorDetails = error.message || 'Bad Request';
                return this.returnValue(`Google API Error (400): ${errorDetails}. \nDebug: ${debugInfo}, KeyStatus: ${keyStatus}`);
            }

            return this.returnValue(
                `Something went wrong when trying to generate the image with Google: ${error.message}`
            );
        }
    }
}

module.exports = GoogleImageTools;
