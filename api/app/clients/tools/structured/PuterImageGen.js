const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');
const { Tool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');
const { FileContext, ContentTypes } = require('librechat-data-provider');
const { init } = require('@heyputer/puter.js/src/init.cjs');

const displayMessage =
  "Puter displayed an image. All generated images are already plainly visible, so don't repeat the descriptions in detail. Do not list download links as they are available in the UI already. The user may download the images by clicking on them, but do not mention anything about downloading to the user.";

class PuterImageGen extends Tool {
  constructor(fields = {}) {
    super();

    /** @type {boolean} Used to initialize the Tool without necessary variables. */
    this.override = fields.override ?? false;

    this.userId = fields.userId;
    this.fileStrategy = fields.fileStrategy;

    /** @type {boolean} */
    this.isAgent = fields.isAgent;
    this.returnMetadata = fields.returnMetadata ?? false;
    this.req = fields.req;

    if (fields.uploadImageBuffer) {
      this.uploadImageBuffer = fields.uploadImageBuffer.bind(this);
    }

    this.apiKey = fields.PUTER_API_KEY || this.getApiKey();

    this.name = 'puter_image_gen';
    this.description = 'Use Puter Image Generator to create images from text descriptions.';
    this.description_for_model =
      '// Whenever a description of an image is given, generate a prompt and use puter_image_gen to create the image. One image per function call. Always write out the prompt in English.';

    this.schema = z.object({
      prompt: z
        .string()
        .max(4000)
        .describe('A text description of the desired image, in English.'),
      model: z
        .enum([
          'gemini-2.5-flash-image-preview',
          'gemini-3-pro-image-preview',
          'gpt-image-1.5',
          'gpt-image-2',
          'black-forest-labs/flux-1.1-pro',
        ])
        .optional()
        .default('gpt-image-1.5')
        .describe('The AI model to use for image generation.'),
    });
  }

  getApiKey() {
    const apiKey = process.env.PUTER_API_KEY || '';
    if (!apiKey && !this.override) {
      throw new Error('Missing PUTER_API_KEY environment variable.');
    }
    return apiKey;
  }

  returnValue(value) {
    if (this.isAgent === true && typeof value === 'string') {
      return [value, {}];
    } else if (this.isAgent === true && typeof value === 'object') {
      return [displayMessage, value];
    }
    return value;
  }

  async _call(data) {
    const { prompt, model = 'gemini-2.5-flash-image-preview' } = data;
    if (!prompt) {
      throw new Error('Missing required field: prompt');
    }

    let puterInstance;
    try {
      puterInstance = init(this.apiKey);
    } catch (error) {
      logger.error('[Puter] Error initializing Puter client:', error);
      return this.returnValue(`Error initializing Puter client: ${error.message}`);
    }

    let result;
    try {
      result = await puterInstance.ai.txt2img(prompt, { model });
    } catch (error) {
      logger.error('[Puter] Problem generating the image:', error);
      return this.returnValue(`Something went wrong when trying to generate the image with Puter: ${error.message || JSON.stringify(error)}`);
    }

    if (!result || !result.src) {
      return this.returnValue(
        'No image data returned from Puter. There may be a problem with the API or your configuration.',
      );
    }

    if (this.isAgent) {
      return [
        {
          type: ContentTypes.TEXT,
          text: displayMessage,
        },
        {
          type: ContentTypes.IMAGE_URL,
          image_url: {
            url: result.src,
          },
        },
      ];
    }

    const dataUrl = result.src;
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return this.returnValue('Invalid image format returned from Puter.');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const imageExt = mimeType.split('/')[1] || 'png';
    const imageName = `img-${uuidv4()}.${imageExt}`;

    try {
      const uploadResult = await this.uploadImageBuffer({
        req: this.req,
        context: FileContext.image_generation,
        resize: false,
        metadata: {
          buffer,
          filename: imageName,
          file_id: uuidv4(),
          type: mimeType,
          bytes: buffer.length,
          width: 1024,
          height: 1024,
        },
      });

      if (this.returnMetadata) {
        this.result = uploadResult;
      } else {
        this.result = `![generated image](${uploadResult.filepath})`;
      }
    } catch (error) {
      logger.error('Error while saving the Puter image:', error);
      this.result = `Failed to save the image locally. ${error.message}`;
    }

    return this.returnValue(this.result);
  }
}

module.exports = PuterImageGen;
