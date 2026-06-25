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

        const rawModel = config.model || process.env.GEMINI_LIVE_MODEL || 'gemini-3.1-flash-live-preview';
        const mapModelToRealGoogleModel = (modelName) => {
            if (!modelName) return 'gemini-3.1-flash-live-preview';
            const name = modelName.toLowerCase().trim();
            if (name === 'gemini-3.1-flash-live-preview' || name === 'gemini-2.5-flash-native-audio-preview-12-2025' || name === 'gemini-2.5-flash-native-audio-preview-09-2025') {
                return name;
            }
            if (name.includes('3.5') || name.includes('3.1') || name.includes('live')) {
                return 'gemini-3.1-flash-live-preview';
            }
            if (name.includes('09-2025')) {
                return 'gemini-2.5-flash-native-audio-preview-09-2025';
            }
            if (name.includes('12-2025')) {
                return 'gemini-2.5-flash-native-audio-preview-12-2025';
            }
            if (name.includes('2.5') || name.includes('native-audio')) {
                return 'gemini-2.5-flash-native-audio-preview-12-2025';
            }
            return 'gemini-3.1-flash-live-preview';
        };

        const resolvedModel = mapModelToRealGoogleModel(rawModel);

        const mapVoiceToGeminiLive = (voiceId) => {
            if (!voiceId) return 'Puck';
            const clean = voiceId.toLowerCase().trim();
            switch (clean) {
                case 'sol':
                    return 'Aoede';
                case 'spruce':
                    return 'Fenrir';
                case 'ember':
                    return 'Kore';
                case 'kore':
                    return 'Kore';
                case 'orbit':
                    return 'Puck';
                case 'puck':
                    return 'Puck';
                case 'charon':
                    return 'Charon';
                case 'fenrir':
                    return 'Fenrir';
                case 'aoede':
                    return 'Aoede';
                default:
                    // Capitalize first letter as fallback
                    return voiceId.charAt(0).toUpperCase() + voiceId.slice(1);
            }
        };

        const resolvedVoice = mapVoiceToGeminiLive(config.voice || 'Puck');

        this.config = {
            voice: resolvedVoice,
            language: config.language || 'es-ES',
            ...config,
            model: resolvedModel,
        };
        this.config.voice = resolvedVoice;
        this.config.model = resolvedModel;
        this.ws = null;
        this.connected = false;
        this.sessionId = null;
    }

    /**
     * Connect to Gemini Live API via WebSocket
     */
    async connect() {
        return new Promise((resolve, reject) => {
            let connectionTimeout = setTimeout(() => {
                logger.error('[GeminiLive] Connection timeout (4s) before setupComplete');
                cleanup();
                if (this.ws) {
                    try {
                        this.ws.terminate();
                    } catch (e) {
                        logger.error('[GeminiLive] Error terminating ws on timeout:', e);
                    }
                    this.ws = null;
                }
                reject(new Error('Connection timeout to Gemini Live API'));
            }, 4000);

            const cleanup = () => {
                if (connectionTimeout) {
                    clearTimeout(connectionTimeout);
                    connectionTimeout = null;
                }
            };

            try {
                const endpoint = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;
                logger.info(`[GeminiLive] Connecting to endpoint with key ending in: ...${this.apiKey ? this.apiKey.slice(-4) : 'NONE'}`);
                this.ws = new WebSocket(endpoint);

                this.ws.on('open', () => {
                    logger.info('[GeminiLive] WebSocket connected, waiting for setupComplete...');
                    this.connected = true;

                    // Send initial setup message
                    this.sendSetup();

                    // Flush any buffered messages (audio/video sent while connecting)
                    this.flushBuffer();
                });

                this.ws.on('error', (error) => {
                    logger.error('[GeminiLive] WebSocket error:', error);
                    this.connected = false;
                    if (!this.setupCompleted) {
                        cleanup();
                        reject(error);
                    }
                });

                this.ws.on('close', (code, reason) => {
                    logger.info(`[GeminiLive] WebSocket closed. Code: ${code}, Reason: ${reason}`);
                    this.connected = false;
                    
                    if (!this.setupCompleted) {
                        // Socket closed BEFORE setup was completed (e.g. Quota Exceeded, Leaked Key, Invalid Model)
                        cleanup();
                        reject(new Error(`WebSocket closed before setup. Code: ${code}, Reason: ${reason}`));
                    } else {
                        // Socket closed normally after being active
                        this.emit('close', code, reason);
                    }
                });

                this.ws.on('message', (data) => {
                    try {
                        const response = JSON.parse(data);

                        // FASE 3 FIX: Separate handling for input vs output transcription
                        if (response.serverContent) {
                            // 1. Handle USER TRANSCRIPTION (from INPUT audio - what user says)
                            if (response.serverContent.inputTranscription) {
                                const userText = response.serverContent.inputTranscription.text;
                                if (userText && userText.trim()) {
                                    logger.info(`[GeminiLive] User transcription (input): "${userText}"`);
                                    this.emit('userTranscription', userText);
                                }
                            }

                            // 2. Handle AI TRANSCRIPTION (from OUTPUT audio - what AI says)
                            if (response.serverContent.outputTranscription) {
                                const aiText = response.serverContent.outputTranscription.text;
                                if (aiText && aiText.trim()) {
                                    logger.info(`[GeminiLive] AI transcription (output): "${aiText}"`);
                                    this.emit('aiTranscription', aiText);
                                }
                            }

                            // 3. Handle AI AUDIO + TEXT RESPONSE (modelTurn)
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

                            // 4. Handle TURN COMPLETE
                            if (response.serverContent.turnComplete) {
                                logger.info('[GeminiLive] ===== TURN COMPLETE =====');
                                this.emit('turnComplete');
                            }
                        }

                        // 5. Handle TOOL CALL
                        if (response.toolCall) {
                            logger.info('[GeminiLive] Tool Call received:', JSON.stringify(response.toolCall));
                            this.emit('toolCall', response.toolCall);
                        }

                        // Handle setup complete
                        if (response.setupComplete) {
                            logger.info('[GeminiLive] Setup complete');
                            this.setupCompleted = true;
                            cleanup();
                            resolve(); // Now the connection is TRULY established and approved by Google!
                        }
                    } catch (error) {
                        logger.error('[GeminiLive] Error parsing message:', error);
                    }
                });

            } catch (error) {
                logger.error('[GeminiLive] Connection error:', error);
                cleanup();
                reject(error);
            }
        });
    }

    /**
     * Send Tool Response to Gemini
     * @param {Array} functionResponses - Array of {id, name, response} objects
     */
    sendToolResponse(functionResponses) {
        const message = {
            toolResponse: {
                functionResponses: functionResponses
            }
        };
        logger.info('[GeminiLive] Sending tool response:', JSON.stringify(message));
        this.send(message);
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
                                voiceName: this.config.voice || 'Puck',
                            },
                        },
                    },
                },
                systemInstruction: {
                    parts: [
                        {
                            text: this.config.systemInstruction
                                ? `${this.config.systemInstruction}\n\n${this.config.conversationContext ? `CONTEXTO DE CONVERSACIÓN PREVIA:\n${this.config.conversationContext}` : ''}`
                                : `Actúa como un Experto Senior en Seguridad y Salud en el Trabajo (SST/HSE). Tienes capacidades multimodales: puedes escuchar, hablar y VER a través de la cámara del usuario.

                            INSTRUCCIONES DE COMPORTAMIENTO:
                            1. **ANÁLISIS VISUAL Y DE RIESGOS:** Cuando el usuario te pida analizar el video, identificar peligros, o describir el entorno:
                               - Tu respuesta debe ser EXTREMADAMENTE DETALLADA, TÉCNICA Y EXPLICITA.
                               - NO seas breve. Profundiza en cada elemento observado.
                               - Identifica condiciones inseguras, actos inseguros y factores de riesgo.
                               - Usa terminología técnica adecuada.
                               - Sé descriptivo y minucioso; no dejes nada por determinar.

                            2. **CAPACIDAD VISUAL:**
                               - Tienes permiso y capacidad total para ver el video.
                               - Si te preguntan "¿Qué ves?", responde desde una perspectiva de seguridad y prevención.
                               - NUNCA digas que no puedes ver.

                            Responde SIEMPRE en español.
                            
                            ${this.config.conversationContext ? `CONTEXTO DE CONVERSACIÓN PREVIA:\n${this.config.conversationContext}` : ''}`,
                        },
                    ],
                },
                // FASE 3: Using BOTH transcriptions simultaneously
                // inputAudioTranscription = transcribes user's voice
                // outputAudioTranscription = transcribes AI's voice
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                // Add Tools support
                tools: this.config.tools || [{ googleSearch: {} }], // Default to Google Search enabled if not specified, or allow passing tools
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
     * Send text message to Gemini (as User)
     * @param {string} text - Text to send
     */
    sendText(text) {
        const message = {
            clientContent: {
                turns: [
                    {
                        role: 'user',
                        parts: [{ text: text }]
                    }
                ],
                turnComplete: true
            }
        };
        logger.info(`[GeminiLive] Sending text: "${text.substring(0, 50)}..."`);
        this.send(message);
    }

    /**
     * Send both an image and text to Gemini as a user turn
     * @param {string} base64Image - Base64 encoded JPEG image
     * @param {string} text - Text to send with the image
     * @param {boolean} turnComplete - Whether this turn is complete (triggers response)
     */
    sendImageWithText(base64Image, text, turnComplete = false) {
        const parts = [];
        if (text) {
            parts.push({ text: text });
        }
        if (base64Image) {
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image
                }
            });
        }
        const message = {
            clientContent: {
                turns: [
                    {
                        role: 'user',
                        parts: parts
                    }
                ],
                turnComplete: turnComplete
            }
        };
        logger.info(`[GeminiLive] Sending image with text (turnComplete=${turnComplete}): "${text ? text.substring(0, 50) : ''}..."`);
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
