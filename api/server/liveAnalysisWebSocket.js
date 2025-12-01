const WebSocket = require('ws');
const url = require('url');
const jwt = require('jsonwebtoken');
const { createSession } = require('./routes/voice/voiceSession');
const logger = require('~/config/winston');

/**
 * Setup WebSocket server for Live Analysis (HSE)
 * @param {http.Server} server - HTTP server instance
 */
function setupLiveAnalysisWebSocket(server) {
    const wss = new WebSocket.Server({ noServer: true });

    // Handle WebSocket upgrade requests
    server.on('upgrade', (request, socket, head) => {
        const pathname = url.parse(request.url).pathname;

        // Only handle /ws/live path
        if (pathname === '/ws/live') {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        }
        // Note: Do not destroy socket here if path doesn't match, 
        // as other WebSocket servers (like voiceWebSocket) might handle it.
    });

    // Handle WebSocket connections
    wss.on('connection', async (ws, request) => {
        logger.info('[LiveAnalysisWS] New connection attempt');

        try {
            // Extract token from query or headers
            const params = url.parse(request.url, true).query;
            const token = params.token || request.headers['sec-websocket-protocol'];
            const conversationId = params.conversationId;

            if (!token) {
                logger.warn('[LiveAnalysisWS] No token provided');
                ws.close(1008, 'Authentication required');
                return;
            }

            // Verify token
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (err) {
                try {
                    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
                } catch (err2) {
                    logger.error('[LiveAnalysisWS] Token verification failed:', err2.message);
                    ws.close(1008, 'Authentication failed');
                    return;
                }
            }

            if (!decoded || !decoded.id) {
                logger.error('[LiveAnalysisWS] Invalid token');
                ws.close(1008, 'Authentication failed');
                return;
            }

            const userId = decoded.id;
            logger.info(`[LiveAnalysisWS] User authenticated: ${userId}`);

            // Force mode to 'live_analysis' for this endpoint
            const config = {
                mode: 'live_analysis',
                enableReportGenerator: true,
                systemInstruction: `Eres un Experto Senior en Prevención de Riesgos Laborales (HSE).
                Tu misión es realizar investigaciones exhaustivas de entornos laborales mediante video.
                
                MODOS DE RESPUESTA:
                1. AUDIO: Sé conversacional, directo y profesional. Explica lo que ves y haz preguntas si es necesario.
                2. TEXTO: Genera INFORMES TÉCNICOS ESTRUCTURADOS en Markdown.
                   - Usa tablas para matrices de riesgo y jerarquía de controles.
                   - NO incluyas saludos ni preguntas en el texto.
                   - El texto debe ser un documento formal listo para guardar.
                
                Responde SIEMPRE en español.`
            };

            // Create voice session with forced config
            const result = await createSession(ws, userId, conversationId, config);

            if (!result.success) {
                logger.error(`[LiveAnalysisWS] Failed to create session: ${result.error}`);
                ws.send(JSON.stringify({
                    type: 'error',
                    data: { message: result.error },
                }));
                ws.close(1011, result.error);
                return;
            }

            logger.info(`[LiveAnalysisWS] Session started for user: ${userId}`);

            // Send ready message
            ws.send(JSON.stringify({
                type: 'status',
                data: { status: 'connecting' },
            }));

        } catch (error) {
            logger.error('[LiveAnalysisWS] Connection error:', error);
            ws.close(1011, 'Internal server error');
        }
    });

    logger.info('[LiveAnalysisWS] Server initialized on /ws/live');
    return wss;
}

module.exports = setupLiveAnalysisWebSocket;
