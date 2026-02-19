const axios = require('axios');
const fs = require('fs').promises;
const FormData = require('form-data');
const { Readable } = require('stream');
const { logger } = require('@librechat/data-schemas');
const { genAzureEndpoint } = require('@librechat/api');
const { extractEnvVariable, STTProviders } = require('librechat-data-provider');
const { getAppConfig } = require('~/server/services/Config');
const { getMessages } = require('~/models');
const { getUserKey } = require('~/server/services/UserService');
const { EModelEndpoint } = require('librechat-data-provider');

/**
 * Maps MIME types to their corresponding file extensions for audio files.
 * @type {Object}
 */
const MIME_TO_EXTENSION_MAP = {
  // MP4 container formats
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  // Ogg formats
  'audio/ogg': 'ogg',
  'audio/vorbis': 'ogg',
  'application/ogg': 'ogg',
  // Wave formats
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
  // MP3 formats
  'audio/mp3': 'mp3',
  'audio/mpeg': 'mp3',
  'audio/mpeg3': 'mp3',
  // WebM formats
  'audio/webm': 'webm',
  // Additional formats
  'audio/flac': 'flac',
  'audio/x-flac': 'flac',
};

/**
 * Gets the file extension from the MIME type.
 * @param {string} mimeType - The MIME type.
 * @returns {string} The file extension.
 */
function getFileExtensionFromMime(mimeType) {
  // Default fallback
  if (!mimeType) {
    return 'webm';
  }

  // Direct lookup (fastest)
  const extension = MIME_TO_EXTENSION_MAP[mimeType];
  if (extension) {
    return extension;
  }

  // Try to extract subtype as fallback
  const subtype = mimeType.split('/')[1]?.toLowerCase();

  // If subtype matches a known extension
  if (['mp3', 'mp4', 'ogg', 'wav', 'webm', 'm4a', 'flac'].includes(subtype)) {
    return subtype === 'mp4' ? 'm4a' : subtype;
  }

  // Generic checks for partial matches
  if (subtype?.includes('mp4') || subtype?.includes('m4a')) {
    return 'm4a';
  }
  if (subtype?.includes('ogg')) {
    return 'ogg';
  }
  if (subtype?.includes('wav')) {
    return 'wav';
  }
  if (subtype?.includes('mp3') || subtype?.includes('mpeg')) {
    return 'mp3';
  }
  if (subtype?.includes('webm')) {
    return 'webm';
  }

  return 'webm'; // Default fallback
}

/**
 * Service class for handling Speech-to-Text (STT) operations.
 * @class
 */
class STTService {
  constructor() {
    this.providerStrategies = {
      [STTProviders.OPENAI]: this.openAIProvider,
      [STTProviders.AZURE_OPENAI]: this.azureOpenAIProvider,
    };
  }

  /**
   * Creates a singleton instance of STTService.
   * @static
   * @async
   * @returns {Promise<STTService>} The STTService instance.
   * @throws {Error} If the custom config is not found.
   */
  static async getInstance() {
    return new STTService();
  }

  /**
   * Retrieves the configured STT provider and its schema.
   * @param {ServerRequest} req - The request object.
   * @returns {Promise<[string, Object]>} A promise that resolves to an array containing the provider name and its schema.
   * @throws {Error} If no STT schema is set, multiple providers are set, or no provider is set.
   */
  async getProviderSchema(req) {
    const appConfig =
      req.config ??
      (await getAppConfig({
        role: req?.user?.role,
      }));
    const sttSchema = appConfig?.speech?.stt;
    if (!sttSchema) {
      throw new Error(
        'No STT schema is set. Did you configure STT in the custom config (librechat.yaml)?',
      );
    }

    const providers = Object.entries(sttSchema).filter(
      ([, value]) => Object.keys(value).length > 0,
    );

    if (providers.length !== 1) {
      throw new Error(
        providers.length > 1
          ? 'Multiple providers are set. Please set only one provider.'
          : 'No provider is set. Please set a provider.',
      );
    }

    const [provider, schema] = providers[0];
    return [provider, schema];
  }

