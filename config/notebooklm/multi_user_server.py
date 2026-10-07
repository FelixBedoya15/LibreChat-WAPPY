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


def _ensure_default_storage() -> Path:
    """Garantiza que el perfil default tenga siempre un storage_state.json funcional."""
    default_storage = PROFILES_DIR / "default" / "storage_state.json"
    if default_storage.exists() and default_storage.stat().st_size > 0:
        return default_storage

    # Buscar en candidatos de respaldo
    current_dir = Path(__file__).resolve().parent
    candidates = [
        current_dir / "profiles" / "default" / "storage_state.json",
        current_dir / "default_storage.json",
        Path("/app/profiles/default/storage_state.json"),
        Path("/app/default_storage.json"),
        Path("/root/LibreChat-WAPPY/config/notebooklm/profiles/default/storage_state.json"),
        Path("/root/LibreChat-WAPPY/config/notebooklm/default_storage.json"),
        NOTEBOOKLM_HOME / "storage_state.json",
        Path.home() / ".notebooklm" / "profiles" / "default" / "storage_state.json",
    ]
    for cand in candidates:
        if cand.exists() and cand.stat().st_size > 0:
            try:
                default_storage.parent.mkdir(parents=True, exist_ok=True)
                default_storage.write_bytes(cand.read_bytes())
                try:
                    os.chmod(default_storage, 0o600)
                except Exception:
                    pass
                logger.info(f"Sesión default auto-restaurada desde '{cand}' hacia '{default_storage}'.")
                return default_storage
            except Exception as e:
                logger.warning(f"Error auto-restaurando sesión default desde '{cand}': {e}")

    return default_storage


# Auto-inicializar perfil default al cargar el módulo
_ensure_default_storage()

# Cache de clientes en memoria {profile_name: (client, context_manager)}
_CLIENT_CACHE: Dict[str, Any] = {}
_CACHE_LOCK = asyncio.Lock()

mcp = FastMCP(
    "notebooklm",
    instructions=(
        "Drive Google NotebookLM / Gemini Notebook. Ground answers in source documents "
        "with verifiable citations, generate educational studio artifacts (podcasts, quizzes, "
        "flashcards, mind maps, reports), and manage notebooks and sources.\n\n"
        "REGLA OBLIGATORIA PARA AGENTES:\n"
        "Al ejecutar 'chat_ask', NUNCA respondas diciendo simplemente 'he procesado tu consulta' "
        "o confirmaciones vacías. DEBES entregar de inmediato y en su totalidad la respuesta ('answer') "
        "y sus citas ('citations') al usuario en ese mismo mensaje, con formato claro y estructurado."
    )
)


def _normalize_cookie(c: Dict[str, Any]) -> Dict[str, Any]:
    same_site = str(c.get("sameSite", "Lax")).capitalize()
    if same_site in ("No_restriction", "Unspecified"):
        same_site = "Lax"
    elif same_site not in ("Strict", "Lax", "None"):
        same_site = "Lax"
    return {
        "name": str(c.get("name", "")).strip(),
        "value": str(c.get("value", "")).strip(),
        "domain": str(c.get("domain", ".google.com")),
        "path": str(c.get("path", "/")),
        "secure": bool(c.get("secure", True)),
        "httpOnly": bool(c.get("httpOnly", True)),
        "sameSite": same_site,
    }


