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
  wappy_actualizar_empresa: { method: 'POST', path: '/profile' },
  actualizar_empresa: { method: 'POST', path: '/profile' },
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
  wappy_importar_hito1_drive: { method: 'POST', path: '/hito1/import-drive' },
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
  wappy_importar_sociodemografico_drive: { method: 'POST', path: '/workers/import-drive' },
  wappy_alimentar_sociodemografico_masivo: { method: 'POST', path: '/workers/import-drive' },
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
  wappy_actualizar_estado_tarea: {
    method: 'PUT',
    path: (args) => `/tasks/${encodeURIComponent(args.id || args.taskId || args.titulo || args.title || args.nombre || 'todas')}`,
  },
  wappy_eliminar_tarea_cronograma: {
    method: 'DELETE',
    path: (args) => `/tasks/${encodeURIComponent(args.id || args.taskId || args.titulo || args.title || args.nombre || 'todas')}`,
  },
  wappy_consultar_capacitaciones: { method: 'GET', path: '/capacitaciones' },
  wappy_programar_capacitacion: { method: 'POST', path: '/capacitaciones' },
  wappy_actualizar_capacitacion: { method: 'PUT', path: (args) => `/capacitaciones/${encodeURIComponent(args.id || '')}` },
  wappy_eliminar_capacitacion: { method: 'DELETE', path: (args) => `/capacitaciones/${encodeURIComponent(args.id || '')}` },
  wappy_consultar_auditorias: { method: 'GET', path: '/auditorias' },
  wappy_registrar_hallazgo_auditoria: { method: 'POST', path: '/auditorias' },
  wappy_actualizar_hallazgo_auditoria: { method: 'PUT', path: (args) => `/auditorias/${encodeURIComponent(args.id || '')}` },
  wappy_eliminar_hallazgo_auditoria: { method: 'DELETE', path: (args) => `/auditorias/${encodeURIComponent(args.id || '')}` },
  wappy_consultar_agentes_y_automatizaciones: { method: 'GET', path: '/agentes-automatizaciones' },
  wappy_crear_agente: { method: 'POST', path: '/agentes' },
  wappy_actualizar_agente: {
    method: 'PUT',
    path: (args) => `/agentes/${encodeURIComponent(args.id || args.agentId || args.nombre || args.name || '')}`,
  },
  wappy_eliminar_agente: {
    method: 'DELETE',
    path: (args) => `/agentes/${encodeURIComponent(args.id || args.agentId || args.nombre || args.name || '')}`,
  },
  wappy_ejecutar_accion_usuario: { method: 'POST', path: '/accion-universal' },
  wappy_programar_automatizacion: { method: 'POST', path: '/agentes-automatizaciones' },
  wappy_actualizar_automatizacion: {
    method: 'PUT',
    path: (args) => `/agentes-automatizaciones/${encodeURIComponent(args.id || args.automatizacion_id || args.nombre || args.name || 'todas')}`,
  },
  wappy_activar_automatizacion: {
    method: 'PUT',
    path: (args) => `/agentes-automatizaciones/${encodeURIComponent(args.id || args.automatizacion_id || args.nombre || args.name || 'todas')}`,
  },
  wappy_desactivar_automatizacion: {
    method: 'PUT',
    path: (args) => `/agentes-automatizaciones/${encodeURIComponent(args.id || args.automatizacion_id || args.nombre || args.name || 'todas')}`,
  },
  wappy_eliminar_automatizacion: {
    method: 'DELETE',
    path: (args) => `/agentes-automatizaciones/${encodeURIComponent(args.id || args.automatizacion_id || args.nombre || args.name || 'todas')}`,
  },
  wappy_consultar_conversaciones: { method: 'GET', path: '/conversations' },
  wappy_consultar_mensajes_conversacion: { method: 'GET', path: '/messages' },
  wappy_consultar_archivos: { method: 'GET', path: '/files' },

  // 5.1 Marketplace & Tienda SST
  wappy_consultar_marketplace: { method: 'GET', path: '/marketplace/products' },
  wappy_consultar_tienda: { method: 'GET', path: '/marketplace/products' },
  wappy_consultar_productos_tienda: { method: 'GET', path: '/marketplace/products' },
  wappy_consultar_pedidos_marketplace: { method: 'GET', path: '/marketplace/orders' },
  wappy_consultar_compras_marketplace: { method: 'GET', path: '/marketplace/orders' },

  // 6. Lectura y Generación de Informes de Aplicativos
  wappy_leer_informe_aplicativo: { method: 'GET', path: '/informe' },
  wappy_crear_informe: { method: 'POST', path: '/reports/generate' },
  wappy_generar_informe: { method: 'POST', path: '/reports/generate' },

  // 7. Comunicaciones & Correo Electrónico
  wappy_enviar_correo: { method: 'POST', path: '/email/send' },
  enviar_correo: { method: 'POST', path: '/email/send' },

  // 8. Agendas, Citas y Calendario
  wappy_gestionar_agenda: {
    method: (args) => {
      const act = (args.accion || args.action || '').toLowerCase();
      if (act.includes('eliminar') || act.includes('delete') || act.includes('cancelar')) {
        return 'DELETE';
      }
      if (act.includes('reprogramar') || act.includes('actualizar') || act.includes('editar') || act.includes('reschedule') || act.includes('update')) {
        return 'PUT';
      }
      if (act.includes('listar') || act.includes('list') || act.includes('consultar') || act.includes('ver') || act.includes('leer')) {
        return 'GET';
      }
      return 'POST';
    },
    path: (args) => {
      const act = (args.accion || args.action || '').toLowerCase();
      if (act.includes('eliminar') || act.includes('delete') || act.includes('cancelar')) {
        const id = args.id || args.id_evento || args.eventId || args.titulo || args.query || '';
        return id ? `/agenda/events/${encodeURIComponent(String(id).trim())}` : '/agenda/events';
      }
      if (act.includes('reprogramar') || act.includes('actualizar') || act.includes('editar') || act.includes('reschedule') || act.includes('update')) {
        const id = args.id || args.id_evento || args.eventId || args.titulo || args.query || '';
        return id ? `/agenda/events/${encodeURIComponent(String(id).trim())}` : '/agenda/events';
      }
      return '/agenda/events';
    },
  },
  wappy_reprogramar_agenda: {
    method: 'PUT',
    path: (args) => {
      const id = args.id || args.id_evento || args.eventId || args.titulo || args.query || '';
      return id ? `/agenda/events/${encodeURIComponent(String(id).trim())}` : '/agenda/events';
    },
  },
  wappy_eliminar_agenda: {
    method: 'DELETE',
    path: (args) => {
      const id = args.id || args.id_evento || args.eventId || args.titulo || args.query || '';
      return id ? `/agenda/events/${encodeURIComponent(String(id).trim())}` : '/agenda/events';
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

  // 13. Google NotebookLM / Gemini Notebook (35 herramientas + alias de voz)
  notebook_list: { isNotebookLM: true, tool: 'notebook_list' },
  notebook_list_mcp_notebooklm: { isNotebookLM: true, tool: 'notebook_list' },
  notebooklm_listar_cuadernos: { isNotebookLM: true, tool: 'notebook_list' },
  wappy_notebooklm_listar: { isNotebookLM: true, tool: 'notebook_list' },
  wappy_consultar_cuadernos: { isNotebookLM: true, tool: 'notebook_list' },
  notebook_create: { isNotebookLM: true, tool: 'notebook_create' },
  notebook_create_mcp_notebooklm: { isNotebookLM: true, tool: 'notebook_create' },
  notebooklm_crear_cuaderno: { isNotebookLM: true, tool: 'notebook_create' },
  notebook_rename: { isNotebookLM: true, tool: 'notebook_rename' },
  notebook_rename_mcp_notebooklm: { isNotebookLM: true, tool: 'notebook_rename' },
  notebooklm_renombrar_cuaderno: { isNotebookLM: true, tool: 'notebook_rename' },
  wappy_notebooklm_renombrar: { isNotebookLM: true, tool: 'notebook_rename' },
  notebook_get_summary: { isNotebookLM: true, tool: 'notebook_get_summary' },
  notebook_get_summary_mcp_notebooklm: { isNotebookLM: true, tool: 'notebook_get_summary' },
  notebook_suggest_prompts: { isNotebookLM: true, tool: 'notebook_suggest_prompts' },
  notebook_suggest_prompts_mcp_notebooklm: { isNotebookLM: true, tool: 'notebook_suggest_prompts' },
  notebook_copy: { isNotebookLM: true, tool: 'notebook_copy' },
  notebook_copy_mcp_notebooklm: { isNotebookLM: true, tool: 'notebook_copy' },
  notebook_delete: { isNotebookLM: true, tool: 'notebook_delete' },
  notebook_delete_mcp_notebooklm: { isNotebookLM: true, tool: 'notebook_delete' },
  notebook_share: { isNotebookLM: true, tool: 'notebook_share' },
  notebook_share_mcp_notebooklm: { isNotebookLM: true, tool: 'notebook_share' },
  chat_ask: { isNotebookLM: true, tool: 'chat_ask' },
  chat_ask_mcp_notebooklm: { isNotebookLM: true, tool: 'chat_ask' },
  notebooklm_consultar: { isNotebookLM: true, tool: 'chat_ask' },
  wappy_notebooklm_consultar: { isNotebookLM: true, tool: 'chat_ask' },
  wappy_consultar_cuaderno: { isNotebookLM: true, tool: 'chat_ask' },
  chat_configure: { isNotebookLM: true, tool: 'chat_configure' },
  chat_configure_mcp_notebooklm: { isNotebookLM: true, tool: 'chat_configure' },
  source_list: { isNotebookLM: true, tool: 'source_list' },
  source_list_mcp_notebooklm: { isNotebookLM: true, tool: 'source_list' },
  notebooklm_listar_fuentes: { isNotebookLM: true, tool: 'source_list' },
  source_add: { isNotebookLM: true, tool: 'source_add' },
  source_add_mcp_notebooklm: { isNotebookLM: true, tool: 'source_add' },
  notebooklm_agregar_fuente: { isNotebookLM: true, tool: 'source_add' },
  source_add_file: { isNotebookLM: true, tool: 'source_add_file' },
  source_add_file_mcp_notebooklm: { isNotebookLM: true, tool: 'source_add_file' },
  source_add_drive: { isNotebookLM: true, tool: 'source_add_drive' },
  source_add_drive_mcp_notebooklm: { isNotebookLM: true, tool: 'source_add_drive' },
  source_add_urls_batch: { isNotebookLM: true, tool: 'source_add_urls_batch' },
  source_add_urls_batch_mcp_notebooklm: { isNotebookLM: true, tool: 'source_add_urls_batch' },
  source_get_fulltext: { isNotebookLM: true, tool: 'source_get_fulltext' },
  source_get_fulltext_mcp_notebooklm: { isNotebookLM: true, tool: 'source_get_fulltext' },
  source_get_guide: { isNotebookLM: true, tool: 'source_get_guide' },
  source_get_guide_mcp_notebooklm: { isNotebookLM: true, tool: 'source_get_guide' },
  source_search: { isNotebookLM: true, tool: 'source_search' },
  source_search_mcp_notebooklm: { isNotebookLM: true, tool: 'source_search' },
  source_rename: { isNotebookLM: true, tool: 'source_rename' },
  source_rename_mcp_notebooklm: { isNotebookLM: true, tool: 'source_rename' },
  source_append_text: { isNotebookLM: true, tool: 'source_append_text' },
  source_append_text_mcp_notebooklm: { isNotebookLM: true, tool: 'source_append_text' },
  source_refresh: { isNotebookLM: true, tool: 'source_refresh' },
  source_refresh_mcp_notebooklm: { isNotebookLM: true, tool: 'source_refresh' },
  source_delete: { isNotebookLM: true, tool: 'source_delete' },
  source_delete_mcp_notebooklm: { isNotebookLM: true, tool: 'source_delete' },
  note_list: { isNotebookLM: true, tool: 'note_list' },
  note_list_mcp_notebooklm: { isNotebookLM: true, tool: 'note_list' },
  note_create: { isNotebookLM: true, tool: 'note_create' },
  note_create_mcp_notebooklm: { isNotebookLM: true, tool: 'note_create' },
  note_update: { isNotebookLM: true, tool: 'note_update' },
  note_update_mcp_notebooklm: { isNotebookLM: true, tool: 'note_update' },
  note_delete: { isNotebookLM: true, tool: 'note_delete' },
  note_delete_mcp_notebooklm: { isNotebookLM: true, tool: 'note_delete' },
  studio_generate: { isNotebookLM: true, tool: 'studio_generate' },
  studio_generate_mcp_notebooklm: { isNotebookLM: true, tool: 'studio_generate' },
  notebooklm_generar_studio: { isNotebookLM: true, tool: 'studio_generate' },
  studio_status: { isNotebookLM: true, tool: 'studio_status' },
  studio_status_mcp_notebooklm: { isNotebookLM: true, tool: 'studio_status' },
  notebooklm_estado_studio: { isNotebookLM: true, tool: 'studio_status' },
  studio_download: { isNotebookLM: true, tool: 'studio_download' },
  studio_download_mcp_notebooklm: { isNotebookLM: true, tool: 'studio_download' },
  notebooklm_descargar_artefacto: { isNotebookLM: true, tool: 'studio_download' },
  studio_list: { isNotebookLM: true, tool: 'studio_list' },
  studio_list_mcp_notebooklm: { isNotebookLM: true, tool: 'studio_list' },
  notebooklm_listar_artefactos: { isNotebookLM: true, tool: 'studio_list' },
  studio_export: { isNotebookLM: true, tool: 'studio_export' },
  studio_export_mcp_notebooklm: { isNotebookLM: true, tool: 'studio_export' },
  studio_revise_slide: { isNotebookLM: true, tool: 'studio_revise_slide' },
  studio_revise_slide_mcp_notebooklm: { isNotebookLM: true, tool: 'studio_revise_slide' },
  studio_manage: { isNotebookLM: true, tool: 'studio_manage' },
  studio_manage_mcp_notebooklm: { isNotebookLM: true, tool: 'studio_manage' },
  research_start: { isNotebookLM: true, tool: 'research_start' },
  research_start_mcp_notebooklm: { isNotebookLM: true, tool: 'research_start' },
  notebooklm_investigar_web: { isNotebookLM: true, tool: 'research_start' },
  research_import: { isNotebookLM: true, tool: 'research_import' },
  research_import_mcp_notebooklm: { isNotebookLM: true, tool: 'research_import' },
  notebooklm_importar_investigacion: { isNotebookLM: true, tool: 'research_import' },

  // Google Flow & Studio (Veo & Imagen)
  google_flow_generar_imagen: { isGoogleFlow: true, type: 'image' },
  google_flow_generar_video: { isGoogleFlow: true, type: 'video' },

  // MedlinePlus Connect (NIH) & Fisioterapia Laboral
  wappy_consultar_rehabilitacion_medlineplus: {
    method: 'GET',
    path: (args) => `/medicina/rehabilitacion-medlineplus?codigo=${encodeURIComponent(args.codigo || args.cie10 || args.q || '')}&segmento=${encodeURIComponent(args.segmento || args.zona || '')}`,
  },
  consultar_rehabilitacion_medlineplus: {
    method: 'GET',
    path: (args) => `/medicina/rehabilitacion-medlineplus?codigo=${encodeURIComponent(args.codigo || args.cie10 || args.q || '')}&segmento=${encodeURIComponent(args.segmento || args.zona || '')}`,
  },
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
      const NotebookSession = require('~/models/NotebookSession');
      let sessionDoc = null;
      if (userId) {
        sessionDoc = await NotebookSession.findOne({ user: userId }).lean().catch(() => null);
      }
      if (!sessionDoc || !Array.isArray(sessionDoc.cookies) || sessionDoc.cookies.length === 0) {
        return {
          error:
            'Aún no has vinculado tu cuenta privada de Google NotebookLM. Ve a Mi Cuenta -> Integraciones -> Google NotebookLM para vincular tu sesión de forma 100% privada.',
        };
      }

      const cleanArgs = { ...(args || {}) };
      delete cleanArgs.dummy;
      if (cleanArgs.cuaderno && !cleanArgs.notebook) {
        cleanArgs.notebook = cleanArgs.cuaderno;
        delete cleanArgs.cuaderno;
      }
      if ((cleanArgs.pregunta || cleanArgs.question || cleanArgs.consulta) && !cleanArgs.query) {
        cleanArgs.query = cleanArgs.pregunta || cleanArgs.question || cleanArgs.consulta;
        delete cleanArgs.pregunta;
        delete cleanArgs.question;
        delete cleanArgs.consulta;
      }
      if (cleanArgs.titulo && !cleanArgs.title) {
        cleanArgs.title = cleanArgs.titulo;
        delete cleanArgs.titulo;
      }
      if (cleanArgs.nuevo_titulo && !cleanArgs.new_title) {
        cleanArgs.new_title = cleanArgs.nuevo_titulo;
        delete cleanArgs.nuevo_titulo;
      }
      if (cleanArgs.tipo_artefacto && !cleanArgs.artifact_type) {
        cleanArgs.artifact_type = cleanArgs.tipo_artefacto;
        delete cleanArgs.tipo_artefacto;
      }
      if (cleanArgs.instrucciones && !cleanArgs.instructions) {
        cleanArgs.instructions = cleanArgs.instrucciones;
        delete cleanArgs.instrucciones;
      }
      if (cleanArgs.tipo_fuente && !cleanArgs.source_type) {
        cleanArgs.source_type = cleanArgs.tipo_fuente;
        delete cleanArgs.tipo_fuente;
      }
      if (cleanArgs.texto && !cleanArgs.text) {
        cleanArgs.text = cleanArgs.texto;
        delete cleanArgs.texto;
      }
      if (cleanArgs.modo && !cleanArgs.mode) {
        cleanArgs.mode = cleanArgs.modo;
        delete cleanArgs.modo;
      }

      const nbHeaders = {
        'Content-Type': 'application/json',
        'x-user-id': String(userId || ''),
      };
      if (sessionDoc.email) {
        nbHeaders['x-user-email'] = String(sessionDoc.email);
      }

      const response = await fetch(`${notebooklmUrl}/api/direct-tool`, {
        method: 'POST',
        headers: nbHeaders,
        body: JSON.stringify({
          name: targetTool,
          arguments: cleanArgs,
          user_id: String(userId || ''),
          user_email: String(sessionDoc.email || ''),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.error) {
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

  // Si es una herramienta de Google Flow & Studio (Veo & Imagen)
  if (routeConfig.isGoogleFlow) {
    try {
      const {
        executeFlowImageGeneration,
        executeFlowVideoGeneration,
      } = require('~/server/routes/googleflow');
      const flowPrompt = args?.prompt || args?.descripcion || '';
      const flowAspect = args?.aspecto || args?.aspectRatio || '16:9';
      const flowStyle = args?.estilo || args?.style || 'fotorrealista';
      const flowMotion = args?.movimiento_camara || args?.cameraMotion || 'zoom_in';

      if (routeConfig.type === 'video') {
        const vidRes = await executeFlowVideoGeneration({
          userId,
          prompt: flowPrompt,
          aspectRatio: flowAspect,
          cameraMotion: flowMotion,
        });
        return {
          success: true,
          type: 'video',
          publicUrl: vidRes.publicUrl,
          model: vidRes.model,
          aspectRatio: vidRes.aspectRatio,
          message: `Video generado exitosamente en ${vidRes.publicUrl}`,
        };
      } else {
        const imgRes = await executeFlowImageGeneration({
          userId,
          prompt: flowPrompt,
          aspectRatio: flowAspect,
          style: flowStyle,
        });
        return {
          success: true,
          type: 'image',
          publicUrl: imgRes.publicUrl,
          model: imgRes.model,
          aspectRatio: imgRes.aspectRatio,
          message: `Imagen generada exitosamente en ${imgRes.publicUrl}`,
        };
      }
    } catch (flowErr) {
      logger.error('[Tenshi MCP] Error en Google Flow:', flowErr);
      return { error: `Error al generar en Google Flow: ${flowErr.message}` };
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
