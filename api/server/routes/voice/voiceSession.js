const WebSocket = require('ws');
const logger = require('~/config/winston');
const GeminiLiveClient = require('./geminiLive');
const { getUserKey } = require('~/server/services/UserService');
const { EModelEndpoint } = require('librechat-data-provider');
const { saveMessage, saveConvo, getMessages } = require('~/models');
const { v4: uuidv4 } = require('uuid');

/**
 * Active voice sessions
 * Map of userId -> VoiceSession
 */
const activeSessions = new Map();

/**
 * Voice Session Manager
 * Manages a voice conversation session between client and Gemini
 */
class VoiceSession {
    constructor(clientWs, userId, apiKey, config = {}, conversationId = null) {
        this.clientWs = clientWs;
        this.userId = userId;
        this.apiKey = apiKey;
        this.config = config;
        this.conversationId = conversationId;
        this.geminiClient = null;
        this.isActive = false;

        // Text accumulation for saving
        this.userTranscriptionText = '';
        this.aiResponseText = '';
        this.aiAudioChunkCount = 0; // Count audio chunks to know if AI responded with voice
        this.lastMessageId = null; // Track last message ID for parent linking

        // Parallel Report Generation
        this.lastFrame = null;
        this.reportInterval = null;

        logger.info(`[VoiceSession] Created for user: ${userId}, conversationId: ${conversationId || 'NULL'}`);
    }


