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

        logger.info(`[VoiceSession] Created for user: ${userId}, conversationId: ${conversationId || 'NULL'}`);

        // Setup client handlers once
        this.setupClientHandlers();
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

            // Setup message handlers for Gemini
            this.setupGeminiHandlers();

            this.isActive = true;
            logger.info(`[VoiceSession] Started for user: ${this.userId}`);

            return { success: true };
        } catch (error) {
            logger.error(`[VoiceSession] Failed to start:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Setup message handlers for Client (Once)
     */
    setupClientHandlers() {
        // Handle messages from client
        this.clientWs.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                await this.handleClientMessage(message);
            } catch (error) {
                logger.error('[VoiceSession] Error handling client message:', error);
            }
        });
    }

    /**
     * Setup message handlers between Gemini and Server
     */
    setupGeminiHandlers() {
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
            // Accumulate AI text
            this.aiResponseText += text;
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

        // Listen for Tool Calls
        this.geminiClient.on('toolCall', (toolCall) => {
            logger.info('[VoiceSession] Tool Call received:', JSON.stringify(toolCall));

            if (toolCall.functionCalls) {
                const responses = toolCall.functionCalls.map(fc => ({
                    id: fc.id,
                    name: fc.name,
                    response: { result: "Function execution not implemented on client" }
                }));
                this.geminiClient.sendToolResponse(responses);
            }
        });

        // Listen for turn complete
        this.geminiClient.on('turnComplete', async () => {
            logger.info('[VoiceSession] ========== TURN COMPLETE ==========');
            logger.info(`[VoiceSession] Accumulated user text length: ${this.userTranscriptionText.length}`);
            logger.info(`[VoiceSession] Accumulated AI text length: ${this.aiResponseText.length}`);
            this.sendToClient({ type: 'status', data: { status: 'turn_complete' } });

            // Capture current turn text before clearing
            const currentUserText = this.userTranscriptionText;
            const currentAiText = this.aiResponseText;

            logger.info(`[VoiceSession] Turn Complete. UserText: "${currentUserText}", AIResponse: "${currentAiText}"`);

            let messagesSaved = false;
            let isNewConversation = false;

            // CRITICAL: Save user message FIRST, then AI message
            // This ensures proper parent-child relationship in the message chain
            if (currentUserText.trim()) {
                const preview = currentUserText.substring(0, 100);
                logger.info(`[VoiceSession] Saving USER message. Preview: "${preview}..."`);
                logger.info(`[VoiceSession] Current lastMessageId before user save: ${this.lastMessageId}`);

                // FASE 6: Transcription Correction
                let textToSave = currentUserText.trim();
                if (currentAiText.trim()) {
                    textToSave = await this.correctTranscription(textToSave, currentAiText.trim());
                }

                const result = await this.saveUserMessage(textToSave);
                if (result) {
                    messagesSaved = true;
                    isNewConversation = result.isNewConversation;
                    logger.info(`[VoiceSession] User message saved. New lastMessageId: ${this.lastMessageId}`);
                }
                this.userTranscriptionText = ''; // Reset after saving
            } else {
                logger.warn(`[VoiceSession] No user transcription to save. Value: "${currentUserText}"`);
            }

            // Save AI response AFTER user message (uses updated lastMessageId as parent)
            if (currentAiText.trim()) {
                const preview = currentAiText.substring(0, 100);
                logger.info(`[VoiceSession] Saving AI message. Preview: "${preview}..."`);
                logger.info(`[VoiceSession] Current lastMessageId before AI save: ${this.lastMessageId}`);

                await this.saveAiMessage(currentAiText.trim());
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
                logger.warn(`[VoiceSession] No AI response to save. Text: "${currentAiText}", Audio chunks: ${this.aiAudioChunkCount}`);
            }

            // TRIGGER REPORT GENERATION (Second Brain)
            // We use the accumulated context + current turn
            const currentTurnContext = `User: ${currentUserText}\nAI: ${currentAiText}`;
            this.config.conversationContext = (this.config.conversationContext || '') + '\n' + currentTurnContext;

            // Prevent concurrent report generation
            if (this.isGeneratingReport) {
                logger.info('[VoiceSession] Report generation already in progress. Skipping trigger.');
                return;
            }

            // ONLY trigger report if AI explicitly says it will generate it
            // Keywords based on the system prompt instruction: "Entendido. Estoy procesando..."
            const triggerKeywords = ['generar el informe', 'generar el reporte', 'procesando lo que vimos', 'procesando la información visual'];
            const shouldGenerateReport = triggerKeywords.some(keyword => currentAiText.toLowerCase().includes(keyword));

            if (shouldGenerateReport) {
                logger.info('[VoiceSession] Report generation triggered by AI response keywords.');

                // Notify client that report is being generated
                this.sendToClient({
                    type: 'report',
                    data: { html: '<p class="text-gray-500 italic animate-pulse">Generando informe técnico detallado...</p>' }
                });

                // Generate report asynchronously (don't block)
                this.isGeneratingReport = true;
                this.generateReport(this.config.conversationContext).finally(() => {
                    this.isGeneratingReport = false;
                });
            } else {
                logger.info('[VoiceSession] Report generation NOT triggered (no keywords found).');
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
                    logger.info(`[VoiceSession] Config update received. New voice: ${data.voice}`);
                    this.config.voice = data.voice;
                    // Reconnect with new voice
                    await this.reconnect();
                    logger.info(`[VoiceSession] Reconnected with voice: ${this.config.voice}`);
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
            const correctionModelName = 'gemini-2.5-flash-lite-preview-09-2025'; // Requested by user
            logger.info(`[VoiceSession] Using correction model: ${correctionModelName}`);

            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(this.apiKey);
            const model = genAI.getGenerativeModel({ model: correctionModelName });

            const prompt = `
            Act as a spelling and grammar corrector for a voice transcription.
            
            CONTEXT (Previous conversation):
            """
            ${this.config.conversationContext || ''}
            AI Last Response: ${aiResponseText}
            """
            
            RAW TRANSCRIPTION (Needs correction):
            """
            ${userText}
            """
            
            INSTRUCTIONS:
            1. Correct phonetic errors (e.g., "Comprece" -> "Comprendo" or "Cómprese", depending on context).
            2. Fix capitalization and punctuation.
            3. Keep the intent and meaning exactly the same.
            4. If the text is in Spanish, keep it in Spanish.
            5. OUTPUT ONLY THE CORRECTED TEXT. NO EXPLANATIONS.
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
     * Generate Formal Report using Gemini Flash
     */
    async generateReport(conversationContext) {
        try {
            logger.info('[VoiceSession] Generating formal report...');
            logger.info(`[VoiceSession] Context length: ${conversationContext ? conversationContext.length : 0}`);

            if (!conversationContext || conversationContext.length < 10) {
                logger.warn('[VoiceSession] Context too short, skipping report generation');
                this.sendToClient({
                    type: 'report',
                    data: { html: '<p class="text-yellow-600">No hay suficiente información para generar el informe aún. Continúe la conversación.</p>' }
                });
                return null;
            }

            const modelName = 'gemini-2.5-flash-lite-preview-09-2025'; // Updated to user requested model

            const { GoogleGenerativeAI } = require('@google/generative-ai');
            // Ensure apiKey is a string
            let key = this.apiKey;
            if (typeof key === 'object') {
                key = key.GOOGLE_API_KEY || JSON.stringify(key);
            }
            // If key is still object or invalid, try to parse or log error
            if (!key || typeof key !== 'string') {
                logger.error(`[VoiceSession] Invalid API Key for report generation: ${typeof key}`);
                // Try to get key again?
            }

            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = `
            You are a Safety Reporting Assistant.
            
            CONTEXT (Conversation History):
            """
            ${conversationContext}
            """
            
            TASK:
            1. DETECT the language used in the conversation context (e.g., Spanish, English, Portuguese).
            2. Generate a FORMAL RISK ASSESSMENT REPORT in the DETECTED LANGUAGE.
            3. The report must summarize the findings discussed in the conversation.
            
            OUTPUT FORMAT (HTML):
            - Use <h2>, <h3>, <p>, <ul>, <li>.
            - Use <table> with border="1" style="border-collapse: collapse; width: 100%;" for matrices.
            - SECTIONS (Translate titles to detected language):
              1. Description of Environment
              2. Technical Analysis (Unsafe conditions/acts)
              3. Risk Matrix (Table: Hazard, Risk, Probability, Consequence, Level)
              4. Hierarchy of Controls (Table: Risk, Elimination, Engineering, Admin, PPE)
            
            IMPORTANT:
            - Output ONLY the HTML. No markdown code blocks.
            - If information is missing for a section, state "Not observed yet" (translated) or infer from context if reasonable.
            - Keep it professional and technical.
            `;

            logger.info(`[VoiceSession] Sending prompt to model: ${modelName}`);
            logger.debug(`[VoiceSession] API Key present: ${!!key}`);

            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const reportHtml = response.text().replace(/```html/g, '').replace(/```/g, '').trim();

                logger.info(`[VoiceSession] Report generated successfully (${reportHtml.length} chars)`);

                // SAVE REPORT TO DATABASE FIRST (Persistence)
                // This ensures we have a messageId BEFORE sending to client
                let messageId = uuidv4();
                if (this.conversationId && this.conversationId !== 'new') {
                    try {
                        // Helper to convert HTML to Markdown (Basic implementation)
                        const convertHtmlToMarkdown = (html) => {
                            let md = html;
                            md = md.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g, '\n### $1\n');
                            md = md.replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**');
                            md = md.replace(/<b[^>]*>(.*?)<\/b>/g, '**$1**');
                            md = md.replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*');
                            md = md.replace(/<i[^>]*>(.*?)<\/i>/g, '*$1*');
                            md = md.replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n');
                            md = md.replace(/<ul[^>]*>/g, '\n');
                            md = md.replace(/<\/ul>/g, '\n');
                            md = md.replace(/<p[^>]*>(.*?)<\/p>/g, '\n$1\n');
                            md = md.replace(/<br\s*\/?>/g, '\n');
                            md = md.replace(/<[^>]*>/g, ''); // Remove remaining tags
                            md = md.replace(/&nbsp;/g, ' ');
                            md = md.replace(/\n\s*\n\s*\n/g, '\n\n'); // Fix excess newlines
                            return md.trim();
                        };

                        const reportMarkdown = convertHtmlToMarkdown(reportHtml);

                        // Extract a brief summary for the Voice AI (First 200 chars or first paragraph)
                        let summaryForVoice = "un informe técnico detallado";
                        const summaryMatch = reportHtml.match(/<p[^>]*>(.*?)<\/p>/);
                        if (summaryMatch && summaryMatch[1]) {
                            summaryForVoice = summaryMatch[1].substring(0, 150) + "...";
                        }

                        const reportMessage = {
                            messageId,
                            conversationId: this.conversationId,
                            parentMessageId: this.lastMessageId, // Link to last message
                            sender: 'Assistant', // Save as Assistant
                            text: reportMarkdown, // SAVE AS MARKDOWN for Chat UI
                            content: [{ type: 'text', text: reportMarkdown }], // CRITICAL: Add content array for compatibility
                            isCreatedByUser: false,
                            error: false,
                            model: modelName,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };

                        await saveMessage({ user: { id: this.userId } }, reportMessage, { context: 'VoiceSession - Report' });
                        this.lastMessageId = messageId; // Update pointer
                        logger.info(`[VoiceSession] Report saved to DB. MessageId: ${messageId}`);

                        // INTERACTIVITY: Instruct Gemini Live (First Brain) to announce the report
                        if (this.client && this.isActive) {
                            logger.info('[VoiceSession] Instructing Gemini Live to announce report...');
                            const announcementPrompt = `
                            [SYSTEM NOTIFICATION]
                            The technical report has been successfully generated.
                            
                            HERE IS THE SUMMARY OF THE REPORT:
                            "${summaryForVoice}"
                            
                            YOUR TASK:
                            Verbally announce this to the user immediately using the summary above.
                            
                            SAY EXACTLY THIS (in Spanish):
                            "He generado el informe técnico. Basado en lo que vi: ${summaryForVoice}"
                            `;

                            // Send as text input to the model
                            this.client.sendText(announcementPrompt);
                        }

                    } catch (saveError) {
                        logger.error('[VoiceSession] Error saving report to DB:', saveError);
                        // Continue anyway, client will receive report but save might fail if clicked immediately
                    }
                }

                // Notify client with report AND messageId
                this.sendToClient({
                    type: 'report',
                    data: { html: reportHtml, messageId: messageId }
                });

                return reportHtml;
            } catch (error) {
                logger.error('[VoiceSession] Error generating report:', error);
                // Send error state to client so it doesn't hang
                this.sendToClient({
                    type: 'report',
                    data: { html: `<p class="text-red-500">Error generando el informe: ${error.message}. Verifique los logs del servidor.</p>` }
                });
                return null;
            }
        }

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

            logger.info(`[VoiceSession] Stopped for user: ${this.userId} `);
        }
    }

/**
 * Create a new voice session for a user
 * @param {WebSocket} clientWs
 * @param {string} userId
 * @param {string} conversationId
 * @param {string|Object} configOrVoice - Initial voice name (string) or full config object
 */
async function createSession(clientWs, userId, conversationId, configOrVoice = null) {
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
        let config = {};
        if (configOrVoice) {
            if (typeof configOrVoice === 'string') {
                config.voice = configOrVoice;
                logger.info(`[VoiceSession] Initializing with voice: ${configOrVoice} `);
            } else if (typeof configOrVoice === 'object') {
                config = configOrVoice;
                logger.info(`[VoiceSession] Initializing with custom config`);
            }
        }
        const session = new VoiceSession(clientWs, userId, parsedKey, config, conversationId);

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
