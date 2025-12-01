import json

# Cargar el archivo de traducción actualizado
print("Cargando archivo de traducción español actualizado...")
with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/es/translation.json', 'r', encoding='utf-8') as f:
    es = json.load(f)

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/en/translation.json', 'r', encoding='utf-8') as f:
    en = json.load(f)

# Diccionario completo de traducciones mejoradas para claves específicas
improved_translations = {
    # Navegación y UI
    "com_nav_info_save_chat_badges_state": "Al habilitar esta opción, se guardará el estado de las insignias del chat",
    "com_nav_info_user_msg_markdown": "Cuando está habilitado, los mensajes del usuario se mostrarán con formato markdown",
    
    # Artifacts
    "com_ui_artifact_close": "Cerrar artefacto",
    "com_ui_artifact_copy": "Copiar artefacto",
    "com_ui_artifact_download": "Descargar artefacto",
    "com_ui_artifact_maximize": "Maximizar artefacto",
    "com_ui_artifact_minimize": "Minimizar artefacto",
    "com_ui_artifact_view_code": "Ver código",
    "com_ui_artifact_view_preview": "Ver vista previa",
    
    # Agents - completar las que faltan
    "com_agents_actions": "Acciones del agente",
    "com_agents_add_action": "Agregar acción",
    "com_agents_capabilities": "Capacidades",
    "com_agents_default_agent": "Agente predeterminado",
    "com_agents_delete_confirm": "¿Estás seguro de que quieres eliminar este agente?",
    "com_agents_knowledge_base": "Base de conocimientos",
    "com_agents_model_select": "Seleccionar modelo",
    "com_agents_provider_select": "Seleccionar proveedor",
    "com_agents_select_agent": "Seleccionar un agente",
    "com_agents_shared": "Compartidos",
    "com_agents_system_message": "Mensaje del sistema",
    "com_agents_version": "Versión del agente",
    
    # MCP (Model Context Protocol)
    "com_ui_mcp": "MCP",
    "com_ui_mcp_server": "Servidor MCP",
    "com_ui_mcp_servers": "Servidores MCP",
    "com_ui_mcp_add_server": "Agregar servidor MCP",
    "com_ui_mcp_remove_server": "Eliminar servidor MCP",
    "com_ui_mcp_server_url": "URL del servidor MCP",
    "com_ui_mcp_server_name": "Nombre del servidor",
    
    # Responses API
    "com_nav_responses_api": "API de respuestas",
    "com_nav_use_responses_api": "Usar API de respuestas",
    "com_nav_responses_api_info": "La API de respuestas permite respuestas más estructuradas y flexibles",
    
    # Web Search & Grounding
    "com_nav_web_search": "Búsqueda web",
    "com_nav_use_web_search": "Usar búsqueda web",
    "com_nav_web_search_info": "Permite al modelo buscar información actualizada en la web",
    "com_nav_search_grounding": "Fundamentación de búsqueda",
    "com_nav_use_search_grounding": "Usar fundamentación de búsqueda",
    
    # Reasoning & Thinking
    "com_nav_thinking": "Pensamiento",
    "com_nav_show_thinking": "Mostrar proceso de pensamiento",
    "com_nav_thinking_info": "Muestra el proceso de razonamiento del modelo",
    "com_nav_reasoning": "Razonamiento",
    "com_nav_reasoning_effort": "Esfuerzo de razonamiento",
    "com_nav_reasoning_summary": "Resumen de razonamiento",
    
    # Streaming
    "com_nav_streaming": "Transmisión",
    "com_nav_enable_streaming": "Habilitar transmisión",
    "com_nav_disable_streaming": "Deshabilitar transmisión",
    "com_nav_streaming_info": "Muestra la respuesta a medida que se genera",
    
    # Verbosity
    "com_nav_verbosity": "Verbosidad",
    "com_nav_verbosity_low": "Baja",
    "com_nav_verbosity_medium": "Media",
    "com_nav_verbosity_high": "Alta",
    
    # Model deprecation
    "com_nav_model_deprecated": "Modelo obsoleto",
    "com_nav_model_deprecated_info": "Este modelo será eliminado próximamente",
    "com_nav_migration_recommended": "Se recomienda migrar a",
    
    # Citations & Sources
    "com_nav_citations": "Citas",
    "com_nav_show_citations": "Mostrar citas",
    "com_nav_citation_source": "Fuente de la cita",
    "com_nav_citation_details": "Detalles de la cita",
    "com_nav_view_source": "Ver fuente",
    
    # Error messages improvements
    "com_error_moderation_policy": "Tu mensaje ha sido marcado por nuestro sistema de moderación",
    "com_error_invalid_model": "Modelo no válido seleccionado",
    "com_error_no_provider": "No se encontró ningún proveedor",
    "com_error_api_key_missing": "Falta la clave API",
    "com_error_api_key_invalid": "Clave API no válida",
    "com_error_quota_exceeded": "Cuota excedida",
    "com_error_rate_limit": "Límite de tasa alcanzado",
    "com_error_server_error": "Error del servidor",
    "com_error_network_error": "Error de red",
    "com_error_timeout": "Tiempo de espera agotado",
   
    # File handling
    "com_files_drag_drop": "Arrastra y suelta archivos aquí",
    "com_files_upload_limit": "Límite de carga de archivos",
    "com_files_size_limit": "Límite de tamaño de archivo",
    "com_files_type_not_supported": "Tipo de archivo no compatible",
    "com_files_too_large": "Archivo demasiado grande",
    "com_files_upload_failed": "Error al subir archivo",
    "com_files_upload_success": "Archivo subido exitosamente",
    "com_files_processing": "Procesando archivo",
    "com_files_delete_confirm": "¿Eliminar archivo?",
    
    # Conversation
    "com_convo_search": "Buscar conversaciones",
    "com_convo_filter": "Filtrar conversaciones",
    "com_convo_sort": "Ordenar conversaciones",
    "com_convo_sort_date": "Por fecha",
    "com_convo_sort_name": "Por nombre",
    "com_convo_sort_recent": "Más recientes",
    "com_convo_sort_oldest": "Más antiguos",
    "com_convo_archived": "Archivadas",
    "com_convo_active": "Activas",
    "com_convo_starred": "Destacadas",
    
    # Prompts
    "com_prompts_shared": "Prompts compartidos",
    "com_prompts_my_prompts": "Mis prompts",
    "com_prompts_create_new": "Crear nuevo prompt",
    "com_prompts_edit_prompt": "Editar prompt",
    "com_prompts_delete_prompt": "Eliminar prompt",
    "com_prompts_duplicate_prompt": "Duplicar prompt",
    "com_prompts_share_prompt": "Compartir prompt",
    "com_prompts_unshare_prompt": "Dejar de compartir prompt",
    "com_prompts_search": "Buscar prompts",
    "com_prompts_filter": "Filtrar prompts",
    "com_prompts_category": "Categoría",
    "com_prompts_tags": "Etiquetas",
    
    # Settings
    "com_settings_general": "General",
    "com_settings_appearance": "Apariencia",
    "com_settings_chat": "Chat",
    "com_settings_data": "Datos",
    "com_settings_speech": "Voz",
    "com_settings_advanced": "Avanzado",
    "com_settings_account": "Cuenta",
    "com_settings_beta": "Beta",
    "com_settings_experimental": "Experimental",
}

