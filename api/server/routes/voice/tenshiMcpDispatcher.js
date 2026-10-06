const { logger } = require('~/config');

/**
 * Dispatcher para que Tenshi Voice ejecute cualquiera de las 41 operaciones MCP oficiales de WAPPY
 * conectándose directamente al endpoint local de mcp-bridge.
 */

const TOOL_ROUTES = {
  // 1. Diagnóstico & Estrategia
  wappy_resumen_general_360: { method: 'GET', path: '/resumen-360' },
  wappy_consultar_perfil_empresa: { method: 'GET', path: '/profile' },
  wappy_actualizar_perfil_empresa: { method: 'POST', path: '/profile' },

  // 2. Matrices de Riesgo & Cumplimiento
  wappy_consultar_matriz_gtc45: { method: 'GET', path: '/gtc45' },
  wappy_alimentar_matriz_gtc45: { method: 'POST', path: '/gtc45' },
  wappy_consultar_matriz_pesv: { method: 'GET', path: '/pesv' },
  wappy_alimentar_matriz_pesv: { method: 'POST', path: '/pesv' },
  wappy_consultar_matriz_legal: { method: 'GET', path: '/matriz-legal' },
  wappy_registrar_requisito_legal: { method: 'POST', path: '/matriz-legal' },
  wappy_consultar_diagnostico_0312: { method: 'GET', path: '/diagnostico-0312' },
  wappy_evaluar_estandar_0312: { method: 'POST', path: '/diagnostico-0312' },

  // 3. Gestión Operativa & Colaboradores
  wappy_consultar_trabajadores: { method: 'GET', path: '/workers' },
  wappy_registrar_trabajador: { method: 'POST', path: '/workers' },
  wappy_actualizar_trabajador: { method: 'PUT', path: (args) => `/workers/${args.id || args.identificacion || args.cedula || ''}` },
  wappy_eliminar_trabajador: { method: 'POST', path: (args) => `/workers/${args.id || args.identificacion || args.cedula || ''}/retirar` },
  wappy_consultar_comites: { method: 'GET', path: '/comites' },
  wappy_registrar_miembro_comite: { method: 'POST', path: '/comites' },
  wappy_consultar_epp: { method: 'GET', path: '/epp' },
  wappy_registrar_entrega_epp: { method: 'POST', path: '/epp' },
  wappy_consultar_perfiles_cargo: { method: 'GET', path: '/perfiles-cargo' },
  wappy_guardar_perfil_cargo: { method: 'POST', path: '/perfiles-cargo' },

  // 4. Seguridad Industrial & Prevención
  wappy_consultar_inventario_quimico: { method: 'GET', path: '/quimicos' },
  wappy_registrar_producto_quimico: { method: 'POST', path: '/quimicos' },
  wappy_consultar_vehiculos: { method: 'GET', path: '/vehiculos' },
  wappy_registrar_vehiculo: { method: 'POST', path: '/vehiculos' },
  wappy_consultar_reportes_actos_condiciones: { method: 'GET', path: '/actos-condiciones' },
  wappy_registrar_reporte_acto_condicion: { method: 'POST', path: '/actos-condiciones' },
  wappy_consultar_casos_atel: { method: 'GET', path: '/atel' },
  wappy_registrar_caso_atel: { method: 'POST', path: '/atel' },

  // 5. Cronograma, LMS & Agentes Autónomos
  wappy_consultar_cronograma_sst: { method: 'GET', path: '/tasks' },
  wappy_crear_actividad_cronograma: { method: 'POST', path: '/tasks' },
  wappy_actualizar_estado_tarea: { method: 'PUT', path: (args) => `/tasks/${args.id || args.taskId || ''}` },
  wappy_consultar_capacitaciones: { method: 'GET', path: '/capacitaciones' },
  wappy_programar_capacitacion: { method: 'POST', path: '/capacitaciones' },
  wappy_consultar_auditorias: { method: 'GET', path: '/auditorias' },
  wappy_registrar_hallazgo_auditoria: { method: 'POST', path: '/auditorias' },
  wappy_consultar_agentes_y_automatizaciones: { method: 'GET', path: '/agentes-automatizaciones' },
  wappy_programar_automatizacion: { method: 'POST', path: '/agentes-automatizaciones' },
  wappy_consultar_conversaciones: { method: 'GET', path: '/conversations' },
  wappy_consultar_mensajes_conversacion: { method: 'GET', path: '/messages' },
  wappy_consultar_archivos: { method: 'GET', path: '/files' },
};

async function executeTenshiMcpTool(toolName, args = {}, userId) {
  if (!toolName) {
    return { error: 'Nombre de herramienta MCP no especificado.' };
  }

  // Normalizar nombre eliminando posibles prefijos duplicados
  const normalizedTool = String(toolName).trim();
  const routeConfig = TOOL_ROUTES[normalizedTool];

  if (!routeConfig) {
    logger.warn(`[Tenshi MCP] Herramienta "${normalizedTool}" no reconocida en el catálogo.`);
    return { error: `La herramienta "${normalizedTool}" no está registrada en el catálogo de WAPPY MCP.` };
  }

  const port = process.env.PORT || 3080;
  const baseUrl = `http://localhost:${port}/api/mcp-bridge`;
  const internalSecret = process.env.JWT_SECRET || 'wappy-internal-secret';

  let pathStr = typeof routeConfig.path === 'function' ? routeConfig.path(args) : routeConfig.path;
  let url = `${baseUrl}${pathStr}`;
  const method = routeConfig.method;

  const headers = {
    'Content-Type': 'application/json',
    'x-internal-user-id': String(userId),
    'x-internal-secret': internalSecret,
  };

  const fetchOptions = {
    method,
    headers,
  };

  if (method === 'GET') {
    const queryParams = new URLSearchParams();
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined && v !== null && typeof v !== 'object') {
        queryParams.set(k, String(v));
      }
    }
    const qs = queryParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  } else {
    fetchOptions.body = JSON.stringify(args);
  }

  try {
    logger.info(`[Tenshi MCP] Ejecutando "${normalizedTool}" -> ${method} ${url}`);
    const response = await fetch(url, fetchOptions);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = data?.error || `Error HTTP ${response.status}: ${response.statusText}`;
      logger.error(`[Tenshi MCP] Error en "${normalizedTool}": ${errMsg}`);
      return { error: errMsg };
    }

    return data;
  } catch (error) {
    logger.error(`[Tenshi MCP] Excepción al ejecutar "${normalizedTool}":`, error);
    return { error: `Fallo de conexión interna al ejecutar ${normalizedTool}: ${error.message}` };
  }
}

module.exports = {
  TOOL_ROUTES,
  executeTenshiMcpTool,
};