  /**
   * Recursively removes undefined properties from an object.
   * @param {Object} obj - The object to clean.
   * @returns {void}
   */
  removeUndefined(obj) {
    Object.keys(obj).forEach((key) => {
      if (obj[key] && typeof obj[key] === 'object') {
        this.removeUndefined(obj[key]);
        if (Object.keys(obj[key]).length === 0) {
          delete obj[key];
        }
      } else if (obj[key] === undefined) {
        delete obj[key];
      }
    });
  }

  /**
   * Prepares the request for the OpenAI STT provider.
   * @param {Object} sttSchema - The STT schema for OpenAI.
   * @param {Stream} audioReadStream - The audio data to be transcribed.
   * @param {Object} audioFile - The audio file object (unused in OpenAI provider).
   * @param {string} language - The language code for the transcription.
   * @returns {Array} An array containing the URL, data, and headers for the request.
   */
  openAIProvider(sttSchema, audioReadStream, audioFile, language) {
    const url = sttSchema?.url || 'https://api.openai.com/v1/audio/transcriptions';
    const apiKey = extractEnvVariable(sttSchema.apiKey) || '';

    const data = {
      file: audioReadStream,
      model: sttSchema.model,
    };

    if (language) {
      /** Converted locale code (e.g., "en-US") to ISO-639-1 format (e.g., "en") */
      const isoLanguage = language.split('-')[0];
      data.language = isoLanguage;
    }

    const headers = {
      'Content-Type': 'multipart/form-data',
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    };
    [headers].forEach(this.removeUndefined);

    return [url, data, headers];
  }

  /**
   * Prepares the request for the Azure OpenAI STT provider.
   * @param {Object} sttSchema - The STT schema for Azure OpenAI.
   * @param {Buffer} audioBuffer - The audio data to be transcribed.
   * @param {Object} audioFile - The audio file object containing originalname, mimetype, and size.
   * @param {string} language - The language code for the transcription.
   * @returns {Array} An array containing the URL, data, and headers for the request.
   * @throws {Error} If the audio file size exceeds 25MB or the audio file format is not accepted.
   */
  azureOpenAIProvider(sttSchema, audioBuffer, audioFile, language) {
    const url = `${genAzureEndpoint({
      azureOpenAIApiInstanceName: extractEnvVariable(sttSchema?.instanceName),
      azureOpenAIApiDeploymentName: extractEnvVariable(sttSchema?.deploymentName),
    })}/audio/transcriptions?api-version=${extractEnvVariable(sttSchema?.apiVersion)}`;

    const apiKey = sttSchema.apiKey ? extractEnvVariable(sttSchema.apiKey) : '';

    if (audioBuffer.byteLength > 25 * 1024 * 1024) {
      throw new Error('The audio file size exceeds the limit of 25MB');
    }

    const acceptedFormats = ['flac', 'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'ogg', 'wav', 'webm'];
    const fileFormat = audioFile.mimetype.split('/')[1];
    if (!acceptedFormats.includes(fileFormat)) {
      throw new Error(`The audio file format ${fileFormat} is not accepted`);
    }

    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: audioFile.originalname,
      contentType: audioFile.mimetype,
    });

    if (language) {
      /** Converted locale code (e.g., "en-US") to ISO-639-1 format (e.g., "en") */
      const isoLanguage = language.split('-')[0];
      formData.append('language', isoLanguage);
    }

    const headers = {
      ...(apiKey && { 'api-key': apiKey }),
    };

    [headers].forEach(this.removeUndefined);

