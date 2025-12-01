const WebSocket = require('ws');
const url = require('url');
const jwt = require('jsonwebtoken');
const { createSession } = require('./routes/voice/voiceSession');
const logger = require('~/config/winston');

/**
 * Setup WebSocket server for voice conversations
 * @param {http.Server} server - HTTP server instance
 */
function setupVoiceWebSocket(server) {
    const wss = new WebSocket.Server({ noServer: true });

    // Handle WebSocket upgrade requests
    server.on('upgrade', (request, socket, head) => {
        const pathname = url.parse(request.url).pathname;

        // Only handle /ws/voice path
        if (pathname === '/ws/voice') {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    // Handle WebSocket connections
    wss.on('connection', async (ws, request) => {
        logger.info('[WebSocket] New voice connection attempt');

        try {
            // Extract token from query or headers
            const params = url.parse(request.url, true).query;
            const token = params.token || request.headers['sec-websocket-protocol'];
            const conversationId = params.conversationId;

            if (!token) {
                logger.warn('[WebSocket] No token provided');
                ws.close(1008, 'Authentication required');
                return;
            }

            // Verify token
            // Try JWT_SECRET first (Access Token)
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (err) {
                // Try JWT_REFRESH_SECRET (Refresh Token) as fallback
                try {
                    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
                } catch (err2) {
                    logger.error('[WebSocket] Token verification failed:', err2.message);
                    ws.close(1008, 'Authentication failed');
                    return;
                }
            }

            if (!decoded) {
                logger.error('[WebSocket] Token verification failed: Unable to decode');
                ws.close(1008, 'Authentication failed');
                return;
            }

            const userId = decoded.id;
            let user = { id: userId }; // Define user object here
            logger.info('[WebSocket] Token verified for user:', user.id);


            if (!user || !user.id) {
                logger.warn('[WebSocket] Invalid user from token');
                ws.close(1008, 'Invalid user');
                return;
            }

            logger.info(`[WebSocket] User authenticated: ${user.id}`);

            const mode = params.mode || 'chat';

            // Create config based on mode
            const config = {
                mode,
                enableReportGenerator: mode === 'live_analysis',
                systemInstruction: mode === 'live_analysis' ?
                    `Eres un Experto Senior en Prevención de Riesgos Laborales (HSE).
                    Tu misión es realizar investigaciones exhaustivas de entornos laborales mediante video.
                    
                    MODOS DE RESPUESTA:
                    1. AUDIO: Sé conversacional, directo y profesional. Explica lo que ves y haz preguntas si es necesario.
                    2. TEXTO: Genera INFORMES TÉCNICOS ESTRUCTURADOS en Markdown.
                       - Usa tablas para matrices de riesgo y jerarquía de controles.
                       - NO incluyas saludos ni preguntas en el texto.
                       - El texto debe ser un documento formal listo para guardar.
                    
                    Responde SIEMPRE en español.` :
                    undefined // Default system instruction for chat
            };

            // Create voice session
            const result = await createSession(ws, user.id, conversationId, config);

            if (!result.success) {
                logger.error(`[WebSocket] Failed to create session: ${result.error}`);
                ws.send(JSON.stringify({
                    type: 'error',
                    data: { message: result.error },
                }));
                ws.close(1011, result.error);
                return;
            }

            logger.info(`[WebSocket] Voice session created for user: ${user.id}`);

            // Send ready message
            ws.send(JSON.stringify({
                type: 'status',
                data: { status: 'connecting' },
            }));

        } catch (error) {
            logger.error('[WebSocket] Connection error:', error);
            ws.close(1011, 'Internal server error');
        }
    });

    logger.info('[WebSocket] Voice WebSocket server initialized');
    return wss;
}

module.exports = setupVoiceWebSocket;
