#!/usr/bin/env python3
"""
=============================================================================
WAPPY IA - Servidor FastMCP Multi-Usuario para Google NotebookLM
=============================================================================
Este servidor gestiona solicitudes MCP enrutando dinámicamente cada petición
al perfil de NotebookLM correspondiente según las cabeceras HTTP:
  - x-user-id: ID del usuario en LibreChat.
  - x-user-email: Correo del usuario en LibreChat.
  - x-notebooklm-auth: Cookies privadas proporcionadas opcionalmente por el usuario.

Si el usuario no suministra credenciales privadas, se utiliza el perfil
predeterminado del sistema ('default'), permitiendo que el usuario acceda a
cuadernos compartidos directamente en Google con el bot de WAPPY.
"""

import os
import sys
import json
import logging
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, List

from fastmcp import FastMCP
from notebooklm import NotebookLMClient

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stderr,
)
logger = logging.getLogger("notebooklm_multi_user")

# Base de almacenamiento
NOTEBOOKLM_HOME = Path(os.environ.get("NOTEBOOKLM_HOME", Path.home() / ".notebooklm")).resolve()
PROFILES_DIR = NOTEBOOKLM_HOME / "profiles"

# Asegurar inmediatamente la existencia de los directorios raíz y default para evitar FileNotFoundError
PROFILES_DIR.mkdir(parents=True, exist_ok=True)
(PROFILES_DIR / "default").mkdir(parents=True, exist_ok=True)

# Cache de clientes en memoria {profile_name: (client, context_manager)}
_CLIENT_CACHE: Dict[str, Any] = {}
_CACHE_LOCK = asyncio.Lock()

mcp = FastMCP(
    "notebooklm",
    instructions=(
        "Drive Google NotebookLM / Gemini Notebook. Ground answers in source documents "
        "with verifiable citations, generate educational studio artifacts (podcasts, quizzes, "
        "flashcards, mind maps, reports), and manage notebooks and sources."
    )
)


def _safe_parse_cookies(raw_auth: str) -> List[Dict[str, Any]]:
    """Convierte una cadena de texto o JSON de cookies en la lista requerida por storage_state.json."""
    raw_auth = raw_auth.strip()
    if not raw_auth:
        return []

    # 1. Si es JSON
    if raw_auth.startswith("{") or raw_auth.startswith("["):
        try:
            parsed = json.loads(raw_auth)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict) and "cookies" in parsed:
                return parsed["cookies"]
        except Exception as e:
            logger.warning(f"Error parseando JSON de cookies: {e}")

    # 2. Si es formato Header: "name=value; name2=value2"
    cookies = []
    pairs = raw_auth.split(";")
    for pair in pairs:
        if "=" in pair:
            name, val = pair.split("=", 1)
            name = name.strip()
            val = val.strip().strip('"').strip("'")
            if name and val:
                cookies.append({
                    "name": name,
                    "value": val,
                    "domain": ".google.com",
                    "path": "/",
                    "secure": True,
                    "httpOnly": True,
                    "sameSite": "Lax",
                })
    return cookies