    return [url, formData, { ...headers, ...formData.getHeaders() }];
  }

  /**
   * Sends an STT request to the specified provider.
   * @async
   * @param {string} provider - The STT provider to use.
   * @param {Object} sttSchema - The STT schema for the provider.
   * @param {Object} requestData - The data required for the STT request.
   * @param {Buffer} requestData.audioBuffer - The audio data to be transcribed.
   * @param {Object} requestData.audioFile - The audio file object containing originalname, mimetype, and size.
   * @param {string} requestData.language - The language code for the transcription.
   * @returns {Promise<string>} A promise that resolves to the transcribed text.
   * @throws {Error} If the provider is invalid, the response status is not 200, or the response data is missing.
   */
  async sttRequest(provider, sttSchema, { audioBuffer, audioFile, language }) {
    const strategy = this.providerStrategies[provider];
    if (!strategy) {
      throw new Error('Invalid provider');
    }

    const fileExtension = getFileExtensionFromMime(audioFile.mimetype);

    const audioReadStream = Readable.from(audioBuffer);
    audioReadStream.path = `audio.${fileExtension}`;

    const [url, data, headers] = strategy.call(
      this,
      sttSchema,
      audioReadStream,
      audioFile,
      language,
    );

    try {
      const response = await axios.post(url, data, { headers });

      if (response.status !== 200) {
        throw new Error('Invalid response from the STT API');
      }

      if (!response.data || !response.data.text) {
        throw new Error('Missing data in response from the STT API');
      }

      return response.data.text.trim();
    } catch (error) {
      logger.error(`STT request failed for provider ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Load recent chat history for transcription correction context
   * @async
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<string>} Formatted chat history
   */
  async loadChatHistory(userId, conversationId) {
    try {
      if (!conversationId || conversationId === 'new') {
        return '';
      }

      const messages = await getMessages(
        {
          conversationId: conversationId,
          user: userId,
        },
        null,
        { limit: 5, sort: { createdAt: -1 } },
      );

      if (!messages || messages.length === 0) {
        return '';
      }

      const contextMessages = [...messages].reverse().map((msg) => {
        const role = msg.isCreatedByUser ? 'Usuario' : 'Asistente';
        let text = msg.text;
        if (!text && Array.isArray(msg.content)) {
          text = msg.content.map((c) => c.text || '').join(' ');
        }
        return `${role}: ${text || '[Contenido multimedia]'}`;
      });

      return contextMessages.join('\n');
    } catch (error) {
      logger.error('[STTService] Error loading chat history:', error);
      return '';
    }
  }

  /**
   * Correct user transcription using Gemini Flash and chat history
   * @async
   * @param {string} userText - Raw transcription text
   * @param {string} chatHistory - Recent chat history for context
   * @param {string} userId - User ID for API key
   * @returns {Promise<string>} Corrected transcription
   */
  async correctTranscription(userText, chatHistory, userId) {
    try {
      logger.info(`[STTService] Starting transcription correction for: "${userText}"`);
      const correctionModelName = process.env.TRANSCRIPTION_CORRECTION_MODEL || 'gemini-2.5-flash-lite-preview-09-2025';
      logger.info(`[STTService] Using correction model: ${correctionModelName}`);

      // Get user's Google API key
      let apiKey = await getUserKey({ userId, name: EModelEndpoint.google });
      if (!apiKey) {
        logger.warn('[STTService] No Google API key found, skipping transcription correction');
        return userText;
      }

      try {
        const parsed = JSON.parse(apiKey);
        apiKey = parsed.GOOGLE_API_KEY || parsed;
      } catch (e) {
        // not json
      }

      if (apiKey && typeof apiKey === 'string') {
        apiKey = apiKey.split(',')[0].trim();
      }

      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: correctionModelName });

      const contextPrompt = chatHistory
        ? `\nRecent conversation history:\n${chatHistory}\n`
        : '';

      const prompt = `
      You are a transcription correction expert.
      
      CONTEXT:
      - Recent conversation history (for reference ONLY):
      """
      ${chatHistory || 'No history available.'}
      """
      
      - User's raw audio transcription (needs correction):
      """
      ${userText}
      """
      
      TASK:
      1. Analyze the user's raw transcription.
      2. Use the context to understand specific terms (like SST, technical words) or the flow of conversation.
      3. Correct phonetic errors, misinterpretations, spelling, and punctuation.
      4. Structure the sentence naturally and grammatically while preserving the original meaning.
      5. OUTPUT ONLY THE CORRECTED USER TEXT.
      
      RULES:
      - OUTPUT ONLY THE CORRECTED USER TEXT. NO PREAMBLE. NO POSTSCRIPT.
      - ABSOLUTELY FORBIDDEN to include the "Recent conversation history" in your output.
      - The history is ONLY for context (understanding acronyms like SST).
      - If the user text is short (e.g., "Hola"), DO NOT append the history.
      - If the raw transcription is already correct, return it exactly as is.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const correctedText = response.text().trim();

      logger.info(
        `[STTService] Transcription correction result: "${userText}" -> "${correctedText}"`,
      );
      return correctedText;
    } catch (error) {
      logger.error('[STTService] Error correcting transcription:', error);
      return userText; // Fallback to original
    }
  }

  /**
   * Processes a speech-to-text request.
   * @async
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Promise<void>}
   */
  async processSpeechToText(req, res) {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file provided in the FormData' });
    }

    const audioBuffer = await fs.readFile(req.file.path);
    const audioFile = {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    };

    try {
      const [provider, sttSchema] = await this.getProviderSchema(req);
      const language = req.body?.language || '';
      let text = await this.sttRequest(provider, sttSchema, { audioBuffer, audioFile, language });
      logger.info(`[STTService] Initial transcription: "${text}"`);

      // FASE 7: Transcription Correction using chat history
      const conversationId = req.body?.conversationId;
      const userId = req.user?.id;

      if (userId && conversationId) {
        logger.info(`[STTService] Attempting correction with conversationId: ${conversationId}`);
        const chatHistory = await this.loadChatHistory(userId, conversationId);
        text = await this.correctTranscription(text, chatHistory, userId);
      } else {
        logger.info(`[STTService] Skipping correction. UserId: ${!!userId}, ConversationId: ${conversationId}`);
      }

      res.json({ text });
    } catch (error) {
      logger.error('An error occurred while processing the audio:', error);
      res.sendStatus(500);
    } finally {
      try {
        await fs.unlink(req.file.path);
        logger.debug('[/speech/stt] Temp. audio upload file deleted');
      } catch {
        logger.debug('[/speech/stt] Temp. audio upload file already deleted');
      }
    }
  }

  /**
   * Processes a transcription correction request.
   * @async
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Promise<void>}
   */
  async processCorrection(req, res) {
    const { text, conversationId } = req.body;
    const userId = req.user?.id;

    if (!text) {
      return res.status(400).json({ message: 'No text provided' });
    }

    try {
      let correctedText = text;
      if (userId && conversationId) {
        logger.info(`[STTService] Processing correction request for conversationId: ${conversationId}`);
        const chatHistory = await this.loadChatHistory(userId, conversationId);
        correctedText = await this.correctTranscription(text, chatHistory, userId);
      } else {
        logger.warn('[STTService] Missing userId or conversationId for correction');
      }

      res.json({ text: correctedText });
    } catch (error) {
      logger.error('An error occurred while correcting the transcription:', error);
      res.status(500).json({ message: 'Error correcting transcription', text });
    }
  }
}

/**
 * Factory function to create an STTService instance.
 * @async
 * @returns {Promise<STTService>} A promise that resolves to an STTService instance.
 */
async function createSTTService() {
  return STTService.getInstance();
}

/**
 * Wrapper function for speech-to-text processing.
 * @async
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
async function speechToText(req, res) {
  const sttService = await createSTTService();
  await sttService.processSpeechToText(req, res);
}

/**
 * Wrapper function for transcription correction.
 * @async
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
async function correctTranscript(req, res) {
  const sttService = await createSTTService();
  await sttService.processCorrection(req, res);
}

module.exports = { STTService, speechToText, correctTranscript };
