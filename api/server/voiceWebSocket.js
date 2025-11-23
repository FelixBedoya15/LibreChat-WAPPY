const WebSocket = require('ws');
const url = require('url');
const { verifyJWT } = require('~/server/middleware');
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

            if (!token) {
                logger.warn('[WebSocket] No token provided');
                ws.close(1008, 'Authentication required');
                return;
            }

            // Verify JWT token
            let user;
            try {
                user = await verifyJWT(token);
            } catch (error) {
                logger.error('[WebSocket] Token verification failed:', error);
                ws.close(1008, 'Invalid token');
                return;
            }

            if (!user || !user.id) {
                logger.warn('[WebSocket] Invalid user from token');
                ws.close(1008, 'Invalid user');
                return;
            }

            logger.info(`[WebSocket] User authenticated: ${user.id}`);

            // Create voice session
            const result = await createSession(ws, user.id);

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