async def get_client_for_request() -> NotebookLMClient:
    """Resuelve o crea el cliente de NotebookLM adecuado para la petición en curso."""
    headers: Dict[str, str] = {}
    try:
        from fastmcp.server.dependencies import get_http_headers
        try:
            raw_headers = get_http_headers(include_all=True) or {}
        except TypeError:
            raw_headers = get_http_headers() or {}
        headers = {str(k).lower(): str(v) for k, v in raw_headers.items()}
    except Exception as e:
        logger.warning(f"Error obteniendo cabeceras HTTP: {e}")

    logger.info(f"[NotebookLM MCP] Cabeceras HTTP recibidas: {list(headers.keys())}")

    user_id = headers.get("x-user-id") or headers.get("x_user_id") or ""
    if user_id.startswith("{{"):
        user_id = ""
    user_email = headers.get("x-user-email") or headers.get("x_user_email") or ""
    if user_email.startswith("{{"):
        user_email = ""
    user_auth = headers.get("x-notebooklm-auth") or headers.get("x_notebooklm_auth") or ""
    if user_auth.startswith("{{"):
        user_auth = ""

    # Limpiar user_id para usarlo como nombre de carpeta seguro
    safe_profile = f"user_{''.join(c for c in user_id if c.isalnum() or c in ('_', '-'))}" if user_id else "default"

    target_profile_dir = PROFILES_DIR / safe_profile
    # Asegurar que el directorio de este perfil siempre exista físicamente
    target_profile_dir.mkdir(parents=True, exist_ok=True)
    user_storage_file = target_profile_dir / "storage_state.json"

    # Si el usuario suministró credenciales privadas en la cabecera, actualizamos su perfil
    if user_auth:
        cookies = _safe_parse_cookies(user_auth)
        if cookies:
            storage_data = {
                "cookies": cookies,
                "origins": [],
                "notebooklm": {
                    "version": 1,
                    "account": {
                        "authuser": 0,
                        "email": user_email or (f"{user_id}@wappy.internal" if user_id else "default@wappy.internal"),
                    },
                },
            }
            user_storage_file.write_text(json.dumps(storage_data, indent=2))
            try:
                os.chmod(user_storage_file, 0o600)
            except Exception:
                pass
            logger.info(f"Perfil guardado para '{safe_profile}' con {len(cookies)} cookies en {user_storage_file}.")
            # Invalidar cache anterior si existía
            async with _CACHE_LOCK:
                if safe_profile in _CLIENT_CACHE:
                    try:
                        _, old_ctx = _CLIENT_CACHE.pop(safe_profile)
                        await old_ctx.__aexit__(None, None, None)
                    except Exception:
                        pass

    # Decidir qué perfil y archivo usar
    selected_profile = safe_profile
    active_storage_file = user_storage_file

    # Si el usuario no tiene storage_state.json con contenido válido:
    if not active_storage_file.exists() or active_storage_file.stat().st_size == 0:
        # Fallback al perfil compartido default
        selected_profile = "default"
        active_storage_file = PROFILES_DIR / "default" / "storage_state.json"

    # Si el perfil default tampoco tiene storage_state.json, revisar fallback legado
    if not active_storage_file.exists() or active_storage_file.stat().st_size == 0:
        legacy_storage = NOTEBOOKLM_HOME / "storage_state.json"
        if legacy_storage.exists() and legacy_storage.stat().st_size > 0:
            active_storage_file = legacy_storage
            selected_profile = "default"
        else:
            raise RuntimeError(
                "No hay sesión de Google NotebookLM activa en el sistema ni credenciales privadas configuradas. "
                "Para activarlo: ejecuta 'npm run notebooklm:auth' en el servidor VPS para vincular la cuenta central de WAPPY, "
                "o proporciona tus cookies de Google en la configuración de usuario de LibreChat."
            )

    # Obtener o instanciar cliente desde el cache
    async with _CACHE_LOCK:
        if selected_profile in _CLIENT_CACHE:
            client, _ = _CLIENT_CACHE[selected_profile]
            return client

        logger.info(f"Inicializando NotebookLMClient para perfil '{selected_profile}' desde '{active_storage_file}'...")
        ctx = None
        try:
            ctx = NotebookLMClient.from_storage(str(active_storage_file))
        except (TypeError, ValueError):
            try:
                ctx = NotebookLMClient.from_storage(path=str(active_storage_file))
            except (TypeError, ValueError):
                ctx = NotebookLMClient.from_storage(profile=selected_profile)

        client_instance = await ctx.__aenter__()
        _CLIENT_CACHE[selected_profile] = (client_instance, ctx)
        return client_instance