# Aplicar traducciones mejoradas
improved_count = 0
for key, value in improved_translations.items():
    if key in es:
        es[key] = value
        improved_count += 1

print(f"Se mejoraron {improved_count} traducciones existentes")

# Ahora vamos a mejorar las traducciones automáticas restantes
# Patrones de mejora para hacer las traducciones más naturales
improvement_patterns = {
    "Please ": "Por favor, ",
    "Click ": "Haz clic en ",
    "Enable ": "Habilitar ",
    "Disable ": "Deshabilitar ",
    "Use ": "Usar ",
    "Select ": "Seleccionar ",
    "Choose ": "Elegir ",
    " successfully": " exitosamente",
    " failed": " falló",
    "Are you sure": "¿Estás seguro",
    "Error: ": "Error: ",
    "Warning: ": "Advertencia: ",
    " is required": " es obligatorio",
    " is optional": " es opcional",
    "Search for": "Buscar",
    "Filter by": "Filtrar por",
    "Sort by": "Ordenar por",
    "Show all": "Mostrar todo",
    "Hide all": "Ocultar todo",
    "View more": "Ver más",
    "Load more": "Cargar más",
    "No results": "Sin resultados",
    "Not found": "No encontrado",
}

# Aplicar patrones de mejora
pattern_improvements = 0
for key in es.keys():
    original = es[key]
    for eng_pattern, esp_pattern in improvement_patterns.items():
        if eng_pattern in es[key]:
            es[key] = es[key].replace(eng_pattern, esp_pattern)
            if es[key] != original:
                pattern_improvements += 1
                break

print(f"Se aplicaron {pattern_improvements} mejoras de patrones")

# Ordenar alfabéticamente
es_sorted = dict(sorted(es.items()))

# Guardar
output_path = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/es/translation.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(es_sorted, f, ensure_ascii=False, indent=2)

print(f"\n✅ Archivo mejorado guardado en: {output_path}")
print(f"Total de traducciones: {len(es_sorted)}")
print(f"Mejoras aplicadas: {improved_count + pattern_improvements}")
