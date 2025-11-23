const WebSocket = require('ws');
const logger = require('~/config/winston');
const { getUserKey } = require('~/server/services/UserService');
const { EModelEndpoint } = require('librechat-data-provider');

/**
 * Gemini Live API WebSocket client
 * Handles bidirectional audio streaming with Gemini
 */
class GeminiLiveClient {
    constructor(apiKey, config = {}) {
        this.apiKey = apiKey;
        this.config = {
            model: config.model || 'gemini-2.5-flash-native-audio-preview-09-2025',
            voice: config.voice || 'Sol',
            language: config.language || 'es-ES',
            ...config,
        };
        this.ws = null;
        this.connected = false;
        this.sessionId = null;
    }

    /**
     * Connect to Gemini Live API via WebSocket
     */
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                const endpoint = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;

                this.ws = new WebSocket(endpoint);

                this.ws.on('open', () => {
                    logger.info('[GeminiLive] WebSocket connected');
                    this.connected = true;

                    // Send initial setup message
                    this.sendSetup();
                    resolve();
                });

                this.ws.on('error', (error) => {
                    logger.error('[GeminiLive] WebSocket error:', error);
                    this.connected = false;
                    reject(error);
                });

                this.ws.on('close', () => {
                    logger.info('[GeminiLive] WebSocket closed');
                    this.connected = false;
                });

            } catch (error) {
                logger.error('[GeminiLive] Connection error:', error);
                reject(error);
            }
        });
    }

    /**
     * Send initial setup configuration to Gemini
     */
    sendSetup() {
        const setupMessage = {
            setup: {
                model: `models/${this.config.model}`,
                generationConfig: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: this.config.voice,
                            },
                        },
                    },
                },
            },
        };

        this.send(setupMessage);
        logger.info(`[GeminiLive] Setup sent with voice: ${this.config.voice}`);
    }

    /**
     * Send audio chunk to Gemini
     * @param {string} audioData - Base64 encoded PCM audio
     */
    sendAudio(audioData) {
        if (!this.connected) {
            logger.warn('[GeminiLive] Cannot send audio, not connected');
            return;
        }

        const message = {
            realtimeInput: {
                mediaChunks: [
                    {
                        mimeType: 'audio/pcm',
                        data: audioData,
                    },
                ],
            },
        };

        this.send(message);
    }

    /**
     * Send message to Gemini WebSocket
     */
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            logger.warn('[GeminiLive] WebSocket not ready to send');
        }
    }

    /**
     * Set message handler for responses
     */
    onMessage(callback) {
        if (this.ws) {
            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    callback(message);
                } catch (error) {
                    logger.error('[GeminiLive] Error parsing message:', error);
                }
            });
        }
    }

    /**
     * Close connection
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.connected = false;
            logger.info('[GeminiLive] Disconnected');
        }
    }
}

module.exports = GeminiLiveClient;