def _safe_parse_cookies(raw_auth: str) -> List[Dict[str, Any]]:
    """Convierte una cadena de texto o JSON de cookies en la lista requerida por storage_state.json."""
    raw_auth = raw_auth.strip()
    if not raw_auth:
        return []

    # 1. Si es JSON
    if raw_auth.startswith("{") or raw_auth.startswith("["):
        try:
            parsed = json.loads(raw_auth)
            raw_list = []
            if isinstance(parsed, list):
                raw_list = parsed
            elif isinstance(parsed, dict) and "cookies" in parsed:
                raw_list = parsed["cookies"]
            if raw_list:
                return [_normalize_cookie(c) for c in raw_list if isinstance(c, dict) and c.get("name") and c.get("value")]
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
        active_storage_file = _ensure_default_storage()

    # Si el perfil default tampoco tiene storage_state.json, revisar fallback legado
    if not active_storage_file.exists() or active_storage_file.stat().st_size == 0:
        legacy_storage = NOTEBOOKLM_HOME / "storage_state.json"
        if legacy_storage.exists() and legacy_storage.stat().st_size > 0:
            active_storage_file = legacy_storage
            selected_profile = "default"
        else:
            raise RuntimeError(
                "No hay sesión de Google NotebookLM activa en el sistema ni credenciales configuradas. "
                "Para activarlo: ejecuta 'npm run notebooklm:auth' en el servidor VPS para vincular la cuenta central de WAPPY."
            )

    # Obtener o instanciar cliente desde el cache (con verificación de mtime)
    current_mtime = active_storage_file.stat().st_mtime if active_storage_file.exists() else 0

    async with _CACHE_LOCK:
        if selected_profile in _CLIENT_CACHE:
            client, old_ctx, cached_mtime = _CLIENT_CACHE[selected_profile]
            if current_mtime == cached_mtime:
                return client
            # Archivo actualizado en disco: invalidar sesión previa
            logger.info(f"Perfil '{selected_profile}' actualizado en disco. Reinicializando cliente...")
            try:
                await old_ctx.__aexit__(None, None, None)
            except Exception:
                pass
            _CLIENT_CACHE.pop(selected_profile, None)

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
        _CLIENT_CACHE[selected_profile] = (client_instance, ctx, current_mtime)
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


def _handle_tool_error(tool_name: str, e: Exception) -> None:
    """Registra y enriquece errores de autenticación con Google NotebookLM."""
    logger.error(f"[{tool_name}] Error: {e}", exc_info=True)
    msg = str(e)
    if any(term in msg.lower() for term in ("csrf", "snlm0e", "auth", "401", "403", "cookie", "login", "signin", "redirect")):
        raise RuntimeError(
            "Error de autenticación con Google NotebookLM (token CSRF no encontrado o sesión expirada). "
            "Las cookies de Google han caducado o están incompletas. "
            "Para solucionarlo: abre https://notebooklm.google.com en Chrome, exporta las cookies como JSON con la extensión Cookie-Editor "
            "y actualízalas en el servidor con 'npm run notebooklm:auth'."
        ) from e
    raise e


# =============================================================================
# HERRAMIENTAS MCP EXPUESTAS (Tolerantes a argumentos del LLM)
# =============================================================================

