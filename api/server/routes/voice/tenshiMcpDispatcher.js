const { logger } = require('~/config');

/**
 * Dispatcher para que Tenshi Voice ejecute cualquiera de las 41 operaciones MCP oficiales de WAPPY
 * conectándose directamente al endpoint local de mcp-bridge.
 */

const TOOL_ROUTES = {
  // 1. Diagnóstico & Estrategia
  wappy_resumen_general_360: { method: 'GET', path: '/resumen-360' },
  wappy_consultar_perfil_empresa: { method: 'GET', path: '/profile' },
  wappy_consultar_detalle_empresa: {
    method: 'GET',
    path: (args) => {
      const target = args.id || args.companyId || args.empresa || args.nombre || args.nombre_o_id || '';
      return target ? `/companies/${encodeURIComponent(String(target).trim())}` : '/profile';
    },
  },
  wappy_actualizar_perfil_empresa: { method: 'POST', path: '/profile' },
  wappy_consultar_empresas: { method: 'GET', path: '/companies' },
  wappy_listar_empresas: { method: 'GET', path: '/companies' },
  wappy_activar_empresa: {
    method: 'POST',
    path: (args) => {
      const target = args.id || args.companyId || args.nombre_o_id || args.empresa || args.nombre || args.target || '';
      return `/companies/${encodeURIComponent(String(target).trim())}/activate`;
    },
  },
  wappy_seleccionar_empresa: {
    method: 'POST',
    path: (args) => {
      const target = args.id || args.companyId || args.nombre_o_id || args.empresa || args.nombre || args.target || '';
      return `/companies/${encodeURIComponent(String(target).trim())}/activate`;
    },
  },

  // 2. Matrices de Riesgo & Cumplimiento
  wappy_consultar_matriz_gtc45: { method: 'GET', path: '/gtc45' },
  wappy_alimentar_matriz_gtc45: { method: 'POST', path: '/gtc45' },
  wappy_actualizar_riesgo_gtc45: { method: 'PUT', path: (args) => `/gtc45/${encodeURIComponent(args.id || '')}` },
  wappy_eliminar_riesgo_gtc45: { method: 'DELETE', path: (args) => `/gtc45/${encodeURIComponent(args.id || '')}` },
  wappy_consultar_matriz_pesv: { method: 'GET', path: '/pesv' },
  wappy_alimentar_matriz_pesv: { method: 'POST', path: '/pesv' },
  wappy_actualizar_riesgo_pesv: { method: 'PUT', path: (args) => `/pesv/${encodeURIComponent(args.id || '')}` },
  wappy_eliminar_riesgo_pesv: { method: 'DELETE', path: (args) => `/pesv/${encodeURIComponent(args.id || '')}` },
  wappy_consultar_matriz_legal: { method: 'GET', path: '/matriz-legal' },
  wappy_registrar_requisito_legal: { method: 'POST', path: '/matriz-legal' },
  wappy_actualizar_requisito_legal: { method: 'PUT', path: (args) => `/matriz-legal/${encodeURIComponent(args.id || '')}` },
  wappy_eliminar_requisito_legal: { method: 'DELETE', path: (args) => `/matriz-legal/${encodeURIComponent(args.id || '')}` },
  wappy_consultar_diagnostico_0312: { method: 'GET', path: '/diagnostico-0312' },
  wappy_evaluar_estandar_0312: { method: 'POST', path: '/diagnostico-0312' },

  // 3. Gestión Operativa & Colaboradores
  wappy_consultar_trabajadores: { method: 'GET', path: '/workers' },
  wappy_registrar_trabajador: { method: 'POST', path: '/workers' },
  wappy_actualizar_trabajador: {
    method: 'PUT',
    path: (args) => {
      const target = args.idOrCedula || args.id || args.identificacion || args.cedula || args.nombre || args.target || '';
      return `/workers/${encodeURIComponent(String(target).trim())}`;
    },
  },
  wappy_retirar_trabajador: {
    method: 'POST',
    path: (args) => {
      const target = args.idOrCedula || args.id || args.identificacion || args.cedula || args.nombre || args.target || '';
      return `/workers/${encodeURIComponent(String(target).trim())}/retirar`;
    },
  },
  wappy_reintegrar_trabajador: {
    method: 'POST',
    path: (args) => {
      const target = args.idOrCedula || args.id || args.identificacion || args.cedula || args.nombre || args.target || '';
      return `/workers/${encodeURIComponent(String(target).trim())}/reactivar`;
    },
  },
  wappy_reactivar_trabajador: {
    method: 'POST',
    path: (args) => {
      const target = args.idOrCedula || args.id || args.identificacion || args.cedula || args.nombre || args.target || '';
      return `/workers/${encodeURIComponent(String(target).trim())}/reactivar`;
    },
  },
  wappy_eliminar_trabajador: {
    method: 'POST',
    path: (args) => {
      const target = args.idOrCedula || args.id || args.identificacion || args.cedula || args.nombre || args.target || '';
      return `/workers/${encodeURIComponent(String(target).trim())}/retirar`;
    },
  },
  wappy_consultar_comites: { method: 'GET', path: '/comites' },
  wappy_registrar_miembro_comite: { method: 'POST', path: '/comites' },
  wappy_eliminar_miembro_comite: { method: 'DELETE', path: (args) => `/comites/${encodeURIComponent(args.id || '')}` },
  wappy_consultar_epp: { method: 'GET', path: '/epp' },
  wappy_registrar_entrega_epp: { method: 'POST', path: '/epp' },
  wappy_eliminar_entrega_epp: { method: 'DELETE', path: (args) => `/epp/${encodeURIComponent(args.id || '')}` },
  wappy_consultar_perfiles_cargo: { method: 'GET', path: '/perfiles-cargo' },
  wappy_guardar_perfil_cargo: { method: 'POST', path: '/perfiles-cargo' },
  wappy_eliminar_perfil_cargo: { method: 'DELETE', path: (args) => `/perfiles-cargo/${encodeURIComponent(args.id || '')}` },

  // 4. Seguridad Industrial & Prevención
  wappy_consultar_inventario_quimico: { method: 'GET', path: '/quimicos' },
  wappy_registrar_producto_quimico: { method: 'POST', path: '/quimicos' },
  wappy_actualizar_producto_quimico: { method: 'PUT', path: (args) => `/quimicos/${encodeURIComponent(args.id || '')}` },
  wappy_eliminar_producto_quimico: { method: 'DELETE', path: (args) => `/quimicos/${encodeURIComponent(args.id || '')}` },
  wappy_consultar_vehiculos: { method: 'GET', path: '/vehiculos' },
  wappy_registrar_vehiculo: { method: 'POST', path: '/vehiculos' },
  wappy_actualizar_vehiculo: { method: 'PUT', path: (args) => `/vehiculos/${encodeURIComponent(args.id || '')}` },
  wappy_eliminar_vehiculo: { method: 'DELETE', path: (args) => `/vehiculos/${encodeURIComponent(args.id || '')}` },
  wappy_consultar_reportes_actos_condiciones: { method: 'GET', path: '/actos-condiciones' },
  wappy_registrar_reporte_acto_condicion: { method: 'POST', path: '/actos-condiciones' },
  wappy_actualizar_reporte_acto_condicion: { method: 'PUT', path: (args) => `/actos-condiciones/${encodeURIComponent(args.id || '')}` },
  wappy_eliminar_reporte_acto_condicion: { method: 'DELETE', path: (args) => `/actos-condiciones/${encodeURIComponent(args.id || '')}` },
  wappy_consultar_casos_atel: { method: 'GET', path: '/atel' },
  wappy_registrar_caso_atel: { method: 'POST', path: '/atel' },
  wappy_actualizar_caso_atel: { method: 'PUT', path: (args) => `/atel/${encodeURIComponent(args.id || '')}` },
  wappy_eliminar_caso_atel: { method: 'DELETE', path: (args) => `/atel/${encodeURIComponent(args.id || '')}` },

  // 5. Cronograma, LMS, Blog & Agentes Autónomos
  wappy_consultar_cursos: { method: 'GET', path: '/courses' },
  wappy_leer_curso: {
    method: 'GET',
    path: (args) => `/courses/${encodeURIComponent(args.id || args.courseId || args.titulo || args.title || args.curso || '')}`,
  },
  wappy_consultar_blog: { method: 'GET', path: '/blog' },
  wappy_leer_articulo_blog: {
    method: 'GET',
    path: (args) => `/blog/${encodeURIComponent(args.id || args.slug || args.titulo || args.title || args.articulo || '')}`,
  },
  wappy_consultar_cronograma_sst: { method: 'GET', path: '/tasks' },
  wappy_crear_actividad_cronograma: { method: 'POST', path: '/tasks' },
  wappy_actualizar_estado_tarea: { method: 'PUT', path: (args) => `/tasks/${encodeURIComponent(args.id || args.taskId || '')}` },
  wappy_eliminar_tarea_cronograma: { method: 'DELETE', path: (args) => `/tasks/${encodeURIComponent(args.id || args.taskId || '')}` },
  wappy_consultar_capacitaciones: { method: 'GET', path: '/capacitaciones' },
  wappy_programar_capacitacion: { method: 'POST', path: '/capacitaciones' },
  wappy_actualizar_capacitacion: { method: 'PUT', path: (args) => `/capacitaciones/${encodeURIComponent(args.id || '')}` },
  wappy_eliminar_capacitacion: { method: 'DELETE', path: (args) => `/capacitaciones/${encodeURIComponent(args.id || '')}` },
  wappy_consultar_auditorias: { method: 'GET', path: '/auditorias' },
  wappy_registrar_hallazgo_auditoria: { method: 'POST', path: '/auditorias' },
  wappy_actualizar_hallazgo_auditoria: { method: 'PUT', path: (args) => `/auditorias/${encodeURIComponent(args.id || '')}` },
  wappy_eliminar_hallazgo_auditoria: { method: 'DELETE', path: (args) => `/auditorias/${encodeURIComponent(args.id || '')}` },
  wappy_consultar_agentes_y_automatizaciones: { method: 'GET', path: '/agentes-automatizaciones' },
  wappy_programar_automatizacion: { method: 'POST', path: '/agentes-automatizaciones' },
  wappy_eliminar_automatizacion: { method: 'DELETE', path: (args) => `/agentes-automatizaciones/${encodeURIComponent(args.id || '')}` },
  wappy_consultar_conversaciones: { method: 'GET', path: '/conversations' },
  wappy_consultar_mensajes_conversacion: { method: 'GET', path: '/messages' },
  wappy_consultar_archivos: { method: 'GET', path: '/files' },

  // 6. Lectura y Generación de Informes de Aplicativos
  wappy_leer_informe_aplicativo: { method: 'GET', path: '/informe' },
  wappy_crear_informe: { method: 'POST', path: '/reports/generate' },
  wappy_generar_informe: { method: 'POST', path: '/reports/generate' },

  // 7. Comunicaciones & Correo Electrónico
  wappy_enviar_correo: { method: 'POST', path: '/email/send' },
  enviar_correo: { method: 'POST', path: '/email/send' },

  // 8. Agendas, Citas y Calendario
  wappy_gestionar_agenda: {
    method: (args) => (args.accion === 'eliminar' || args.action === 'delete') ? 'DELETE' : ((args.accion === 'listar' || args.action === 'list') ? 'GET' : 'POST'),
    path: (args) => {
      if (args.accion === 'eliminar' || args.action === 'delete') {
        const id = args.id || args.id_evento || args.eventId || '';
        return `/agenda/events/${encodeURIComponent(String(id).trim())}`;
      }
      return '/agenda/events';
    },
  },
  wappy_listar_agenda: { method: 'GET', path: '/agenda/events' },

  // 9. Códigos QR para Trabajadores
  wappy_generar_qr: { method: 'POST', path: '/qr/generate' },
  generar_qr: { method: 'POST', path: '/qr/generate' },

  // 10. Herramientas Especializadas de Agentes & Analítica
  wappy_activar_herramienta_agente: { method: 'POST', path: '/activar-herramienta' },
  matriz_ipevar: { method: 'GET', path: '/gtc45' },
  matriz_pesv: { method: 'GET', path: '/pesv' },
  matriz_compatibilidad: { method: 'GET', path: '/quimicos' },
  gestor_automatizaciones: { method: 'GET', path: '/agentes-automatizaciones' },
  wappy_consultar_analitica_psicosocial: { method: 'GET', path: '/analitica/psicosocial' },
  consultar_analitica_psicosocial: { method: 'GET', path: '/analitica/psicosocial' },
  wappy_consultar_analitica_actos_condiciones: { method: 'GET', path: '/analitica/actos-condiciones' },
  consultar_analitica_actos_condiciones: { method: 'GET', path: '/analitica/actos-condiciones' },

  // 11. APIs Especializadas de Agentes (PubChem, Nominatim, Open-Meteo)
  wappy_consultar_quimico_pubchem: {
    method: 'GET',
    path: (args) => `/quimicos/pubchem?nombre=${encodeURIComponent(args.nombre || args.name || args.q || '')}`,
  },
  consultar_quimico_pubchem: {
    method: 'GET',
    path: (args) => `/quimicos/pubchem?nombre=${encodeURIComponent(args.nombre || args.name || args.q || '')}`,
  },
  getChemicalCid: {
    method: 'GET',
    path: (args) => `/quimicos/pubchem?nombre=${encodeURIComponent(args.nombre || args.name || args.q || '')}`,
  },
  getGhsClassification: {
    method: 'GET',
    path: (args) => `/quimicos/pubchem?nombre=${encodeURIComponent(args.nombre || args.name || args.q || '')}`,
  },

  wappy_geocodificar_emergencias: {
    method: 'GET',
    path: (args) => `/emergencias/nominatim?q=${encodeURIComponent(args.query || args.q || args.recurso || '')}`,
  },
  geocodificar_emergencias: {
    method: 'GET',
    path: (args) => `/emergencias/nominatim?q=${encodeURIComponent(args.query || args.q || args.recurso || '')}`,
  },
  searchLocationOrResource: {
    method: 'GET',
    path: (args) => `/emergencias/nominatim?q=${encodeURIComponent(args.query || args.q || args.recurso || '')}`,
  },

  wappy_consultar_clima_viento: {
    method: 'GET',
    path: (args) => `/clima/pronostico?latitude=${args.latitude || args.lat || 4.6097}&longitude=${args.longitude || args.lon || -74.0817}`,
  },
  consultar_clima_viento: {
    method: 'GET',
    path: (args) => `/clima/pronostico?latitude=${args.latitude || args.lat || 4.6097}&longitude=${args.longitude || args.lon || -74.0817}`,
  },
  obtenerPronosticoClimaViento: {
    method: 'GET',
    path: (args) => `/clima/pronostico?latitude=${args.latitude || args.lat || 4.6097}&longitude=${args.longitude || args.lon || -74.0817}`,
  },

  // 12. Puente de Delegación Tenshi <-> Antigravity
  wappy_delegar_orden_antigravity: { method: 'POST', path: '/antigravity/delegar' },
  delegar_orden_antigravity: { method: 'POST', path: '/antigravity/delegar' },
  wappy_consultar_ordenes_antigravity: { method: 'GET', path: '/antigravity/ordenes' },
  wappy_completar_orden_antigravity: { method: 'POST', path: '/antigravity/completar' },

  // 13. Google NotebookLM / Gemini Notebook
  notebook_list: { isNotebookLM: true, tool: 'notebook_list' },
  notebook_list_mcp_notebooklm: { isNotebookLM: true, tool: 'notebook_list' },
  wappy_notebooklm_listar: { isNotebookLM: true, tool: 'notebook_list' },
  wappy_consultar_cuadernos: { isNotebookLM: true, tool: 'notebook_list' },
  chat_ask: { isNotebookLM: true, tool: 'chat_ask' },
  chat_ask_mcp_notebooklm: { isNotebookLM: true, tool: 'chat_ask' },
  wappy_notebooklm_consultar: { isNotebookLM: true, tool: 'chat_ask' },
  wappy_consultar_cuaderno: { isNotebookLM: true, tool: 'chat_ask' },
  source_list: { isNotebookLM: true, tool: 'source_list' },
  source_list_mcp_notebooklm: { isNotebookLM: true, tool: 'source_list' },
  source_add: { isNotebookLM: true, tool: 'source_add' },
  source_add_mcp_notebooklm: { isNotebookLM: true, tool: 'source_add' },
  notebook_create: { isNotebookLM: true, tool: 'notebook_create' },
  notebook_create_mcp_notebooklm: { isNotebookLM: true, tool: 'notebook_create' },
  studio_generate: { isNotebookLM: true, tool: 'studio_generate' },
  studio_generate_mcp_notebooklm: { isNotebookLM: true, tool: 'studio_generate' },
  studio_status: { isNotebookLM: true, tool: 'studio_status' },
  studio_status_mcp_notebooklm: { isNotebookLM: true, tool: 'studio_status' },
  studio_download: { isNotebookLM: true, tool: 'studio_download' },
  studio_download_mcp_notebooklm: { isNotebookLM: true, tool: 'studio_download' },
  studio_list: { isNotebookLM: true, tool: 'studio_list' },
  studio_list_mcp_notebooklm: { isNotebookLM: true, tool: 'studio_list' },
  research_start: { isNotebookLM: true, tool: 'research_start' },
  research_start_mcp_notebooklm: { isNotebookLM: true, tool: 'research_start' },
  research_import: { isNotebookLM: true, tool: 'research_import' },
  research_import_mcp_notebooklm: { isNotebookLM: true, tool: 'research_import' },
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

  // Si es una herramienta de Google NotebookLM, despachar directamente al contenedor notebooklm-mcp
  if (routeConfig.isNotebookLM) {
    const notebooklmUrl = process.env.NOTEBOOKLM_URL || 'http://notebooklm-mcp:9420';
    const targetTool = routeConfig.tool || normalizedTool;
    logger.info(`[Tenshi MCP] Despachando llamada NotebookLM "${targetTool}" para usuario ${userId}`);

    try {
      const response = await fetch(`${notebooklmUrl}/api/direct-tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userId || ''),
        },
        body: JSON.stringify({
          name: targetTool,
          arguments: args,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errMsg = data?.error || `Error HTTP ${response.status}: ${response.statusText}`;
        logger.error(`[Tenshi MCP] Error en NotebookLM "${targetTool}": ${errMsg}`);
        return { error: errMsg };
      }

      return data.result !== undefined ? data.result : data;
    } catch (nbErr) {
      logger.error(`[Tenshi MCP] Error conectando con NotebookLM para "${targetTool}":`, nbErr);
      return { error: `No se pudo conectar con el servidor de NotebookLM: ${nbErr.message}` };
    }
  }

  const port = process.env.PORT || 3080;
  const baseUrl = `http://localhost:${port}/api/mcp-bridge`;
  const internalSecret = process.env.JWT_SECRET || 'wappy-internal-secret';

  let pathStr = typeof routeConfig.path === 'function' ? routeConfig.path(args) : routeConfig.path;
  let url = `${baseUrl}${pathStr}`;
  const method = typeof routeConfig.method === 'function' ? routeConfig.method(args) : routeConfig.method;

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
