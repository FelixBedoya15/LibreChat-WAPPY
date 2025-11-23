import json
import os

# Cargar archivos
print("Cargando archivos de traducción...")
with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/en/translation.json', 'r', encoding='utf-8') as f:
    en = json.load(f)

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/es/translation.json', 'r', encoding='utf-8') as f:
    es = json.load(f)

# Diccionario de traducciones personalizadas para términos técnicos comunes
translations_map = {
    # Términos técnicos
    "Agent": "Agente",
    "Assistant": "Asistente",
    "Endpoint": "Punto de conexión",
    "Model": "Modelo",
    "Provider": "Proveedor",
    "Prompt": "Prompt",
    "Chat": "Chat",
    "Conversation": "Conversación",
    "Message": "Mensaje",
    "Settings": "Configuración",
    "Tools": "Herramientas",
    "File": "Archivo",
    "Search": "Buscar",
    "Error": "Error",
    "Success": "Éxito",
    "Loading": "Cargando",
    "Delete": "Eliminar",
    "Edit": "Editar",
    "Save": "Guardar",
    "Cancel": "Cancelar",
    "Submit": "Enviar",
    "Update": "Actualizar",
    "Create": "Crear",
    "Code": "Código",
    "API Key": "Clave API",
    "Upload": "Subir",
    "Download": "Descargar",
    "Share": "Compartir",
    "Export": "Exportar",
    "Import": "Importar",
    "Version": "Versión",
    "Marketplace": "Mercado",
    "Recommended": "Recomendado",
    "Enable": "Habilitar",
    "Disable": "Deshabilitar",
    "Artifact": "Artefacto",
    "Citation": "Cita",
    "Source": "Fuente",
    "Thinking": "Pensando",
    "Reasoning": "Razonamiento",
    "Budget": "Presupuesto",
    "Web Search": "Búsqueda web",
    "Grounding": "Fundamentación",
    "Streaming": "Transmisión",
    "Response": "Respuesta",
    "Custom": "Personalizado",
    "Default": "Predeterminado",
    "Advanced": "Avanzado",
    "Run": "Ejecutar",
}

# Traducciones manuales específicas para las claves faltantes más importantes
manual_translations = {
    "com_agents_chat_with": "Chatear con",
    "com_agents_clear_search": "Limpiar búsqueda",
    "com_agents_error_bad_request_suggestion": "Por favor, verifica tu entrada e inténtalo de nuevo.",
    "com_agents_file_context_description": "Archivos que se pueden referenciar en el contexto del agente",
    "com_agents_file_context_label": "Contexto de archivos",
    "com_agents_grid_announcement": "Mostrando {{0}} agentes",
    "com_agents_load_more_label": "Cargar más agentes",
    "com_agents_marketplace": "Mercado",
    "com_agents_mcp_info": "Los servidores MCP permiten que los agentes accedan a herramientas y recursos externos",
    "com_agents_mcp_name_placeholder": "Nombre del servidor MCP",
    "com_agents_mcps_disabled": "Es necesario crear el Agente antes de agregar servidores MCP.",
    "com_agents_missing_name": "Por favor, proporciona un nombre para el agente",
    "com_agents_no_agent_id_error": "No se proporcionó ID de agente",
    "com_agents_no_more_results": "No hay más resultados",
    "com_agents_recommended": "Recomendado",
    "com_agents_results_for": "Resultados para",
    "com_agents_search_aria": "Campo de búsqueda de agentes",
    "com_agents_search_empty_heading": "No se encontraron agentes compartidos",
    "com_agents_search_info": "Busca agentes compartidos por nombre o descripción",
    "com_agents_search_instructions": "Intenta buscar por nombre, función o categoría",
    "com_agents_search_no_results": "No se encontraron agentes que coincidan con tu búsqueda",
    "com_agents_search_placeholder": "Buscar agentes...",
    "com_agents_see_more": "Ver más",
    "com_agents_start_chat": "Iniciar chat",
    "com_agents_top_picks": "Principales selecciones",
    
    # Assistants MCP
    "com_assistants_add_mcp_server_tools": "Agregar herramientas del servidor MCP",
    "com_assistants_running_var": "Ejecutando {{0}}",
    
    # Auth
    "com_auth_error_oauth_failed": "Error de autenticación OAuth. Por favor, inténtalo de nuevo.",
    "com_auth_saml_login": "Continuar con SAML",
    
    # Citations
    "com_citation_more_details": "Más detalles",
    "com_citation_source": "Fuente",
    
    # Endpoint settings
    "com_endpoint_anthropic_thinking": "Permitir que el modelo muestre su proceso de pensamiento",
    "com_endpoint_anthropic_thinking_budget": "Presupuesto de pensamiento (tokens)",
    "com_endpoint_anthropic_use_web_search": "Usar búsqueda web",
    "com_endpoint_deprecated_info": "Este modelo está obsoleto y será eliminado el {{0}}",
    "com_endpoint_deprecated_info_a11y": "Este modelo está obsoleto",
    "com_endpoint_disable_streaming": "Deshabilitar transmisión",
    "com_endpoint_disable_streaming_label": "Cuando está habilitado, la respuesta se mostrará solo después de completarse",
    "com_endpoint_google_thinking": "Permitir que el modelo muestre su proceso de pensamiento",
    "com_endpoint_google_thinking_budget": "Presupuesto de pensamiento (tokens)",
    "com_endpoint_google_use_search_grounding": "Usar fundamentación de búsqueda de Google",
    "com_endpoint_openai_reasoning_effort": "Esfuerzo de razonamiento",
    "com_endpoint_openai_reasoning_summary": "Resumen de razonamiento",
    "com_endpoint_openai_use_responses_api": "Usar API de respuestas",
    "com_endpoint_openai_use_web_search": "Usar búsqueda web",
    "com_endpoint_openai_verbosity": "Verbosidad",
    "com_endpoint_preset_custom_name_placeholder": "Establece un nombre personalizado para la configuración preestablecida",
    "com_endpoint_reasoning_summary": "Mostrar resumen de razonamiento",
    "com_endpoint_search_endpoint_models": "Buscar puntos de conexión y modelos",
    "com_endpoint_thinking_budget": "Presupuesto de pensamiento",
}

print(f"Claves existentes en español: {len(es)}")
print(f"Claves en inglés: {len(en)}")

# Función simple de traducción automática basada en patrones
def auto_translate(key, value):
    # Si ya tenemos una traducción manual, usarla
    if key in manual_translations:
        return manual_translations[key]
    
    # Traducción básica de frases comunes
    translation = value
    for eng, esp in translations_map.items():
        translation = translation.replace(eng, esp)
    
    return translation

# Agregar todas las claves faltantes
missing_count = 0
for key in sorted(en.keys()):
    if key not in es:
        es[key] = auto_translate(key, en[key])
        missing_count += 1

print(f"Se agregaron {missing_count} traducciones faltantes")
print(f"Total de claves ahora: {len(es)}")

# Ordenar las claves alfabéticamente
es_sorted = dict(sorted(es.items()))

# Guardar el archivo actualizado
output_path = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/es/translation.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(es_sorted, f, ensure_ascii=False, indent=2)

print(f"\n✅ Archivo actualizado guardado en: {output_path}")
print(f"Total de traducciones: {len(es_sorted)}")