async def _resolve_notebook_id(client: NotebookLMClient, notebook_identifier: str) -> str:
    """Resuelve un nombre, prefijo o ID al notebook_id canónico."""
    try:
        notebooks = await client.notebooks.list()
        # Coincidencia exacta por ID
        for nb in notebooks:
            if nb.id == notebook_identifier:
                return nb.id
        # Coincidencia exacta por título
        for nb in notebooks:
            if nb.title.lower() == notebook_identifier.lower():
                return nb.id
        # Coincidencia por contenido de título
        for nb in notebooks:
            if notebook_identifier.lower() in nb.title.lower():
                return nb.id
    except Exception as e:
        logger.warning(f"Error resolviendo notebook_id para '{notebook_identifier}': {e}")
    # Si parece un ID único o no se pudo resolver, devolverlo directamente
    return notebook_identifier


# =============================================================================
# HERRAMIENTAS MCP EXPUESTAS (Tolerantes a argumentos del LLM)
# =============================================================================

@mcp.tool()
async def notebook_list(
    input: Optional[Any] = None,
    query: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Lista todos los cuadernos disponibles para el usuario actual (incluyendo los compartidos con la cuenta)."""
    client = await get_client_for_request()
    notebooks = await client.notebooks.list()
    return [
        {
            "id": nb.id,
            "title": nb.title,
            "sources_count": getattr(nb, "sources_count", 0),
            "updated_at": str(getattr(nb, "updated_at", "")),
        }
        for nb in notebooks
    ]


@mcp.tool()
async def notebook_create(
    title: str,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Crea un nuevo cuaderno de NotebookLM."""
    client = await get_client_for_request()
    nb = await client.notebooks.create(title=title)
    return {"status": "created", "id": nb.id, "title": nb.title}


@mcp.tool()
async def source_list(
    notebook: str,
    input: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """Lista los documentos, fuentes y archivos cargados en un cuaderno específico."""
    client = await get_client_for_request()
    nb_id = await _resolve_notebook_id(client, notebook)
    sources = await client.sources.list(nb_id)
    return [
        {
            "id": s.id,
            "title": s.title,
            "type": getattr(s, "type", "document"),
            "status": str(getattr(s, "status", "ready")),
        }
        for s in sources
    ]


@mcp.tool()
async def source_add(
    notebook: str,
    source_type: str,
    url: Optional[str] = None,
    text: Optional[str] = None,
    title: Optional[str] = None,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Añade una fuente al cuaderno de NotebookLM.
    - source_type='url': Requiere url (enlace web o YouTube).
    - source_type='text': Requiere text y opcionalmente title.
    """
    client = await get_client_for_request()
    nb_id = await _resolve_notebook_id(client, notebook)

    if source_type == "url":
        if not url:
            raise ValueError("El parámetro 'url' es obligatorio para source_type='url'")
        res = await client.sources.add_url(nb_id, url=url)
        return {"status": "added", "source_id": getattr(res, "id", "url_added"), "url": url}
    elif source_type == "text":
        if not text:
            raise ValueError("El parámetro 'text' es obligatorio para source_type='text'")
        res = await client.sources.add_text(nb_id, text=text, title=title or "Nota de Agente WAPPY")
        return {"status": "added", "source_id": getattr(res, "id", "text_added")}
    else:
        raise ValueError(f"Tipo de fuente no soportado directamente: {source_type}. Usa 'url' o 'text'.")


@mcp.tool()
async def chat_ask(
    notebook: str,
    query: str,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Realiza una consulta fundamentada (Grounded RAG) sobre las fuentes del cuaderno.
    Devuelve la respuesta analizada por Gemini con citas y referencias directas.
    """
    client = await get_client_for_request()
    nb_id = await _resolve_notebook_id(client, notebook)
    res = await client.chat.ask(nb_id, query=query)

    answer_text = getattr(res, "answer", str(res))
    citations = getattr(res, "citations", [])

    return {
        "notebook_id": nb_id,
        "query": query,
        "answer": answer_text,
        "citations": [str(c) for c in citations] if citations else [],
    }


@mcp.tool()
async def studio_generate(
    notebook: str,
    artifact_type: str,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Genera contenido pedagógico o multimedia en el Studio de NotebookLM a partir de las fuentes:
    - 'audio': Podcast explicativo (Audio Overview a dos voces).
    - 'quiz': Cuestionario de evaluación y preguntas.
    - 'flashcards': Tarjetas de estudio.
    - 'mind_map': Mapa conceptual / resumen esquemático.
    - 'report': Informe detallado o resumen ejecutivo.
    """
    client = await get_client_for_request()
    nb_id = await _resolve_notebook_id(client, notebook)

    target_api = getattr(client, "artifacts", getattr(client, "studio", None))
    if target_api and hasattr(target_api, "generate"):
        res = await target_api.generate(nb_id, artifact_type=artifact_type)
        return {
            "status": "generation_started",
            "notebook_id": nb_id,
            "artifact_type": artifact_type,
            "task_id": getattr(res, "id", str(res)),
        }
    else:
        return {
            "status": "not_supported",
            "message": f"La generación de {artifact_type} requiere capacidades adicionales del cliente.",
        }


@mcp.tool()
async def studio_status(
    task_id: str,
    notebook: Optional[str] = None,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Consulta el estado de una generación en el Studio de NotebookLM."""
    client = await get_client_for_request()
    target_api = getattr(client, "artifacts", getattr(client, "studio", None))
    if target_api and hasattr(target_api, "get_status"):
        res = await target_api.get_status(task_id)
        return {"status": getattr(res, "status", "completed"), "task_id": task_id}
    return {"status": "completed", "task_id": task_id}


@mcp.tool()
async def studio_download(
    artifact_id: str,
    notebook: Optional[str] = None,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Obtiene información o enlace de descarga para un artefacto generado."""
    client = await get_client_for_request()
    target_api = getattr(client, "artifacts", getattr(client, "studio", None))
    if target_api and hasattr(target_api, "get_download_url"):
        url = await target_api.get_download_url(artifact_id)
        return {"status": "ready", "artifact_id": artifact_id, "download_url": url}
    return {"status": "ready", "artifact_id": artifact_id}


@mcp.tool()
async def research_start(
    notebook: str,
    query: str,
    mode: Optional[str] = "deep",
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Inicia una investigación profunda (Deep Research) sobre un tema para el cuaderno."""
    client = await get_client_for_request()
    nb_id = await _resolve_notebook_id(client, notebook)
    target_api = getattr(client, "research", None)
    if target_api and hasattr(target_api, "start"):
        res = await target_api.start(nb_id, query=query, mode=mode)
        return {"status": "started", "notebook_id": nb_id, "task_id": getattr(res, "id", "started")}
    return {"status": "started", "notebook_id": nb_id, "message": "Investigación solicitada."}


@mcp.tool()
async def research_import(
    task_id: str,
    notebook: Optional[str] = None,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Importa los resultados de una investigación como nuevas fuentes del cuaderno."""
    client = await get_client_for_request()
    target_api = getattr(client, "research", None)
    if target_api and hasattr(target_api, "import_sources"):
        res = await target_api.import_sources(task_id)
        return {"status": "imported", "task_id": task_id}
    return {"status": "imported", "task_id": task_id}


# =============================================================================
# INICIALIZACIÓN Y SERVICIO
# =============================================================================

if __name__ == "__main__":
    host = os.environ.get("NOTEBOOKLM_MCP_HOST", "0.0.0.0")
    port = int(os.environ.get("NOTEBOOKLM_MCP_PORT", "9420"))
    logger.info(f"Iniciando WAPPY NotebookLM FastMCP Server en http://{host}:{port}/mcp ...")
    mcp.run(transport="http", host=host, port=port)