@mcp.tool()
async def notebook_list(
    input: Optional[Any] = None,
    query: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Lista todos los cuadernos disponibles para el usuario actual (incluyendo los compartidos con la cuenta)."""
    try:
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
    except Exception as e:
        _handle_tool_error("notebook_list", e)


@mcp.tool()
async def notebook_create(
    title: str,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Crea un nuevo cuaderno de NotebookLM."""
    try:
        client = await get_client_for_request()
        nb = await client.notebooks.create(title=title)
        return {"status": "created", "id": nb.id, "title": nb.title}
    except Exception as e:
        _handle_tool_error("notebook_create", e)


@mcp.tool()
async def source_list(
    notebook: str,
    input: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """Lista los documentos, fuentes y archivos cargados en un cuaderno específico."""
    try:
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
    except Exception as e:
        _handle_tool_error("source_list", e)


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
    query: Optional[str] = None,
    question: Optional[str] = None,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Realiza una consulta fundamentada (Grounded RAG) sobre las fuentes del cuaderno.
    Devuelve la respuesta analizada por Gemini con citas y referencias directas.
    Parámetros:
      - notebook: Nombre o ID del cuaderno.
      - query / question: Pregunta o instrucción para consultar los documentos.
    """
    client = await get_client_for_request()
    nb_id = await _resolve_notebook_id(client, notebook)

    # Extraer la consulta de forma tolerante a nombres de parámetros del agente
    user_query = question or query or ""
    if not user_query and input:
        if isinstance(input, dict):
            user_query = input.get("question") or input.get("query") or input.get("input") or ""
        elif isinstance(input, str):
            user_query = input
    if not user_query:
        raise ValueError("El parámetro 'query' o 'question' es obligatorio para chat_ask")

    try:
        res = await client.chat.ask(nb_id, question=user_query)

        answer_text = getattr(res, "answer", str(res))
        references = getattr(res, "references", None) or []

        citations = []
        for ref in references:
            citations.append({
                "citation": getattr(ref, "citation_number", None),
                "source_id": getattr(ref, "source_id", ""),
                "cited_text": getattr(ref, "cited_text", ""),
                "score": getattr(ref, "score", None),
            })

        # Construir respuesta formateada completa con fuentes al pie
        formatted_answer = answer_text.strip()
        if citations:
            formatted_answer += "\n\n### 📚 Fuentes y Citas Normativas Consultadas:\n"
            for ref in citations:
                c_num = ref.get("citation")
                c_text = ref.get("cited_text")
                if c_num and c_text:
                    formatted_answer += f"- **[{c_num}]**: _{c_text.strip()}_\n"

        return {
            "notebook_id": nb_id,
            "query": user_query,
            "answer": formatted_answer,
            "citations": citations,
            "result_markdown": formatted_answer,
            "conversation_id": getattr(res, "conversation_id", None),
        }
    except Exception as e:
        _handle_tool_error("chat_ask", e)


@mcp.tool()
async def studio_generate(
    notebook: str,
    artifact_type: str,
    instructions: Optional[str] = None,
    language: Optional[str] = "es",
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Genera contenido pedagógico o multimedia en el Studio de NotebookLM a partir de las fuentes:
    - 'audio' / 'podcast': Podcast explicativo (Audio Overview a dos voces).
    - 'quiz' / 'cuestionario': Cuestionario de evaluación y preguntas.
    - 'report' / 'informe': Informe detallado o resumen ejecutivo (briefing doc).
    - 'flashcards' / 'fichas': Tarjetas de estudio.
    - 'mind_map' / 'mapa_conceptual': Mapa conceptual / resumen esquemático.
    - 'study_guide' / 'guia_estudio': Guía de estudio integral.
    """
    client = await get_client_for_request()
    nb_id = await _resolve_notebook_id(client, notebook)

    if isinstance(input, dict):
        artifact_type = input.get("artifact_type") or artifact_type
        instructions = input.get("instructions") or instructions
        language = input.get("language") or language

    t = (artifact_type or "").lower().strip()

    try:
        if t in ("audio", "podcast", "audio_overview"):
            res = await client.artifacts.generate_audio(
                nb_id,
                language=language or "es",
                instructions=instructions,
            )
        elif t in ("quiz", "cuestionario", "evaluacion", "evaluación"):
            res = await client.artifacts.generate_quiz(
                nb_id,
                instructions=instructions,
            )
        elif t in ("report", "informe", "resumen", "briefing_doc"):
            res = await client.artifacts.generate_report(
                nb_id,
                language=language or "es",
                custom_prompt=instructions,
            )
        elif t in ("flashcards", "flashcard", "fichas"):
            res = await client.artifacts.generate_flashcards(
                nb_id,
                instructions=instructions,
            )
        elif t in ("mind_map", "mindmap", "mapa_conceptual", "mapa"):
            res = await client.artifacts.generate_mind_map(
                nb_id,
                language=language or "es",
                instructions=instructions,
            )
            return {
                "status": "completed",
                "notebook_id": nb_id,
                "artifact_type": artifact_type,
                "result": str(res),
            }
        elif t in ("study_guide", "guia", "guia_estudio", "guía"):
            res = await client.artifacts.generate_study_guide(
                nb_id,
                language=language or "es",
                extra_instructions=instructions,
            )
        elif t in ("slide_deck", "slides", "presentacion", "presentación"):
            res = await client.artifacts.generate_slide_deck(nb_id)
        elif t in ("video", "cinematic_video"):
            if hasattr(client.artifacts, "generate_cinematic_video"):
                res = await client.artifacts.generate_cinematic_video(nb_id, instructions=instructions)
            else:
                res = await client.artifacts.generate_video(nb_id)
        else:
            raise ValueError(
                f"Tipo de artefacto no reconocido: '{artifact_type}'. "
                "Opciones válidas: audio, quiz, report, flashcards, mind_map, study_guide."
            )

        task_id = getattr(res, "task_id", getattr(res, "id", str(res)))
        return {
            "status": getattr(res, "status", "in_progress"),
            "task_id": task_id,
            "notebook_id": nb_id,
            "artifact_type": artifact_type,
            "url": getattr(res, "url", None),
            "is_complete": getattr(res, "is_complete", False),
            "message": f"Generación de '{artifact_type}' iniciada exitosamente en NotebookLM. Consulta el avance con studio_status(task_id='{task_id}').",
        }
    except Exception as e:
        _handle_tool_error("studio_generate", e)


@mcp.tool()
async def studio_status(
    task_id: str,
    notebook: Optional[str] = None,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Consulta el estado de una generación en el Studio de NotebookLM."""
    client = await get_client_for_request()

    if isinstance(input, dict):
        task_id = input.get("task_id") or task_id
        notebook = input.get("notebook") or notebook

    target_nb_id = None
    if notebook:
        target_nb_id = await _resolve_notebook_id(client, notebook)

    # Si se especificó el cuaderno, consultar directamente
    if target_nb_id:
        try:
            res = await client.artifacts.poll_status(target_nb_id, task_id)
            url = getattr(res, "url", None)
            if not url and getattr(res, "is_complete", False):
                try:
                    audios = await client.artifacts.list_audio(target_nb_id)
                    for a in audios:
                        if a.id == task_id and getattr(a, "url", None):
                            url = a.url
                            break
                except Exception:
                    pass
            return {
                "status": getattr(res, "status", "unknown"),
                "task_id": task_id,
                "notebook_id": target_nb_id,
                "url": url,
                "is_complete": getattr(res, "is_complete", False),
                "error": getattr(res, "error", None),
            }
        except Exception as e:
            logger.warning(f"Error consultando poll_status en '{target_nb_id}': {e}")

    # Si no se pasó notebook o falló, buscar en todos los cuadernos del usuario
    try:
        notebooks = await client.notebooks.list()
        for nb in notebooks:
            try:
                res = await client.artifacts.poll_status(nb.id, task_id)
                if res and getattr(res, "status", "") not in ("not_found", ""):
                    url = getattr(res, "url", None)
                    if not url and getattr(res, "is_complete", False):
                        try:
                            audios = await client.artifacts.list_audio(nb.id)
                            for a in audios:
                                if a.id == task_id and getattr(a, "url", None):
                                    url = a.url
                                    break
                        except Exception:
                            pass
                    return {
                        "status": getattr(res, "status", "completed"),
                        "task_id": task_id,
                        "notebook_id": nb.id,
                        "url": url,
                        "is_complete": getattr(res, "is_complete", False),
                        "error": getattr(res, "error", None),
                    }
            except Exception:
                continue
    except Exception as e:
        _handle_tool_error("studio_status", e)

    return {"status": "not_found", "task_id": task_id, "message": "No se encontró la tarea especificada."}


@mcp.tool()
async def studio_download(
    artifact_id: str,
    notebook: Optional[str] = None,
    output_path: Optional[str] = None,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Obtiene información o enlace de descarga para un artefacto generado (audio, quiz, reporte).
    Si se proporciona output_path, descarga el archivo localmente en esa ruta.
    """
    client = await get_client_for_request()

    if isinstance(input, dict):
        artifact_id = input.get("artifact_id") or artifact_id
        notebook = input.get("notebook") or notebook
        output_path = input.get("output_path") or output_path

    target_nb_id = None
    if notebook:
        target_nb_id = await _resolve_notebook_id(client, notebook)

    try:
        candidate_nbs = [target_nb_id] if target_nb_id else [nb.id for nb in await client.notebooks.list()]
        for nb_id in candidate_nbs:
            try:
                art = await client.artifacts.get(nb_id, artifact_id)
                if art:
                    download_url = getattr(art, "url", None)
                    saved_to = None
                    if output_path:
                        if getattr(art, "is_quiz", False):
                            saved_to = await client.artifacts.download_quiz(nb_id, output_path, artifact_id=artifact_id)
                        elif getattr(art, "kind", None) == "audio" or "audio" in str(getattr(art, "title", "")).lower() or download_url:
                            saved_to = await client.artifacts.download_audio(nb_id, output_path, artifact_id=artifact_id)
                        else:
                            saved_to = await client.artifacts.download_report(nb_id, output_path, artifact_id=artifact_id)

                    return {
                        "status": "ready",
                        "artifact_id": artifact_id,
                        "notebook_id": nb_id,
                        "title": getattr(art, "title", ""),
                        "download_url": download_url,
                        "saved_to": saved_to,
                    }
            except Exception:
                continue
    except Exception as e:
        _handle_tool_error("studio_download", e)

    return {"status": "not_found", "artifact_id": artifact_id}


@mcp.tool()
async def studio_list(
    notebook: str,
    input: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """Lista todos los artefactos creados en el Studio del cuaderno (podcasts, quizzes, informes, etc.)."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        artifacts = await client.artifacts.list(nb_id)
        result = []
        for a in artifacts:
            result.append({
                "id": a.id,
                "title": getattr(a, "title", ""),
                "status": getattr(a, "status_str", str(getattr(a, "status", ""))),
                "url": getattr(a, "url", None),
                "created_at": str(getattr(a, "created_at", "")),
            })
        return result
    except Exception as e:
        _handle_tool_error("studio_list", e)


@mcp.tool()
async def research_start(
    notebook: str,
    query: str,
    mode: Optional[str] = "fast",
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Inicia una investigación web profunda (Deep Research) para agregar fuentes al cuaderno."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            query = input.get("query") or query
            mode = input.get("mode") or mode

        res = await client.research.start(nb_id, query=query, source="web", mode=mode or "fast")
        task_id = getattr(res, "task_id", getattr(res, "id", str(res)))
        return {
            "status": "started",
            "notebook_id": nb_id,
            "task_id": task_id,
            "message": "Investigación web iniciada para el cuaderno.",
        }
    except Exception as e:
        _handle_tool_error("research_start", e)


@mcp.tool()
async def research_import(
    notebook: str,
    task_id: str,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Importa los resultados de una investigación como nuevas fuentes del cuaderno."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            task_id = input.get("task_id") or task_id
            notebook = input.get("notebook") or notebook

        res = await client.research.import_sources(nb_id, task_id=task_id, sources=[])
        return {"status": "imported", "notebook_id": nb_id, "task_id": task_id, "result": res}
    except Exception as e:
        _handle_tool_error("research_import", e)


# =============================================================================
# INICIALIZACIÓN Y SERVICIO
# =============================================================================

if __name__ == "__main__":
    host = os.environ.get("NOTEBOOKLM_MCP_HOST", "0.0.0.0")
    port = int(os.environ.get("NOTEBOOKLM_MCP_PORT", "9420"))
    logger.info(f"Iniciando WAPPY NotebookLM FastMCP Server en http://{host}:{port}/mcp ...")
    mcp.run(transport="http", host=host, port=port)
