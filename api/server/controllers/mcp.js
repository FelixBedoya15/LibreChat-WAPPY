/**
 * MCP Tools Controller
 * Handles MCP-specific tool endpoints, decoupled from regular LibreChat tools
 */
const { logger } = require('@librechat/data-schemas');
const { Constants } = require('librechat-data-provider');
const {
  cacheMCPServerTools,
  getMCPServerTools,
  getAppConfig,
} = require('~/server/services/Config');
const { getMCPManager } = require('~/config');
const { mcpServersRegistry, MCPConnectionFactory, MCPServerInspector } = require('@librechat/api');

const staticLocalFilesTools = {
  'gestionar_archivos_locales::local-files': {
    function: {
      name: 'gestionar_archivos_locales',
      description: 'Gestiona archivos y carpetas en tu computadora local (leer, escribir, listar, procesar Word/Excel).',
      parameters: {
        type: 'object',
        properties: {
          accion: {
            type: 'string',
            enum: ['list_directory', 'read_file', 'write_file', 'read_excel_file', 'write_excel_file', 'read_docx_file', 'write_docx_file'],
            description: 'Acción a realizar sobre los archivos locales.'
          },
          relative_path: { type: 'string', description: 'Ruta relativa del archivo o carpeta.' },
          content: { type: 'string', description: 'Contenido de texto plano para escribir un archivo (solo para write_file).' },
          sheets: {
            type: 'array',
            description: 'Hojas y filas para escribir un archivo Excel (solo para write_excel_file).',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } }
              },
              required: ['name', 'rows']
            }
          },
          paragraphs: {
            type: 'array',
            description: 'Párrafos y títulos para escribir un archivo Word (solo para write_docx_file).',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['heading1', 'heading2', 'text'] },
                text: { type: 'string' }
              },
              required: ['type', 'text']
            }
          }
        },
        required: ['accion']
      }
    }
  }
};

/**
 * Get all MCP tools available to the user
 */
const getMCPTools = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn('[getMCPTools] User ID not found in request');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const appConfig = req.config ?? (await getAppConfig({ role: req.user?.role }));

    // Servidores estaticos del YAML
    const staticServers = appConfig?.mcpConfig ? Object.keys(appConfig.mcpConfig) : [];

    // Servidores privados del usuario (desktop conectado via WebSocket)
    const allRegistryServers = await mcpServersRegistry.getAllServerConfigs(userId);
    const privateServers = Object.keys(allRegistryServers).filter(
      (name) => !staticServers.includes(name),
    );

    // Garantizar que 'local-files' esté SIEMPRE listado para que el administrador pueda configurarlo
    if (!privateServers.includes('local-files') && !staticServers.includes('local-files')) {
      privateServers.push('local-files');
    }

    const configuredServers = [...staticServers, ...privateServers];

    if (configuredServers.length === 0) {
      return res.status(200).json({ servers: {} });
    }

    let mcpManager = null;
    try {
      mcpManager = getMCPManager();
    } catch (e) {
      // MCPManager puede no existir si no hay servidores estaticos activos
    }

    const mcpServers = {};

    const cachePromises = configuredServers.map((serverName) =>
      getMCPServerTools(userId, serverName).then((tools) => ({ serverName, tools })),
    );
    const cacheResults = await Promise.all(cachePromises);

    const serverToolsMap = new Map();
    for (const { serverName, tools } of cacheResults) {
      if (tools) {
        serverToolsMap.set(serverName, tools);
        continue;
      }

      // Para servidores websocket-gateway (desktop conectado) crear conexion temporal
      const serverConfig = allRegistryServers[serverName];
      if (serverConfig && serverConfig.type === 'websocket-gateway') {
        try {
          logger.debug(`[getMCPTools] Connecting to websocket-gateway server ${serverName} for user ${userId}`);
          const connection = await MCPConnectionFactory.create({
            serverName,
            serverConfig,
          });
          const serverTools = await MCPServerInspector.getToolFunctions(serverName, connection);
          if (serverTools && Object.keys(serverTools).length > 0) {
            serverToolsMap.set(serverName, serverTools);
            cacheMCPServerTools({ userId, serverName, serverTools }).catch((err) =>
              logger.error(`[getMCPTools] Failed to cache gateway tools for ${serverName}:`, err),
            );
          } else if (serverName === 'local-files') {
            serverToolsMap.set(serverName, staticLocalFilesTools);
          }
          await connection.disconnect();
        } catch (gatewayErr) {
          logger.warn(`[getMCPTools] Could not load tools from gateway server ${serverName}:`, gatewayErr.message);
          if (serverName === 'local-files') {
            serverToolsMap.set(serverName, staticLocalFilesTools);
          }
        }
        continue;
      }

      if (!mcpManager) continue;
      const serverTools = await mcpManager.getServerToolFunctions(userId, serverName);
      if (!serverTools) {
        logger.debug(`[getMCPTools] No tools found for server ${serverName}`);
        continue;
      }
      serverToolsMap.set(serverName, serverTools);

      if (Object.keys(serverTools).length > 0) {
        // Cache asynchronously without blocking
        cacheMCPServerTools({ userId, serverName, serverTools }).catch((err) =>
          logger.error(`[getMCPTools] Failed to cache tools for ${serverName}:`, err),
        );
      }
    }

    // Asegurar que local-files esté en el mapa con herramientas estáticas si no se cargó de otra forma
    if (!serverToolsMap.has('local-files')) {
      serverToolsMap.set('local-files', staticLocalFilesTools);
    }

    // Process each configured server
    for (const serverName of configuredServers) {
      try {
        const serverTools = serverToolsMap.get(serverName);

        // Get server config once - buscar tanto en estaticos como en privados
        const serverConfig = appConfig?.mcpConfig?.[serverName];
        const rawServerConfig = await mcpServersRegistry.getServerConfig(serverName, userId);

        // Initialize server object with all server-level data
        const server = {
          name: serverName,
          icon: rawServerConfig?.iconPath || '',
          authenticated: true,
          authConfig: [],
          tools: [],
        };

        // Set authentication config once for the server
        if (serverConfig?.customUserVars) {
          const customVarKeys = Object.keys(serverConfig.customUserVars);
          if (customVarKeys.length > 0) {
            server.authConfig = Object.entries(serverConfig.customUserVars).map(([key, value]) => ({
              authField: key,
              label: value.title || key,
              description: value.description || '',
            }));
            server.authenticated = false;
          }
        }

        // Process tools efficiently - no need for convertMCPToolToPlugin
        if (serverTools) {
          for (const [toolKey, toolData] of Object.entries(serverTools)) {
            if (!toolData.function || !toolKey.includes(Constants.mcp_delimiter)) {
              continue;
            }

            const toolName = toolKey.split(Constants.mcp_delimiter)[0];
            server.tools.push({
              name: toolName,
              pluginKey: toolKey,
              description: toolData.function.description || '',
            });
          }
        }

        // Only add server if it has tools or is configured
        if (server.tools.length > 0 || serverConfig) {
          mcpServers[serverName] = server;
        }
      } catch (error) {
        logger.error(`[getMCPTools] Error loading tools for server ${serverName}:`, error);
      }
    }

    res.status(200).json({ servers: mcpServers });
  } catch (error) {
    logger.error('[getMCPTools]', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMCPTools,
};
