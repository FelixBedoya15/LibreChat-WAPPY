const axios = require('axios');
const { v4 } = require('uuid');
const { tool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');
const { logAxiosError } = require('@librechat/api');
const { ContentTypes, EImageOutputType } = require('librechat-data-provider');
const { google } = require('googleapis');

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

    // Initialize Google Auth
    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const googleImageGenTool = tool(
        async ({ prompt, n = 1, aspectRatio = '1:1' }, runnableConfig) => {
            if (!prompt) {
                throw new Error('Missing required field: prompt');
            }

            try {
                const client = await auth.getClient();
                const projectId = await auth.getProjectId();
                const location = process.env.GOOGLE_LOC || 'us-central1';
                const modelId = 'imagen-3.0-generate-001'; // Or make this configurable

                const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;

                const requestBody = {
                    instances: [{ prompt }],
                    parameters: {
                        sampleCount: Math.min(Math.max(1, n), 4), // Imagen usually supports up to 4
                        aspectRatio: aspectRatio,
                        // add other parameters as needed
                    },
                };

                const res = await client.request({
                    url,
                    method: 'POST',
                    data: requestBody,
                });

                const predictions = res.data.predictions;

                if (!predictions || predictions.length === 0) {
                    return returnValue('No images returned from Google Imagen.');
                }

                const content = [];
                const file_ids = [];

                for (const prediction of predictions) {
                    const base64Image = prediction.bytesBase64Encoded;
                    const mimeType = prediction.mimeType || `image/${imageOutputType}`;

                    if (base64Image) {
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
                        text: displayMessage + `\n\ngenerated_image_ids: ${JSON.stringify(file_ids)}`,
                    },
                ];

                return [response, { content, file_ids }];

            } catch (error) {
                const message = '[google_image_gen] Problem generating the image:';
                logAxiosError({ error, message });
                return returnValue(`Something went wrong when trying to generate the image with Google Imagen: ${error.message}`);
            }
        },
        {
            name: 'google_image_gen',
            description: 'Generates images using Google\'s Imagen model based on a text prompt.',
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
                        description: 'Aspect ratio of the generated image (e.g., "1:1", "16:9", "9:16", "3:4", "4:3").',
                        default: '1:1',
                    },
                },
                required: ['prompt'],
            },
        }
    );

    return [googleImageGenTool];
}

module.exports = createGoogleImageTools;