    /**
     * Initialize and start the session
     */
    async start() {
        try {
            // FIX FASE 3 & 5: Cargar historial y último mensaje si es chat existente
            if (this.conversationId && this.conversationId !== 'new') {
                try {
                    // Cargar últimos 15 mensajes para contexto
                    const messages = await getMessages({
                        conversationId: this.conversationId,
                        user: this.userId
                    }, null, { limit: 15, sort: { createdAt: -1 } });

                    if (messages && messages.length > 0) {
                        // 1. Set lastMessageId (FASE 3 - Mensajes Verticales)
                        // FIX: Asegurar que tomamos el mensaje más reciente absoluto
                        const sortedMessages = [...messages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        this.lastMessageId = sortedMessages[0].messageId;
                        logger.info(`[VoiceSession] Loaded lastMessageId: ${this.lastMessageId}`);

                        // 2. Build Context (FASE 5 - Memoria)
                        const contextMessages = [...messages].reverse().map(msg => {
                            const role = msg.isCreatedByUser ? 'Usuario' : 'Asistente';
                            let text = msg.text;
                            if (!text && Array.isArray(msg.content)) {
                                text = msg.content.map(c => c.text || '').join(' ');
                            }
                            return `${role}: ${text || '[Contenido multimedia]'}`;
                        });

                        this.config.conversationContext = contextMessages.join('\n');
                        logger.info(`[VoiceSession] Loaded context with ${messages.length} messages`);
                    }
                } catch (error) {
                    logger.error(`[VoiceSession] Error loading history:`, error);
                }
            }

            // Create Gemini Live client
            this.geminiClient = new GeminiLiveClient(this.apiKey, this.config);

            // Connect to Gemini
            await this.geminiClient.connect();

            // Setup message handlers
            this.setupHandlers();

            this.isActive = true;

            // Start Parallel Report Generator
            this.startReportGenerator();

            logger.info(`[VoiceSession] Started for user: ${this.userId}`);

            return { success: true };
        } catch (error) {
            logger.error(`[VoiceSession] Failed to start:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Setup message handlers between client and Gemini
     */
    setupHandlers() {
        // Handle messages from client
        this.clientWs.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                await this.handleClientMessage(message);
            } catch (error) {
                logger.error('[VoiceSession] Error handling client message:', error);
            }
        });

        // Handle messages from Gemini
        this.geminiClient.onMessage((message) => {
            this.handleGeminiMessage(message);
        });

        // Listen for AUDIO from Gemini (AI voice response)
        this.geminiClient.on('audio', (audioData) => {
            // Forward audio to client for playback
            this.sendToClient({ type: 'audio', data: { audioData } });

            // Count audio chunks to know AI responded with voice
            this.aiAudioChunkCount++;
        });

        // Listen for USER TRANSCRIPTION  
        // Listen for USER transcription (what the user says)
        this.geminiClient.on('userTranscription', (text) => {
            logger.info(`[VoiceSession] User transcription received: "${text}"`);
            // Accumulate user text
            this.userTranscriptionText += text;
        });

        // Listen for AI transcription (what the AI says)
        this.geminiClient.on('aiTranscription', (text) => {
            logger.info(`[VoiceSession] AI transcription received: "${text}"`);
            // Accumulate AI text (for history/context)
            // Note: We might want to separate "spoken" text from "report" text in history too
            // For now, we just log it or maybe append to a separate buffer if needed.

            // Send to client as 'transcript' (captions), NOT 'text' (report)
            this.sendToClient({
                type: 'transcript',
                data: { text }
            });
        });

        // Listen for AI TEXT response
        this.geminiClient.on('aiText', (text) => {
            logger.info(`[VoiceSession] AI text response received: "${text}"`);

            // Filter AI "thinking" text - don't accumulate or send to client
            const shouldSkip = text.startsWith('**') ||
                text.includes('Considering') ||
                text.includes('Analyzing') ||
                text.includes('linguist') ||
                text.includes('Evaluating') ||
                text.includes('Reviewing');

            if (shouldSkip) {
                logger.info(`[VoiceSession] Skipping AI "thinking" text (not user-facing)`);
                return;
            }

            // Accumulate AI text
            this.aiResponseText += text;
            // Send to client in real-time with correct format
            this.sendToClient({
                type: 'text',
                data: { text }
            });
        });

        // Listen for turn complete
        this.geminiClient.on('turnComplete', async () => {
            logger.info('[VoiceSession] ========== TURN COMPLETE ==========');
            logger.info(`[VoiceSession] Accumulated user text length: ${this.userTranscriptionText.length}`);
            logger.info(`[VoiceSession] Accumulated AI text length: ${this.aiResponseText.length}`);
            this.sendToClient({ type: 'status', data: { status: 'turn_complete' } });

            let messagesSaved = false;
            let isNewConversation = false;

            // CRITICAL: Save user message FIRST, then AI message
            // This ensures proper parent-child relationship in the message chain
            if (this.userTranscriptionText.trim()) {
                const preview = this.userTranscriptionText.substring(0, 100);
                logger.info(`[VoiceSession] Saving USER message. Preview: "${preview}..."`);
                logger.info(`[VoiceSession] Current lastMessageId before user save: ${this.lastMessageId}`);

                // FASE 6: Transcription Correction
                let textToSave = this.userTranscriptionText.trim();
                if (this.aiResponseText.trim()) {
                    textToSave = await this.correctTranscription(textToSave, this.aiResponseText.trim());
                }

                const result = await this.saveUserMessage(textToSave);
                if (result) {
                    messagesSaved = true;
                    isNewConversation = result.isNewConversation;
                    logger.info(`[VoiceSession] User message saved. New lastMessageId: ${this.lastMessageId}`);
                }
                this.userTranscriptionText = ''; // Reset after saving
            } else {
                logger.warn(`[VoiceSession] No user transcription to save. Value: "${this.userTranscriptionText}"`);
            }

            // Save AI response AFTER user message (uses updated lastMessageId as parent)
            if (this.aiResponseText.trim()) {
                const preview = this.aiResponseText.substring(0, 100);
                logger.info(`[VoiceSession] Saving AI message. Preview: "${preview}..."`);
                logger.info(`[VoiceSession] Current lastMessageId before AI save: ${this.lastMessageId}`);

                await this.saveAiMessage(this.aiResponseText.trim());
                messagesSaved = true;
                logger.info(`[VoiceSession] AI message saved. New lastMessageId: ${this.lastMessageId}`);
                this.aiResponseText = ''; // Reset after saving
            } else if (this.aiAudioChunkCount > 0) {
                // AI responded with AUDIO but no text - save voice indicator
                logger.info(`[VoiceSession] AI responded with ${this.aiAudioChunkCount} audio chunks, no text. Saving voice indicator.`);
                logger.info(`[VoiceSession] Current lastMessageId before AI save: ${this.lastMessageId}`);

                await this.saveAiMessage('🎤 [Respuesta de voz]');
                messagesSaved = true;
                logger.info(`[VoiceSession] AI voice indicator saved. New lastMessageId: ${this.lastMessageId}`);
            } else {
                logger.warn(`[VoiceSession] No AI response to save. Text: "${this.aiResponseText}", Audio chunks: ${this.aiAudioChunkCount}`);
            }

            // Reset audio counter for next turn
            this.aiAudioChunkCount = 0;

            // Only update conversation and notify client ONCE at the end
            if (messagesSaved) {
                try {
                    await saveConvo({ user: { id: this.userId } }, {
                        conversationId: this.conversationId,
                        endpoint: EModelEndpoint.google,
                        model: this.config.model
                    }, { context: 'VoiceSession - TurnComplete' });

                    // If new conversation, send ID to client
                    if (isNewConversation) {
                        this.sendToClient({
                            type: 'conversationId',
                            data: { conversationId: this.conversationId }
                        });
                    }

                    // Notify client to refresh chat (ONCE)
                    this.sendToClient({
                        type: 'conversationUpdated',
                        data: { conversationId: this.conversationId }
                    });
                } catch (error) {
                    logger.error('[VoiceSession] Error updating conversation:', error);
                }
            }

            logger.info('[VoiceSession] ========== END TURN ==========');
        });

        // Handle client disconnect
        this.clientWs.on('close', () => {
            logger.info(`[VoiceSession] Client disconnected: ${this.userId}`);
            this.stop();
        });

        // Handle errors
        this.clientWs.on('error', (error) => {
            logger.error(`[VoiceSession] Client error:`, error);
        });
    }

    /**
     * Handle message from client
     */
    async handleClientMessage(message) {
        const { type, data } = message;

        switch (type) {
            case 'audio':
                // Forward audio to Gemini
                if (data && data.audioData) {
                    if (this.geminiClient) {
                        this.geminiClient.sendAudio(data.audioData);
                    } else {
                        logger.warn('[VoiceSession] Received audio but Gemini client is not ready');
                    }
                }
                break;

            case 'video':
                // Forward video frame to Gemini
                if (data && data.image) {
                    // Store for parallel report generation
                    this.lastFrame = data.image;

                    if (this.geminiClient) {
                        this.geminiClient.sendVideo(data.image);
                    } else {
                        logger.warn('[VoiceSession] Received video but Gemini client is not ready');
                    }
                }
                break;

            case 'config':
                // Update session configuration
                if (data.voice) {
                    this.config.voice = data.voice;
                    // Reconnect with new voice
                    await this.reconnect();
                }
                break;

            case 'message':
                // Handle text message from client
                if (data && data.text) {
                    if (this.geminiClient) {
                        this.geminiClient.sendText(data.text);
                    } else {
                        logger.warn('[VoiceSession] Received text but Gemini client is not ready');
                    }
                }
                break;

            case 'interrupt':
                // User interrupted, stop current Gemini response
                // TODO: Implement interrupt logic
                this.sendToClient({ type: 'status', data: { status: 'interrupted' } });
                break;

            default:
                logger.warn(`[VoiceSession] Unknown message type: ${type}`);
        }
    }

    /**
     * Handle message from Gemini
     */
    handleGeminiMessage(message) {
        // This method is now largely deprecated as event listeners handle most of the logic.
        // It remains for backward compatibility or specific cases not covered by new events.
        try {
            // Check for User Transcription (often in a different part of the response object)
            // Based on API behavior, we need to inspect where input transcription lands.
            // For now, we log everything to find it.
            if (message.serverContent && !message.serverContent.modelTurn) {
                logger.debug('[VoiceSession] Non-modelTurn content:', JSON.stringify(message.serverContent));
            }
        } catch (error) {
            logger.error('[VoiceSession] Error handling Gemini message:', error);
        }
    }

    /**
     * Send message to client
     */
    sendToClient(message) {
        if (this.clientWs && this.clientWs.readyState === WebSocket.OPEN) {
            this.clientWs.send(JSON.stringify(message));
        }
    }

    /**
     * Reconnect with new configuration
     */
    async reconnect() {
        if (this.geminiClient) {
            this.geminiClient.disconnect();
        }
        await this.start();
    }

    /**
     * Refine transcription using Gemini Flash Lite
     */
    async refineTranscription(text) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-preview-02-05:generateContent?key=${this.apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Please format the following transcription to be more readable, correcting punctuation and capitalization, but keeping the original meaning and words as much as possible. Do not add any conversational filler. Text: "${text}"`
                        }]
                    }]
                })
            });

            const apiKey = await getUserKey({ userId: this.userId, name: EModelEndpoint.google });
            logger.debug(`[VoiceSession] Retrieved API Key for refinement: ${apiKey ? 'Success' : 'Failed'}`);

            if (!apiKey) {
                // Handle case where API key is not found, e.g., by sending original text
                this.sendToClient({
                    type: 'text',
                    data: {
                        text: text,
                        isRefined: false
                    }
                });
                return; // Exit early if no API key
            }

            const data = await response.json();

            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const refinedText = data.candidates[0].content.parts[0].text;

                this.sendToClient({
                    type: 'text',
                    data: {
                        text: refinedText,
                        isRefined: true
                    }
                });

                logger.debug('[VoiceSession] Transcription refined:', refinedText);

                // Save message to database if conversationId is present
                if (this.conversationId) {
                    try {
                        let conversationId = this.conversationId;
                        let isNewConversation = false;

                        // Generate real UUID if conversationId is 'new'
                        if (conversationId === 'new') {
                            conversationId = uuidv4();
                            isNewConversation = true;
                            logger.info(`[VoiceSession] Generated new conversationId: ${conversationId}`);
                        }

                        const messageId = uuidv4();
                        const messageData = {
                            messageId,
                            conversationId,
                            text: refinedText,
                            content: [{ type: 'text', text: refinedText }],
                            user: this.userId,
                            sender: 'User',
                            isCreatedByUser: true,
                            endpoint: EModelEndpoint.google, // Ensure endpoint is set
                            model: this.config.model,
                        };

                        const savedMessage = await saveMessage({ user: { id: this.userId } }, messageData, { context: 'VoiceSession' });

                        if (savedMessage) {
                            // Also save/update the conversation
                            await saveConvo({ user: { id: this.userId } }, savedMessage, { context: 'VoiceSession' });

                            logger.info(`[VoiceSession] Saved user message: ${messageId}`);

                            // Update local conversationId and notify client if it was new
                            if (isNewConversation) {
                                this.conversationId = conversationId;
                                this.sendToClient({
                                    type: 'conversationId',
                                    data: { conversationId: this.conversationId }
                                });
                            }
                        } else {
                            logger.error('[VoiceSession] saveMessage returned null/undefined');
                        }
                    } catch (saveError) {
                        logger.error('[VoiceSession] Error saving message:', saveError);
                    }
                }
            }
        } catch (error) {
            logger.error('[VoiceSession] Error refining transcription:', error);
            // Fallback to original text if refinement fails
            this.sendToClient({
                type: 'text',
                data: {
                    text: text,
                    isRefined: false
                }
            });
        }
    }

    /**
     * Save User Message to database
     */
    async saveUserMessage(text) {
        if (!text) return null;

        try {
            let conversationId = this.conversationId;
            let isNewConversation = false;

            // If conversation doesn't exist, create a new one
            if (!conversationId || conversationId === 'new') {
                conversationId = uuidv4();
                this.conversationId = conversationId;
                isNewConversation = true;
                logger.info(`[VoiceSession] Generated new conversationId for user message: ${conversationId}`);
            }

            const messageId = uuidv4();
            const messageData = {
                messageId,
                conversationId,
                parentMessageId: this.lastMessageId, // Link to previous message in conversation
                text: text,
                content: [{ type: 'text', text: text }],
                user: this.userId,
                sender: 'User',
                isCreatedByUser: true,
                endpoint: EModelEndpoint.google,
                model: this.config.model,
            };

            const savedMessage = await saveMessage({ user: { id: this.userId } }, messageData, { context: 'VoiceSession - User' });

            if (savedMessage) {
                this.lastMessageId = messageId; // Update for next message
                logger.info(`[VoiceSession] Saved user message: ${messageId}`);
                return { isNewConversation, messageId };
            }
            return null;
        } catch (error) {
            logger.error('[VoiceSession] Error saving user message:', error);
            return null;
        }
    }

    /**
     * Save AI Message to database
     */
    async saveAiMessage(text) {
        if (!this.conversationId || !text) return;

        try {
            const messageId = uuidv4();
            const messageData = {
                messageId,
                conversationId: this.conversationId,
                parentMessageId: this.lastMessageId, // Link to user message
                text: text,
                content: [{ type: 'text', text: text }],
                user: this.userId,
                sender: 'Assistant', // AI Sender
                isCreatedByUser: false,
                endpoint: EModelEndpoint.google,
                model: this.config.model,
            };

            const savedMessage = await saveMessage({ user: { id: this.userId } }, messageData, { context: 'VoiceSession - AI' });

            if (savedMessage) {
                this.lastMessageId = messageId; // Update for next message
                logger.info(`[VoiceSession] Saved AI message: ${messageId}`);
            }
        } catch (error) {
            logger.error('[VoiceSession] Error saving AI message:', error);
        }
    }

    /**
     * Stop the session
     */
    /**
     * Correct user transcription using Gemini Flash
     */
    async correctTranscription(userText, aiResponseText) {
        try {
            logger.info(`[VoiceSession] Starting transcription correction for: "${userText}"`);
            const correctionModelName = process.env.TRANSCRIPTION_CORRECTION_MODEL || 'gemini-2.5-flash-lite-preview-09-2025';
            logger.info(`[VoiceSession] Using correction model: ${correctionModelName}`);

            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(this.apiKey);
            const model = genAI.getGenerativeModel({ model: correctionModelName });

            const prompt = `
            You are a transcription correction expert.
            
            CONTEXT:
            - Recent conversation history (for reference ONLY):
            """
            ${aiResponseText}
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

            logger.info(`[VoiceSession] Transcription correction result: "${userText}" -> "${correctedText}"`);
            return correctedText;
        } catch (error) {
            logger.error('[VoiceSession] Error correcting transcription:', error);
            return userText; // Fallback to original
        }
    }

    /**
     * Stop the session
     */
    stop() {
        this.isActive = false;
        this.currentTurnText = '';
        this.aiResponseText = '';

        if (this.geminiClient) {
            this.geminiClient.disconnect();
            this.geminiClient = null;
        }

        // Remove from active sessions
        if (activeSessions.has(this.userId)) {
            activeSessions.delete(this.userId);
        }

        this.stopReportGenerator();
        logger.info(`[VoiceSession] Stopped for user: ${this.userId}`);
    }

    /**
     * Start the parallel report generator
     */
    startReportGenerator() {
        if (this.reportInterval) clearInterval(this.reportInterval);

        logger.info('[VoiceSession] Starting Parallel Report Generator');

        // Generate report every 10 seconds
        this.reportInterval = setInterval(() => {
            this.generateReport();
        }, 10000);
    }

    /**
     * Stop the parallel report generator
     */
    stopReportGenerator() {
        if (this.reportInterval) {
            clearInterval(this.reportInterval);
            this.reportInterval = null;
        }
    }

    /**
     * Generate structured report from latest video frame
     */
    async generateReport() {
        if (!this.lastFrame) return;

        try {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(this.apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite-preview-02-05' });

            const prompt = `
            Actúa como un Experto Senior en Prevención de Riesgos Laborales (HSE).
            Genera un "Análisis de Trabajo Seguro (ATS)" basado en la imagen proporcionada.
            
            ESTRUCTURA OBLIGATORIA (Markdown):
            
            # Análisis de Trabajo Seguro (ATS) - Reporte en Vivo
            
            ## 1. Descripción del Entorno
            (Breve descripción técnica del área y condiciones).
            
            ## 2. Matriz de Riesgos
            | Peligro Identificado | Riesgo Asociado | Probabilidad | Consecuencia | Nivel |
            |---|---|---|---|---|
            | ... | ... | ... | ... | ... |
            
            ## 3. Controles Recomendados
            | Riesgo | Control de Ingeniería | Control Administrativo | EPP |
            |---|---|---|---|---|
            | ... | ... | ... | ... | ... |
            
            IMPORTANTE:
            - Sé conciso y directo.
            - Usa tablas Markdown estándar.
            - Si no hay riesgos visibles, indícalo claramente.
            `;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: this.lastFrame,
                        mimeType: 'image/jpeg'
                    }
                }
            ]);

            const response = await result.response;
            const reportText = response.text();

            logger.info('[VoiceSession] Generated Parallel Report');

            // Send to client as the main text content
            this.sendToClient({
                type: 'text',
                data: { text: reportText }
            });

            // DO NOT save to aiResponseText to avoid auto-saving to DB and creating new chats
            // this.aiResponseText = reportText; 

        } catch (error) {
            logger.error('[VoiceSession] Error generating parallel report:', error);
        }
    }
}

/**
 * Create a new voice session for a user
 */
async function createSession(clientWs, userId, conversationId) {
    try {
        // Check if user already has active session
        if (activeSessions.has(userId)) {
            logger.warn(`[VoiceSession] User ${userId} already has active session`);
            const existingSession = activeSessions.get(userId);
            existingSession.stop();
        }

        // Get user's Google API key
        const apiKey = await getUserKey({ userId, name: EModelEndpoint.google });

        if (!apiKey) {
            throw new Error('Google API Key not configured');
        }

        // Parse API key if stored as JSON
        let parsedKey = apiKey;
        try {
            const parsed = JSON.parse(apiKey);
            parsedKey = parsed.GOOGLE_API_KEY || parsed;
        } catch (e) {
            // Key is not JSON, use as-is
        }

        // Create session
        const session = new VoiceSession(clientWs, userId, parsedKey, {}, conversationId);

        // Start session
        const result = await session.start();

        if (result.success) {
            activeSessions.set(userId, session);
            return { success: true, session };
        } else {
            return { success: false, error: result.error };
        }

    } catch (error) {
        logger.error('[VoiceSession] Error creating session:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get active session for user
 */
function getSession(userId) {
    return activeSessions.get(userId);
}

/**
 * Stop session for user
 */
function stopSession(userId) {
    const session = activeSessions.get(userId);
    if (session) {
        session.stop();
        return true;
    }
    return false;
}

module.exports = {
    VoiceSession,
    createSession,
    getSession,
    stopSession,
    activeSessions,
};
