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
                logger.info(`[GeminiLive] Connecting to endpoint with key ending in: ...${this.apiKey ? this.apiKey.slice(-4) : 'NONE'}`);
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

                        if (response.serverContent) {
                            // 1. Handle USER TRANSCRIPTION (from audio input)
                            if (response.serverContent.outputTranscription) {
                                const userText = response.serverContent.outputTranscription.text;
                                if (userText && userText.trim()) {
                                    logger.info(`[GeminiLive] User transcription: "${userText}"`);
                                    this.emit('userTranscription', userText);
                                }
                            }

                            // 2. Handle AI AUDIO + TEXT RESPONSE (modelTurn)
                            if (response.serverContent.modelTurn) {
                                const parts = response.serverContent.modelTurn.parts;
                                for (const part of parts) {
                                    if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
                                        // Audio received
                                        const audioData = part.inlineData.data;
                                        this.emit('audio', audioData);
                                    } else if (part.text && part.text.trim()) {
                                        // AI Text response (if enabled with TEXT modality)
                                        logger.info(`[GeminiLive] AI text: "${part.text}"`);
                                        this.emit('aiText', part.text);
                                    }
                                }
                            }

                            // 3. Handle TURN COMPLETE
                            if (response.serverContent.turnComplete) {
                                logger.info('[GeminiLive] ===== TURN COMPLETE =====');
                                this.emit('turnComplete');
                            }
                        }

                        // Handle setup complete
                        if (response.setupComplete) {
                            logger.info('[GeminiLive] Setup complete');
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
                generationConfig: {
                    // CRÍTICO: NO CAMBIAR A ['AUDIO', 'TEXT'] - ROMPE LA IA COMPLETAMENTE
                    // La IA deja de responder si se agrega 'TEXT' a responseModalities
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: 'Kore',
                            },
                        },
                    },
                },
                systemInstruction: {
                    parts: [
                        {
                            text: 'Eres un asistente de Seguridad y Salud en el Trabajo (SST). SOLO responde cuando el usuario te hable o haga una pregunta. NO analices el video a menos que te lo pidan específicamente. Responde SIEMPRE en español. NO incluyas tu proceso de pensamiento en la respuesta, solo da la respuesta final.',
                        },
                    ],
                },
                // outputAudioTranscription = transcribe lo que la IA dice
                // SÍ funciona (aunque transcribe a la IA, no al usuario)
                // inputAudioTranscription = NO funciona (no transcribe nada)
                outputAudioTranscription: {},
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
            realtimeInput: {
                mediaChunks: [
                    {
                        mimeType: 'audio/pcm;rate=16000',
                        data: audioData,
                    },
                ],
            },
        };
        logger.debug('[GeminiLive] Sending audio chunk with transcription and tools request');
        this.send(message);
    }

    /**
     * Send video frame to Gemini
     * @param {string} base64Image - Base64 encoded JPEG image
     */
    sendVideo(base64Image) {
        const message = {
            realtimeInput: {
                mediaChunks: [
                    {
                        mimeType: 'image/jpeg',
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
