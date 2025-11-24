const WebSocket = require('ws');
const logger = require('~/config/winston');
const GeminiLiveClient = require('./geminiLive');
const { getUserKey } = require('~/server/services/UserService');
const { EModelEndpoint } = require('librechat-data-provider');

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
    constructor(clientWs, userId, apiKey, config = {}) {
        this.clientWs = clientWs;
        this.userId = userId;
        this.apiKey = apiKey;
        this.config = config;
        this.geminiClient = null;
        this.isActive = false;
        this.currentTurnText = ''; // Accumulate text for the current turn

        logger.info(`[VoiceSession] Created for user: ${userId}`);
    }

    /**
     * Initialize and start the session
     */
    async start() {
        try {
            // Create Gemini Live client
            this.geminiClient = new GeminiLiveClient(this.apiKey, this.config);

            // Connect to Gemini
            await this.geminiClient.connect();

            // Setup message handlers
            this.setupHandlers();

            this.isActive = true;
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

        // Handle audio events from Gemini (cleaner and handles MIME types correctly)
        this.geminiClient.on('audio', (audioData) => {
            this.sendToClient({
                type: 'audio',
                data: {
                    audioData: audioData,
                },
            });
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
                    this.config.voice = data.voice;
                    // Reconnect with new voice
                    await this.reconnect();
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
        try {
            // Extract audio response if present
            if (message.serverContent) {
                const { modelTurn } = message.serverContent;

                if (modelTurn && modelTurn.parts) {
                    for (const part of modelTurn.parts) {
                        // Audio response
                        // Audio response is now handled by the 'audio' event listener
                        // which correctly handles variable MIME types (e.g. audio/pcm;rate=24000)

                        // Text response (transcription or thinking)
                        if (part.text) {
                            // Accumulate text for refinement
                            this.currentTurnText += part.text;
                            logger.debug('[VoiceSession] Received text from Gemini (accumulating):', part.text);
                        }
                    }
                }
            }

            // Handle setup complete
            if (message.setupComplete) {
                this.sendToClient({ type: 'status', data: { status: 'ready' } });
            }

            // Handle turn complete
            if (message.serverContent && message.serverContent.turnComplete) {
                this.sendToClient({ type: 'status', data: { status: 'turn_complete' } });

                // Refine transcription if we have text
                if (this.currentTurnText) {
                    this.refineTranscription(this.currentTurnText);
                    this.currentTurnText = '';
                }
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

            const apiKey = await getUserKey(this.userId);
            logger.info(`[VoiceSession] Retrieved API Key for user ${this.userId}: ${apiKey ? 'Found (ends in ...' + apiKey.slice(-4) + ')' : 'Not Found'}`);

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
     * Stop the session
     */
    stop() {
        this.isActive = false;
        this.currentTurnText = '';

        if (this.geminiClient) {
            this.geminiClient.disconnect();
            this.geminiClient = null;
        }

        // Remove from active sessions
        if (activeSessions.has(this.userId)) {
            activeSessions.delete(this.userId);
        }

        logger.info(`[VoiceSession] Stopped for user: ${this.userId}`);
    }
}

/**
 * Create a new voice session for a user
 */
async function createSession(clientWs, userId) {
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
        const session = new VoiceSession(clientWs, userId, parsedKey);

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
