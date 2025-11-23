const WebSocket = require('ws');
const EventEmitter = require('events');
const logger = require('~/config/winston');
const { getUserKey } = require('~/server/services/UserService');
const { EModelEndpoint } = require('librechat-data-provider');

/**
 * Gemini Live API WebSocket client
 * Handles bidirectional audio streaming with Gemini
 */
class GeminiLiveClient extends EventEmitter {
    constructor(apiKey, config = {}) {
        super();
        this.apiKey = apiKey;
        this.config = {
            model: config.model || 'gemini-2.5-flash-native-audio-preview-09-2025',
            voice: config.voice || 'Puck',
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
                const endpoint = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;

                this.ws = new WebSocket(endpoint);

                this.ws.on('open', () => {
                    logger.info('[GeminiLive] WebSocket connected');
                    this.connected = true;

                    // Send initial setup message
                    this.sendSetup();

                    // Flush any buffered messages (audio/video sent while connecting)
                    this.flushBuffer();

                    resolve();
                });

                this.ws.on('error', (error) => {
                    logger.error('[GeminiLive] WebSocket error:', error);
                    this.connected = false;
                    reject(error);
                });

                this.ws.on('close', (code, reason) => {
                    logger.info(`[GeminiLive] WebSocket closed. Code: ${code}, Reason: ${reason}`);
                    this.connected = false;
                });

                this.ws.on('message', (data) => {
                    try {
                        const response = JSON.parse(data);
                        // logger.debug('[GeminiLive] Received message:', Object.keys(response)); // Too noisy for production but good for debug

                        if (response.serverContent) {
                            if (response.serverContent.modelTurn) {
                                const parts = response.serverContent.modelTurn.parts;
                                for (const part of parts) {
                                    if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
                                        // Audio received
                                        const audioData = part.inlineData.data;
                                        this.emit('audio', audioData);
                                    } else if (part.text) {
                                        // Text received (log it to see if Gemini is responding in text)
                                        logger.info('[GeminiLive] Received text response:', part.text);
                                    }
                                }
                            }

                            if (response.serverContent.turnComplete) {
                                logger.info('[GeminiLive] Turn complete');
                            }
                        } else {
                            // Log other message types for debugging
                            logger.info('[GeminiLive] Received non-content message:', Object.keys(response));
                        }
                    } catch (error) {
                        logger.error('[GeminiLive] Error parsing message:', error);
                    }
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
                generation_config: {
                    response_modalities: ['AUDIO'],
                    speech_config: {
                        voice_config: {
                            prebuilt_voice_config: {
                                voice_name: this.config.voice,
                            },
                        },
                    },
                },
            },
        };

        logger.info('[GeminiLive] Sending setup message:', JSON.stringify(setupMessage, null, 2));
        this.send(setupMessage);
    }

    /**
     * Send audio chunk to Gemini
     * @param {string} audioData - Base64 encoded PCM audio (16kHz, 1 channel, 16-bit)
     */
    sendAudio(audioData) {
        const message = {
            realtime_input: {
                media_chunks: [
                    {
                        mime_type: 'audio/pcm;rate=16000',
                        data: audioData,
                    },
                ],
            },
        };

        this.send(message);
    }

    /**
     * Send video frame to Gemini
     * @param {string} base64Image - Base64 encoded JPEG image
     */
    sendVideo(base64Image) {
        const message = {
            realtime_input: {
                media_chunks: [
                    {
                        mime_type: 'image/jpeg',
                        data: base64Image,
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
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.connected) {
            this.ws.send(JSON.stringify(message));
        } else {
            // Buffer message if not connected yet
            if (!this.messageBuffer) {
                this.messageBuffer = [];
            }
            // Limit buffer size to prevent memory leaks (e.g. 5 seconds of audio approx 50 chunks)
            if (this.messageBuffer.length < 100) {
                this.messageBuffer.push(message);
            }
        }
    }

    /**
     * Flush buffered messages
     */
    flushBuffer() {
        if (this.messageBuffer && this.messageBuffer.length > 0) {
            logger.info(`[GeminiLive] Flushing ${this.messageBuffer.length} buffered messages`);
            while (this.messageBuffer.length > 0) {
                const message = this.messageBuffer.shift();
                this.send(message);
            }
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
