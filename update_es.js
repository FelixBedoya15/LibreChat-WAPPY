const fs = require('fs');
const path = require('path');

const esPath = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/locales/es/translation.json';

try {
    let es = JSON.parse(fs.readFileSync(esPath, 'utf8'));

    const translations = {
        // Nav / Common
        "com_nav_balance": "Saldo",
        "com_nav_balance_auto_refill_disabled": "Recarga automática desactivada.",
        "com_nav_balance_auto_refill_error": "Error al cargar configuración de recarga automática.",
        "com_nav_balance_days": "días",
        "com_nav_balance_every": "Cada",
        "com_nav_balance_hour": "hora",
        "com_nav_balance_hours": "horas",
        "com_nav_balance_interval": "Intervalo:",
        "com_nav_balance_last_refill": "Última Recarga:",
        "com_nav_balance_minute": "minuto",
        "com_nav_balance_minutes": "minutos",
        "com_nav_balance_month": "mes",
        "com_nav_balance_months": "meses",
        "com_nav_balance_next_refill": "Próxima Recarga:",
        "com_nav_balance_next_refill_info": "La próxima recarga ocurrirá automáticamente solo cuando se cumplan ambas condiciones: haya pasado el intervalo de tiempo designado desde la última recarga y el envío de un prompt cause que tu saldo caiga por debajo de cero.",
        "com_nav_balance_refill_amount": "Cantidad de Recarga:",
        "com_nav_balance_second": "segundo",
        "com_nav_balance_seconds": "segundos",
        "com_nav_balance_week": "semana",
        "com_nav_balance_weeks": "semanas",
        "com_nav_center_chat_input": "Centrar entrada de chat en pantalla de bienvenida",
        "com_nav_info_balance": "El saldo muestra cuántos créditos de tokens te quedan por usar. Los créditos de tokens se traducen en valor monetario (ej. 1000 créditos = $0.001 USD)",
        "com_nav_info_show_thinking": "Cuando está habilitado, el chat mostrará los desplegables de pensamiento abiertos por defecto, permitiéndote ver el razonamiento de la IA en tiempo real. Cuando está deshabilitado, permanecerán cerrados por defecto para una interfaz más limpia.",

        // Auth
        "com_auth_login_inactive": "Su cuenta está inactiva y no puede iniciar sesión.",
        "com_auth_error_login_inactive": "Su cuenta está inactiva y no puede iniciar sesión.",
        "com_auth_error_login_not_active_yet": "Su cuenta aún no ha alcanzado la fecha de activación.",

        // Agents
        "com_ui_agent_recursion_limit_info": "Limita cuántos pasos puede tomar el agente en una ejecución antes de dar una respuesta final. El valor predeterminado es 25 pasos. Un paso es una solicitud a la API de IA o un uso de herramienta. Por ejemplo, una interacción básica con herramienta toma 3 pasos: solicitud inicial, uso de herramienta y solicitud de seguimiento.",
        "com_ui_agent_url_copied": "URL del agente copiada al portapapeles",
        "com_ui_agent_version_no_agent": "Ningún agente seleccionado. Por favor, seleccione un agente para ver el historial de versiones.",
        "com_ui_agent_version_restore_confirm": "¿Está seguro de que desea restaurar esta versión?",
        "com_ui_backup_codes_security_info": "Por razones de seguridad, los códigos de respaldo solo se muestran una vez al generarse. Por favor, guárdelos en una ubicación segura.",
        "com_ui_confirm_admin_use_change": "Cambiar esta configuración bloqueará el acceso para administradores, incluyéndote a ti. ¿Estás seguro de que quieres proceder?",
        "com_ui_delete_mcp_confirm": "¿Estás seguro de que quieres eliminar este servidor MCP?",
        "com_ui_delete_not_allowed": "La operación de eliminación no está permitida",
        "com_ui_delete_tool_save_reminder": "Herramienta eliminada. Guarde el agente para aplicar los cambios.",
        "com_ui_editor_instructions": "Arrastra la imagen para reposicionar • Usa el control deslizante o los botones para ajustar el tamaño",
        "com_ui_file_input_avatar_label": "Entrada de archivo para avatar",
        "com_ui_oauth_error_missing_code": "Falta el código de autorización. Por favor, inténtalo de nuevo.",
        "com_ui_oauth_error_missing_state": "Falta el parámetro state. Por favor, inténtalo de nuevo.",
        "com_ui_permissions_failed_load": "Error al cargar permisos. Por favor, inténtalo de nuevo.",
        "com_ui_permissions_failed_update": "Error al actualizar permisos. Por favor, inténtalo de nuevo.",
        "com_ui_revoke_key_error": "Error al revocar la clave API. Por favor, inténtalo de nuevo.",
        "com_ui_search_above_to_add": "Busca arriba para añadir usuarios o grupos",
        "com_ui_search_above_to_add_all": "Busca arriba para añadir usuarios, grupos o roles",
        "com_ui_search_above_to_add_people": "Busca arriba para añadir personas",
        "com_ui_search_default_placeholder": "Buscar por nombre o correo (mínimo 2 caracteres)",

        // Errors & Files
        "com_files_download_percent_complete": "{{0}}% completado",
        "com_files_download_progress": "{{0}} de {{1}} archivos",
        "com_files_filter_by": "Filtrar archivos por...",
        "com_files_preparing_download": "Preparando descarga...",
        "com_info_heic_converting": "Convirtiendo imagen HEIC a JPEG...",
        "com_error_endpoint_models_not_loaded": "Los modelos para {{0}} no pudieron cargarse. Por favor, actualice la página e inténtelo de nuevo.",
        "com_error_files_upload_too_large": "El archivo es demasiado grande. Por favor, suba un archivo más pequeño que {{0}} MB",
        "com_error_google_tool_conflict": "El uso de herramientas integradas de Google no es compatible con herramientas externas. Por favor, deshabilite las herramientas integradas o las externas.",
        "com_error_heic_conversion": "Error al convertir imagen HEIC a JPEG. Por favor, intente convertir la imagen manualmente o use un formato diferente.",
        "com_error_illegal_model_request": "El modelo \"{{0}}\" no está disponible para {{1}}. Por favor, seleccione un modelo diferente.",
        "com_error_missing_model": "Ningún modelo seleccionado para {{0}}. Por favor, seleccione un modelo e inténtelo de nuevo.",
        "com_error_models_not_loaded": "La configuración de modelos no pudo cargarse. Por favor, actualice la página e inténtelo de nuevo.",
        "com_sources_download_local_unavailable": "No se puede descargar: El archivo no está guardado",
        "com_sources_region_label": "Resultados de búsqueda y fuentes",

        // UI General
        "com_ui_agent_handoff_info_2": "Cada transferencia crea una herramienta que permite el enrutamiento fluido a agentes especialistas con contexto.",
        "com_ui_agent_handoff_max": "Máximo de {{0}} agentes de transferencia alcanzado.",
        "com_ui_agent_handoff_prompt_key": "Nombre del parámetro de contenido (predeterminado: 'instructions')",
        "com_ui_agent_handoff_prompt_key_placeholder": "Etiqueta para el contenido pasado (predeterminado: 'instructions')",
        "com_ui_agent_handoff_prompt_placeholder": "Indica a este agente qué contenido generar y pasar al agente de transferencia. Necesitas agregar algo aquí para habilitar esta función",
        "com_ui_agent_recursion_limit_info": "Limita cuántos pasos puede dar el agente en una ejecución antes de dar una respuesta final. Predeterminado es 25 pasos. Un paso es una solicitud a la API de IA o un uso de herramienta.",
        "com_ui_agent_version_error": "Error obteniendo versiones",
        "com_ui_agent_version_history": "Historial de Versiones",
        "com_ui_agent_version_title": "Versión {{versionNumber}}",
        "com_ui_artifacts_toggle_agent": "Habilitar Artefactos",
        "com_ui_backup_codes_regenerated": "Códigos de respaldo regenerados exitosamente",
        "com_ui_backup_codes_status": "Estado de Códigos de Respaldo",
        "com_ui_basic_auth_header": "Encabezado de autorización básica",
        "com_ui_bulk_delete_error": "Error al eliminar enlaces compartidos",
        "com_ui_bookmarks_tag_exists": "Un marcador con este título ya existe",
        "com_ui_agent_handoff_description_placeholder": "ej., Transferir a analista de datos para análisis estadístico",
        "com_ui_agent_handoff_prompt": "Contenido de paso",
        // Fix specific Spanglish
        "com_endpoint_use_search_grounding": "Fundamentación con Búsqueda de Google",
        "com_endpoint_thinking": "Pensamiento",
        "com_ui_adding_details": "Agregando detalles",
        "com_file_pages": "Páginas: {{pages}}",
        "com_file_unknown": "Archivo Desconocido",
        "com_files_download_failed": "{{0}} archivos fallaron",
        "com_files_downloading": "Descargando Archivos",
        "com_files_picker_title": "Elegir Archivos",
        "com_files_sharepoint_picker_title": "Elegir Archivos",
        "com_sources_agent_file": "Documento Fuente",
        "com_sources_agent_files": "Archivos del Agente",
        "com_sources_download_failed": "Descarga fallida",
        "com_sources_downloading_status": " (descargando...)",
        "com_sources_error_fallback": "No se pudieron cargar las fuentes",
        "com_sources_image_alt": "Imagen de resultado de búsqueda",
        "com_sources_more_files": "+{{count}} archivos",
        "com_sources_more_sources": "+{{count}} fuentes",
        "com_sources_pages": "Páginas",
        "com_sources_reload_page": "Recargar página",
        "com_sources_tab_all": "Todo",
        "com_sources_tab_files": "Archivos",
        "com_sources_tab_images": "Imágenes",
        "com_sources_tab_news": "Noticias",
        "com_ui_2fa_account_security": "La autenticación de dos factores añade una capa extra de seguridad a tu cuenta",
        "com_ui_2fa_generate_error": "Hubo un error generando la configuración de autenticación de dos factores",
        "com_ui_2fa_invalid": "Código de autenticación de dos factores inválido",
        "com_ui_2fa_setup": "Configurar 2FA",
        "com_ui_2fa_verified": "Autenticación de dos factores verificada exitosamente",
        "com_ui_add_api_key": "Agregar Clave API",
        "com_ui_add_mcp": "Agregar MCP",
        "com_ui_add_mcp_server": "Agregar Servidor MCP",
        "com_ui_agent_category_aftersales": "Postventa",
        "com_ui_agent_category_finance": "Finanzas",
        "com_ui_agent_category_general": "General",
        "com_ui_agent_category_hr": "RRHH",
        "com_ui_agent_category_it": "TI",
        "com_ui_agent_category_rd": "I+D",
        "com_ui_agent_category_sales": "Ventas",
        "com_ui_agent_category_selector_aria": "Selector de categoría del agente",
        "com_ui_agent_chain": "Cadena de Agentes (Mezcla-de-Agentes)",
        "com_ui_all": "todo",
        "com_ui_auth_url": "URL de Autorización",
        "com_ui_authenticate": "Autenticar",
        "com_ui_authentication_type": "Tipo de Autenticación",
        "com_ui_available_tools": "Herramientas Disponibles",
        "com_ui_back": "Atrás",
        "com_ui_back_to_builder": "Volver al constructor",
        "com_ui_backup_codes": "Códigos de Respaldo",
        "com_ui_sidepanel_mcp_no_servers_with_vars": "No hay servidores MCP con variables configurables."
    };

    let count = 0;
    for (const [key, value] of Object.entries(translations)) {
        if (es[key] !== value) {
            es[key] = value;
            count++;
        }
    }

    // Write changes back to file
    fs.writeFileSync(esPath, JSON.stringify(es, null, 2), 'utf8');
    console.log(`Successfully updated ${count} translations in es/translation.json`);

} catch (e) {
    console.error('Error updating translation file:', e);
}
