const WebSocket = require('ws');
const url = require('url');
const jwt = require('jsonwebtoken');
const logger = require('~/config/winston');
const { mcpServersRegistry, WebSocketGatewayRegistry } = require('@librechat/api');

function setupMcpWebSocket(server) {
  const wss = new WebSocket.Server({ noServer: true });

  // Handle WebSocket upgrade requests for /ws/mcp path
  server.on('upgrade', (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;

    if (pathname === '/ws/mcp') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  // Handle new WebSocket connections
  wss.on('connection', async (ws, request) => {
    logger.info('[MCP WS Gateway] New incoming connection attempt');

    try {
      const params = url.parse(request.url, true).query;
      let token = params.token || request.headers['sec-websocket-protocol'];

      if (!token && request.headers['authorization']) {
        const authHeader = request.headers['authorization'];
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        logger.warn('[MCP WS Gateway] Connection rejected: No token provided');
        ws.close(1008, 'Authentication token required');
        return;
      }

      // Verify the JWT Token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        try {
          decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        } catch (err2) {
          logger.error('[MCP WS Gateway] Connection rejected: Token verification failed', err2.message);
          ws.close(1008, 'Invalid authentication token');
          return;
        }
      }

      if (!decoded || !decoded.id) {
        logger.warn('[MCP WS Gateway] Connection rejected: Invalid payload');
        ws.close(1008, 'Invalid authentication token');
        return;
      }

      const userId = decoded.id;
      logger.info(`[MCP WS Gateway] User authenticated: ${userId}`);

      // Check if user already has an active connection and close the old one
      const oldWs = WebSocketGatewayRegistry.get(userId);
      if (oldWs && oldWs.readyState === WebSocket.OPEN) {
        logger.info(`[MCP WS Gateway] Closing existing connection for user ${userId}`);
        oldWs.close(4000, 'Superceded by a new connection');
      }

      // Register the socket for connection lookup
      WebSocketGatewayRegistry.register(userId, ws);

      // Register dynamic private MCP server for this user
      await mcpServersRegistry.addPrivateUserServer(userId, 'local-files', {
        type: 'websocket-gateway',
        userId: userId,
      });
      logger.info(`[MCP WS Gateway] Dynamic 'local-files' server registered for user ${userId}`);

      // Listen for message stream
      ws.on('message', (message) => {
        try {
          const parsed = JSON.parse(message.toString());
          // Emit jsonrpc-message event so WebSocketGatewayTransport can receive it
          ws.emit('jsonrpc-message', parsed);
        } catch (e) {
          logger.error('[MCP WS Gateway] Failed to parse message as JSON-RPC:', e.message);
        }
      });

      // Handle connection close
      ws.on('close', async (code, reason) => {
        logger.info(`[MCP WS Gateway] Connection closed for user ${userId}. Code: ${code}, Reason: ${reason}`);
        
        // Only clean up if this ws is still registered (we might have superceded it)
        if (WebSocketGatewayRegistry.get(userId) === ws) {
          WebSocketGatewayRegistry.unregister(userId);
          try {
            await mcpServersRegistry.removePrivateUserServer(userId, 'local-files');
            logger.info(`[MCP WS Gateway] Dynamic 'local-files' server unregistered for user ${userId}`);
          } catch (err) {
            logger.error(`[MCP WS Gateway] Error removing dynamic server for user ${userId}:`, err.message);
          }
        }
      });

      // Handle socket errors
      ws.on('error', (err) => {
        logger.error(`[MCP WS Gateway] Socket error for user ${userId}:`, err.message);
      });

    } catch (error) {
      logger.error('[MCP WS Gateway] Unexpected error in connection handler:', error);
      ws.close(1011, 'Internal server error');
    }
  });
}

module.exports = setupMcpWebSocket;
