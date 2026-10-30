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
import contextvars
from pathlib import Path
from typing import Optional, Dict, Any, List

from fastmcp import FastMCP
from notebooklm import NotebookLMClient

# ContextVar para propagar cabeceras o usuario en llamadas directas HTTP
_CURRENT_USER_CONTEXT: contextvars.ContextVar[Dict[str, str]] = contextvars.ContextVar("_CURRENT_USER_CONTEXT", default={})

# Parche de compatibilidad con la actualización reciente de Google NotebookLM:
# Google migró el campo del token CSRF en WIZ_global_data de 'SNlM0e' a 'WZsZ1e'.
try:
    from notebooklm._auth import extraction
    from notebooklm._web.transport import session_auth

    _orig_extract_wiz = extraction.extract_wiz_field

    def _patched_extract_wiz_field(html: str, key: str, strict: bool = True):
        val = _orig_extract_wiz(html, key, strict=False)
        if val is None and key == "SNlM0e":
            val = _orig_extract_wiz(html, "WZsZ1e", strict=False)
        if val is None and strict:
            raise extraction.AuthExtractionError(key, html)
        return val

    extraction.extract_wiz_field = _patched_extract_wiz_field
    session_auth.extract_wiz_field = _patched_extract_wiz_field
except Exception as _patch_err:
    pass

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stderr,
)
logger = logging.getLogger("notebooklm_multi_user")

# Base de almacenamiento: usar /app/profiles para máxima fiabilidad en contenedor
NOTEBOOKLM_HOME = Path(os.environ.get("NOTEBOOKLM_HOME", "/app")).resolve()
PROFILES_DIR = Path("/app/profiles")

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
    res: Dict[str, Any] = {
        "name": str(c.get("name", "")).strip(),
        "value": str(c.get("value", "")).strip(),
        "domain": str(c.get("domain", ".google.com")),
        "path": str(c.get("path", "/")),
        "secure": bool(c.get("secure", True)),
        "httpOnly": bool(c.get("httpOnly", True)),
        "sameSite": same_site,
    }
    exp = c.get("expires", c.get("expirationDate"))
    if isinstance(exp, (int, float)) and exp > 0:
        res["expires"] = float(exp)
    return res


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


def _extract_sid(cookies: List[Dict[str, Any]]) -> str:
    for c in cookies:
        if isinstance(c, dict) and c.get("name") == "SID" and c.get("value"):
            return str(c.get("value")).strip()
    for c in cookies:
        if isinstance(c, dict) and c.get("name") == "__Secure-1PSID" and c.get("value"):
            return str(c.get("value")).strip()
    return ""


def _has_psidts(cookies: List[Dict[str, Any]]) -> bool:
    return any(
        isinstance(c, dict) and c.get("name") == "__Secure-1PSIDTS" and c.get("value")
        for c in cookies
    )


def _merge_preserving_rotated_cookies(
    incoming: List[Dict[str, Any]],
    existing: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Si la sesión (SID) es la misma, fusiona todas las cookies por (name, domain) preservando expires y evitando corrupción de cookies maestras."""
    if not existing:
        return incoming
    if not incoming:
        return existing
    inc_sid = _extract_sid(incoming)
    ex_sid = _extract_sid(existing)
    if not inc_sid or not ex_sid or inc_sid != ex_sid:
        return incoming

    protected_master_names = {
        "HSID",
        "SSID",
        "SID",
        "__Secure-1PSID",
        "__Secure-3PSID",
        "APISID",
        "SAPISID",
        "LSID",
        "__Host-1PLSID",
        "__Host-3PLSID",
        "__Host-GAPS",
        "OSID",
        "__Secure-OSID",
    }
    rotating_cookie_names = {
        "__Secure-1PSIDTS",
        "__Secure-3PSIDTS",
        "SIDCC",
        "__Secure-1PSIDCC",
        "__Secure-3PSIDCC",
    }

    by_key: Dict[tuple, Dict[str, Any]] = {}
    for ex_c in existing:
        if not isinstance(ex_c, dict) or not ex_c.get("name") or not ex_c.get("value"):
            continue
        key = (ex_c.get("name"), str(ex_c.get("domain") or ".google.com").lower())
        by_key[key] = dict(ex_c)

    for inc_c in incoming:
        if not isinstance(inc_c, dict) or not inc_c.get("name") or not inc_c.get("value"):
            continue
        cname = inc_c.get("name")
        cdom = str(inc_c.get("domain") or ".google.com").lower()
        key = (cname, cdom)
        prev = by_key.get(key)
        if prev is not None:
            inc_exp = inc_c.get("expires")
            prev_exp = prev.get("expires")
            # Nunca permitir que una cookie entrante sin expires sobrescriba una cookie maestra existente con expires válido
            if cname in protected_master_names and not isinstance(inc_exp, (int, float)) and isinstance(prev_exp, (int, float)):
                continue
            # Evitar regresión de contador en cookies rotativas (SIDCC / __Secure-1PSIDTS): conservar siempre la de mayor expires
            if cname in rotating_cookie_names and isinstance(prev_exp, (int, float)):
                if not isinstance(inc_exp, (int, float)) or prev_exp > inc_exp:
                    continue
            merged_c = {**prev, **inc_c}
            if not isinstance(inc_exp, (int, float)) and isinstance(prev_exp, (int, float)):
                merged_c["expires"] = prev_exp
            by_key[key] = merged_c
        else:
            by_key[key] = dict(inc_c)

    return list(by_key.values())


async def _evict_cached_client(profile_name: str) -> None:
    """Cierra limpiamente el cliente en caché y su _keepalive_loop para evitar tareas huérfanas con jars antiguos."""
    entry = None
    async with _CACHE_LOCK:
        entry = _CLIENT_CACHE.pop(profile_name, None)
    if not entry:
        return
    client_obj, old_ctx, _ = entry
    try:
        core = getattr(client_obj, "_core", None)
        if core is not None:
            ka_task = getattr(core, "_keepalive_task", None)
            if ka_task is not None and not ka_task.done():
                ka_task.cancel()
            http_cl = getattr(core, "_http_client", None)
            if http_cl is not None:
                await http_cl.aclose()
                core._http_client = None
        elif old_ctx is not None:
            await old_ctx.__aexit__(None, None, None)
    except Exception as e:
        logger.debug(f"[Cache Evict] Aviso cerrando cliente previo de '{profile_name}': {e}")


def _sync_disk_cookies_to_mongo(user_id: str, user_email: str, storage_file: Path) -> None:
    """Sincroniza de vuelta hacia MongoDB (NotebookSession y GoogleFlowSession) las cookies rotadas en disco."""
    if not user_id or not storage_file.exists() or storage_file.stat().st_size == 0:
        return
    try:
        data = json.loads(storage_file.read_text())
        cookies = data.get("cookies", [])
        if not cookies or not _has_psidts(cookies):
            return
        email = user_email or ""
        payload = json.dumps({"cookies": cookies, "email": email}).encode("utf-8")
        import urllib.request
        for base_host in ["http://LibreChat:3080", "http://api:3080", "http://localhost:3080"]:
            try:
                url = f"{base_host}/api/notebooklm/internal/session/{user_id}"
                req = urllib.request.Request(
                    url,
                    data=payload,
                    headers={"Content-Type": "application/json", "User-Agent": "NotebookLM-MCP/1.0"},
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=3) as resp:
                    if resp.status == 200:
                        logger.info(f"[PSIDTS Sync] Cookies rotadas sincronizadas en MongoDB para '{user_id}' ({len(cookies)} cookies).")
                        break
            except Exception:
                continue
    except Exception as e:
        logger.debug(f"[PSIDTS Sync] No se pudo sincronizar hacia MongoDB: {e}")


def _ensure_psidts_ready(storage_file: Path, force_refresh: bool = False) -> bool:
    """Garantiza que __Secure-1PSIDTS esté fresco en disco rotándolo bajo demanda con las Master Cookies (SID, OSID, SAPISID) sin eliminar el __Secure-1PSIDTS activo."""
    try:
        if not storage_file.exists() or storage_file.stat().st_size == 0:
            return False
        import time
        now_ts = time.time()
        data = json.loads(storage_file.read_text())
        cookies = data.get("cookies", [])
        nb_meta = data.get("notebooklm", {}) if isinstance(data.get("notebooklm"), dict) else {}
        last_rotated = float(nb_meta.get("lastRotatedAt", 0) or 0)

        # Limpiar cualquier email de LibreChat en account para que notebooklm-py siempre use authuser: 0
        if isinstance(nb_meta.get("account"), dict) and "email" in nb_meta["account"]:
            nb_meta["account"].pop("email", None)
            data["notebooklm"] = nb_meta
            try:
                storage_file.write_text(json.dumps(data, indent=2))
            except Exception:
                pass

        has_psidts = _has_psidts(cookies)
        # Cooldown estricto de 60s para proteger la sesión de Google contra ráfagas de RotateCookies
        if has_psidts and not force_refresh and (now_ts - last_rotated < 60):
            return False

        needs_rotation = (
            force_refresh
            or not has_psidts
        )
        if not needs_rotation:
            return False

        from notebooklm._auth import keepalive, psidts_recovery

        # Excluir __Secure-1PSIDTS / __Secure-3PSIDTS caducadas del jar de recuperación para que Google emita una nueva desde SID/SAPISID
        clean_master_cookies = [
            c for c in cookies
            if isinstance(c, dict) and "PSIDTS" not in str(c.get("name", ""))
        ]
        jar = psidts_recovery._build_recovery_jar(clean_master_cookies, psidts_recovery._storage_cookie)
        rotated_cookies = []
        try:
            with keepalive._rotation_http_client(jar) as client:
                keepalive._rotate_post_sync(client)
                rotated_cookies = list(client.cookies.jar)
        except Exception as rot_err:
            logger.debug(f"[PSIDTS Auto-Heal] Aviso en RotateCookies keepalive: {rot_err}")

        rotation_target_names = {
            "__Secure-1PSIDTS",
            "__Secure-3PSIDTS",
            "SIDCC",
            "__Secure-1PSIDCC",
            "__Secure-3PSIDCC",
        }
        updated_any = False
        by_identity = {}
        for idx, c in enumerate(cookies):
            if isinstance(c, dict) and c.get("name"):
                by_identity[(c.get("name"), str(c.get("domain") or ".google.com").lower())] = idx

        for rc in rotated_cookies:
            if rc.name not in rotation_target_names or not rc.value:
                continue
            dom = rc.domain or ".google.com"
            key = (rc.name, dom.lower())
            new_entry = {
                "name": rc.name,
                "value": rc.value,
                "domain": dom,
                "path": rc.path or "/",
                "secure": True,
                "httpOnly": True,
                "sameSite": "None" if "3P" in rc.name else "Lax",
            }
            if isinstance(rc.expires, (int, float)) and rc.expires > 0:
                new_entry["expires"] = rc.expires
            if key in by_identity:
                old_val = cookies[by_identity[key]].get("value")
                if old_val != rc.value:
                    updated_any = True
                cookies[by_identity[key]] = {**cookies[by_identity[key]], **new_entry}
            else:
                cookies.append(new_entry)
                by_identity[key] = len(cookies) - 1
                updated_any = True

        if _has_psidts(cookies):
            data["cookies"] = cookies
            if not isinstance(data.get("notebooklm"), dict):
                data["notebooklm"] = {}
            data["notebooklm"]["lastRotatedAt"] = now_ts
            if isinstance(data["notebooklm"].get("account"), dict):
                data["notebooklm"]["account"].pop("email", None)
            serialized = json.dumps(data, indent=2)
            storage_file.write_text(serialized)
            try:
                persist_file = Path.home() / ".notebooklm" / "profiles" / storage_file.parent.name / "storage_state.json"
                persist_file.parent.mkdir(parents=True, exist_ok=True)
                persist_file.write_text(serialized)
            except Exception:
                pass
            if updated_any:
                logger.info(f"[PSIDTS Auto-Heal] __Secure-1PSIDTS / SIDCC renovado suavemente en {storage_file}.")
            return updated_any

        return False
    except Exception as e:
        logger.debug(f"[PSIDTS Auto-Heal] Advertencia: {e}")
        return False


async def get_client_for_request(force_reinit: bool = False) -> NotebookLMClient:
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

    # Combinar con cabeceras inyectadas por contexto (direct tool calls)
    ctx_headers = _CURRENT_USER_CONTEXT.get() or {}
    for ck, cv in ctx_headers.items():
        if cv and ck.lower() not in headers:
            headers[ck.lower()] = cv

    logger.info(f"[NotebookLM MCP] Cabeceras HTTP activas: {list(headers.keys())}")

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

    # Si el usuario suministró credenciales privadas en la cabecera, actualizamos su perfil solo si la sesión cambió
    if user_auth:
        cookies = _safe_parse_cookies(user_auth)
        if cookies:
            cookies_changed = True
            existing_cookies: List[Dict[str, Any]] = []
            if user_storage_file.exists() and user_storage_file.stat().st_size > 0:
                try:
                    existing_json = json.loads(user_storage_file.read_text())
                    existing_cookies = existing_json.get("cookies", [])
                    ex_sid = _extract_sid(existing_cookies)
                    new_sid = _extract_sid(cookies)
                    if ex_sid and ex_sid == new_sid and _has_psidts(existing_cookies):
                        cookies_changed = False
                    else:
                        old_pairs = {(c.get("name"), c.get("value")) for c in existing_cookies if isinstance(c, dict)}
                        new_pairs = {(c.get("name"), c.get("value")) for c in cookies if isinstance(c, dict)}
                        if old_pairs and old_pairs == new_pairs:
                            cookies_changed = False
                except Exception:
                    cookies_changed = True

            if cookies_changed:
                merged_cookies = _merge_preserving_rotated_cookies(cookies, existing_cookies)
                from datetime import datetime, timezone
                now_iso = datetime.now(timezone.utc).isoformat()
                storage_data = {
                    "cookies": merged_cookies,
                    "origins": [],
                    "notebooklm": {
                        "version": 1,
                        "updatedAt": now_iso,
                        "account": {
                            "authuser": 0,
                        },
                    },
                }
                serialized = json.dumps(storage_data, indent=2)
                user_storage_file.write_text(serialized)
                try:
                    os.chmod(user_storage_file, 0o600)
                except Exception:
                    pass
                # Persistir también en volumen montado del host (/root/.notebooklm/profiles)
                try:
                    persist_dir = Path.home() / ".notebooklm" / "profiles" / safe_profile
                    persist_dir.mkdir(parents=True, exist_ok=True)
                    (persist_dir / "storage_state.json").write_text(serialized)
                except Exception:
                    pass
                logger.info(f"Perfil guardado para '{safe_profile}' con {len(merged_cookies)} cookies en {user_storage_file}.")
                await _evict_cached_client(safe_profile)

    # Si el archivo del usuario no existe en disco, intentar sincronizarlo dinámicamente desde LibreChat API
    if user_id and (not user_storage_file.exists() or user_storage_file.stat().st_size == 0):
        # Primero buscar si existe en ubicaciones alternativas del contenedor
        for alt_path in [
            Path.home() / ".notebooklm" / "profiles" / safe_profile / "storage_state.json",
            Path("/app/profiles") / safe_profile / "storage_state.json",
            Path("/root/LibreChat-WAPPY/config/notebooklm/profiles") / safe_profile / "storage_state.json",
        ]:
            if alt_path.exists() and alt_path.stat().st_size > 0:
                try:
                    target_profile_dir.mkdir(parents=True, exist_ok=True)
                    user_storage_file.write_bytes(alt_path.read_bytes())
                    logger.info(f"Perfil '{safe_profile}' copiado desde alternativa: {alt_path}")
                    break
                except Exception:
                    pass

    # Sincronizar desde la API interna de LibreChat si hay user_id y no vino x-notebooklm-auth directo
    if user_id and not user_auth:
        for base_host in ["http://LibreChat:3080", "http://api:3080", "http://localhost:3080"]:
            try:
                import urllib.request
                fetch_url = f"{base_host}/api/notebooklm/internal/session/{user_id}"
                req = urllib.request.Request(fetch_url, headers={"User-Agent": "NotebookLM-MCP/1.0"})
                with urllib.request.urlopen(req, timeout=3) as resp:
                    if resp.status == 200:
                        session_json = json.loads(resp.read().decode("utf-8"))
                        fetched_cookies = session_json.get("cookies", [])
                        remote_updated_at = str(session_json.get("updatedAt") or "")
                        if fetched_cookies:
                            # Comprobar si el archivo en disco no existe o si el usuario vinculó una sesión NUEVA en MongoDB
                            needs_write = not user_storage_file.exists() or user_storage_file.stat().st_size == 0
                            existing_cookies_disk: List[Dict[str, Any]] = []
                            if not needs_write:
                                try:
                                    existing_data = json.loads(user_storage_file.read_text())
                                    existing_cookies_disk = existing_data.get("cookies", [])
                                    existing_updated_at = str(existing_data.get("notebooklm", {}).get("updatedAt") or "")
                                    if len(existing_cookies_disk) == 0:
                                        needs_write = True
                                    else:
                                        ex_sid = _extract_sid(existing_cookies_disk)
                                        rem_sid = _extract_sid(fetched_cookies)
                                        # Si es la misma sesión (mismo SID o mismo updatedAt) y en disco ya tenemos __Secure-1PSIDTS rotado, NO sobrescribir
                                        if ex_sid and ex_sid == rem_sid and (
                                            _has_psidts(existing_cookies_disk) or existing_updated_at == remote_updated_at
                                        ):
                                            needs_write = False
                                        elif remote_updated_at and existing_updated_at == remote_updated_at:
                                            needs_write = False
                                        else:
                                            old_pairs = {(c.get("name"), c.get("value")) for c in existing_cookies_disk if isinstance(c, dict)}
                                            new_pairs = {(c.get("name"), c.get("value")) for c in fetched_cookies if isinstance(c, dict)}
                                            if old_pairs != new_pairs:
                                                needs_write = True
                                except Exception:
                                    needs_write = True

                            if needs_write:
                                merged_sync_cookies = _merge_preserving_rotated_cookies(fetched_cookies, existing_cookies_disk)
                                sync_data = {
                                    "cookies": merged_sync_cookies,
                                    "origins": [],
                                    "notebooklm": {
                                        "version": 1,
                                        "updatedAt": remote_updated_at,
                                        "account": {
                                            "authuser": 0,
                                        },
                                    },
                                }
                                serialized_sync = json.dumps(sync_data, indent=2)
                                target_profile_dir.mkdir(parents=True, exist_ok=True)
                                user_storage_file.write_text(serialized_sync)
                                try:
                                    os.chmod(user_storage_file, 0o600)
                                except Exception:
                                    pass
                                try:
                                    persist_dir = Path.home() / ".notebooklm" / "profiles" / safe_profile
                                    persist_dir.mkdir(parents=True, exist_ok=True)
                                    (persist_dir / "storage_state.json").write_text(serialized_sync)
                                except Exception:
                                    pass
                                logger.info(f"Sesión sincronizada dinámicamente para '{safe_profile}' desde {base_host} ({len(merged_sync_cookies)} cookies).")
                                await _evict_cached_client(safe_profile)
                        break
            except Exception as ex:
                logger.debug(f"No se pudo consultar {base_host} para sesión de usuario: {ex}")

    # Decidir qué perfil y archivo usar
    selected_profile = safe_profile
    active_storage_file = user_storage_file

    # Aislamiento 100% privado por usuario: nunca hacer fallback a un perfil central compartido
    if not active_storage_file.exists() or active_storage_file.stat().st_size == 0:
        raise RuntimeError(
            "Aún no has vinculado tu cuenta privada de Google NotebookLM. "
            "Para conectarla de forma 100% privada (sin compartir cuadernos con nadie), "
            "ve a Mi Cuenta -> Integraciones -> Google NotebookLM."
        )

    # Garantizar que __Secure-1PSIDTS exista y esté fresco en disco (ejecutando RotateCookies bajo demanda)
    healed = await asyncio.to_thread(_ensure_psidts_ready, active_storage_file, force_reinit)
    if healed:
        await _evict_cached_client(selected_profile)
        if user_id:
            await asyncio.to_thread(_sync_disk_cookies_to_mongo, user_id, user_email, active_storage_file)
    elif force_reinit:
        await _evict_cached_client(selected_profile)

    active_sid = ""
    try:
        active_sid = _extract_sid(json.loads(active_storage_file.read_text()).get("cookies", []))
    except Exception:
        pass

    need_sid_evict = False
    async with _CACHE_LOCK:
        if selected_profile in _CLIENT_CACHE:
            client, old_ctx, cached_sid = _CLIENT_CACHE[selected_profile]
            if not active_sid or active_sid == cached_sid:
                return client
            need_sid_evict = True

    if need_sid_evict:
        logger.info(f"Sesión SID cambiada para '{selected_profile}'. Reinicializando cliente...")
        await _evict_cached_client(selected_profile)

    async with _CACHE_LOCK:
        if selected_profile in _CLIENT_CACHE:
            client, _, _ = _CLIENT_CACHE[selected_profile]
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
        _CLIENT_CACHE[selected_profile] = (client_instance, ctx, active_sid)

    if user_id:
        await asyncio.to_thread(_sync_disk_cookies_to_mongo, user_id, user_email, active_storage_file)

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
    if isinstance(e, FileNotFoundError) or "no such file or directory" in msg.lower():
        raise RuntimeError(
            "El perfil o archivo de sesión para este usuario no se encuentra disponible. "
            "Por favor vincula tu cuenta desde la extensión WAPPY Connect en Chrome o desde Configuración -> Mi Cuenta."
        ) from e
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
    dummy: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """Lista todos los cuadernos disponibles para el usuario actual (incluyendo los compartidos con la cuenta)."""
    try:
        client = await get_client_for_request()
        notebooks = await client.notebooks.list()
        return [
            {
                "id": nb.id,
                "title": nb.title,
                "emoji": getattr(nb, "emoji", ""),
                "sources_count": getattr(nb, "sources_count", 0),
                "updated_at": str(getattr(nb, "modified_at", getattr(nb, "updated_at", "")) or ""),
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
async def notebook_rename(
    notebook: str,
    new_title: Optional[str] = None,
    title: Optional[str] = None,
    emoji: Optional[str] = None,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Cambia el nombre (título) y/o emoji de un cuaderno existente de NotebookLM."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            new_title = input.get("new_title") or input.get("title") or new_title
            emoji = input.get("emoji") or emoji

        final_title = (new_title or title or "").strip()
        if not final_title and not emoji:
            raise ValueError("Debes proporcionar 'new_title' (o 'title') para renombrar el cuaderno.")

        nb = None
        if final_title:
            nb = await client.notebooks.rename(nb_id, final_title)
        if emoji:
            nb = await client.notebooks.set_emoji(nb_id, emoji)

        return {
            "status": "renamed",
            "id": getattr(nb, "id", nb_id),
            "title": getattr(nb, "title", final_title),
            "emoji": getattr(nb, "emoji", emoji or ""),
        }
    except Exception as e:
        _handle_tool_error("notebook_rename", e)


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
                "type": str(getattr(s, "type", "document")),
                "status": str(getattr(s, "status", "ready")),
            }
            for s in sources
        ]
    except Exception as e:
        _handle_tool_error("source_list", e)


@mcp.tool()
async def source_add(
    notebook: str,
    source_type: str = "text",
    url: Optional[str] = None,
    text: Optional[str] = None,
    content: Optional[str] = None,
    title: Optional[str] = None,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Añade una fuente al cuaderno de NotebookLM.
    - source_type='url': Requiere url (enlace web o YouTube).
    - source_type='text': Requiere text (o content) y opcionalmente title.
    """
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)

        if isinstance(input, dict):
            source_type = input.get("source_type") or source_type
            url = input.get("url") or url
            text = input.get("text") or input.get("content") or text
            title = input.get("title") or title

        body_text = text or content
        st = (source_type or ("url" if url else "text")).lower().strip()

        if st == "url" or (url and not body_text):
            if not url:
                raise ValueError("El parámetro 'url' es obligatorio para source_type='url'")
            res = await client.sources.add_url(nb_id, url=url, title=title)
            return {
                "status": "added",
                "source_id": getattr(res, "id", "url_added"),
                "title": getattr(res, "title", title or url),
                "url": url,
            }
        elif st in ("text", "markdown", "note", "document"):
            if not body_text:
                raise ValueError("El parámetro 'text' (o 'content') es obligatorio para source_type='text'")
            final_title = title or "Nota de Agente WAPPY"
            res = await client.sources.add_text(nb_id, title=final_title, content=body_text)
            return {
                "status": "added",
                "source_id": getattr(res, "id", "text_added"),
                "title": getattr(res, "title", final_title),
            }
        else:
            raise ValueError(f"Tipo de fuente no soportado directamente: {source_type}. Usa 'url' o 'text'.")
    except Exception as e:
        _handle_tool_error("source_add", e)


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


def _get_active_user_id() -> str:
    try:
        from fastmcp.server.dependencies import get_http_headers
        try:
            raw_headers = get_http_headers(include_all=True) or {}
        except TypeError:
            raw_headers = get_http_headers() or {}
        headers = {str(k).lower(): str(v) for k, v in raw_headers.items()}
    except Exception:
        headers = {}
    ctx_headers = _CURRENT_USER_CONTEXT.get() or {}
    for ck, cv in ctx_headers.items():
        if cv and ck.lower() not in headers:
            headers[ck.lower()] = cv
    uid = headers.get("x-user-id") or headers.get("x_user_id") or ""
    return "" if uid.startswith("{{") else uid


async def _download_artifact_by_kind(
    client: NotebookLMClient,
    nb_id: str,
    artifact_id: str,
    artifact_type: str = "",
    output_format: Optional[str] = None,
) -> Dict[str, Any]:
    """Descarga cualquier artefacto de NotebookLM (video, audio, infografía, slides, mapa mental, tabla, quiz, flashcards, informe) en /tmp y extrae su contenido si es legible."""
    dl_dir = Path("/tmp/notebooklm_downloads")
    dl_dir.mkdir(parents=True, exist_ok=True)
    t = (artifact_type or "").lower().strip()
    art = None
    try:
        art = await client.artifacts.get_or_none(nb_id, artifact_id)
    except Exception:
        pass

    if not t and art:
        kind_val = str(getattr(art, "kind", getattr(art, "_artifact_type", ""))).lower()
        title_val = str(getattr(art, "title", "")).lower()
        if getattr(art, "infographics", None) or "infog" in kind_val or "infog" in title_val:
            t = "infographic"
        elif getattr(art, "slides", None) or "slide" in kind_val or "present" in title_val:
            t = "slide_deck"
        elif "video" in kind_val or "video" in title_val:
            t = "video"
        elif "audio" in kind_val or "podcast" in title_val:
            t = "audio"
        elif "table" in kind_val or "tabla" in title_val:
            t = "data_table"
        elif "quiz" in kind_val or getattr(art, "is_quiz", False):
            t = "quiz"
        elif "flash" in kind_val:
            t = "flashcards"
        elif "mind" in kind_val or "mapa" in title_val:
            t = "mind_map"
        else:
            t = "report"

    ext_map = {
        "audio": "mp4",
        "podcast": "mp4",
        "video": "mp4",
        "cinematic_video": "mp4",
        "infographic": "png",
        "slide_deck": output_format or "pdf",
        "slides": output_format or "pdf",
        "mind_map": "json",
        "data_table": "csv",
        "quiz": output_format or "markdown",
        "flashcards": output_format or "markdown",
        "report": "md",
        "study_guide": "md",
    }
    ext = ext_map.get(t, "md")
    if ext == "markdown":
        file_ext = "md"
    else:
        file_ext = ext

    out_file = str(dl_dir / f"{nb_id}_{artifact_id}.{file_ext}")
    saved_path = None

    # Si ya fue descargado previamente y está en caché en disco con tamaño válido, reutilizar de inmediato
    cached_file = Path(out_file)
    if artifact_id and artifact_id != "latest" and cached_file.exists() and cached_file.stat().st_size > 100:
        saved_path = str(cached_file)
    else:
        if t in ("audio", "podcast", "audio_overview"):
            saved_path = await client.artifacts.download_audio(nb_id, out_file, artifact_id=artifact_id)
        elif t in ("video", "cinematic_video"):
            saved_path = await client.artifacts.download_video(nb_id, out_file, artifact_id=artifact_id)
        elif t in ("infographic", "infografia", "infografía"):
            saved_path = await client.artifacts.download_infographic(nb_id, out_file, artifact_id=artifact_id)
        elif t in ("slide_deck", "slides", "presentacion", "presentación"):
            saved_path = await client.artifacts.download_slide_deck(
                nb_id, out_file, artifact_id=artifact_id, output_format=output_format or "pdf"
            )
        elif t in ("mind_map", "mindmap", "mapa_conceptual", "mapa"):
            saved_path = await client.artifacts.download_mind_map(nb_id, out_file, artifact_id=artifact_id)
        elif t in ("data_table", "tabla", "tabla_datos", "table"):
            saved_path = await client.artifacts.download_data_table(nb_id, out_file, artifact_id=artifact_id)
        elif t in ("quiz", "cuestionario", "evaluacion", "evaluación"):
            saved_path = await client.artifacts.download_quiz(
                nb_id, out_file, artifact_id=artifact_id, output_format=output_format or "markdown"
            )
        elif t in ("flashcards", "flashcard", "fichas"):
            saved_path = await client.artifacts.download_flashcards(
                nb_id, out_file, artifact_id=artifact_id, output_format=output_format or "markdown"
            )
        else:
            saved_path = await client.artifacts.download_report(nb_id, out_file, artifact_id=artifact_id)

    final_path = Path(saved_path or out_file)
    text_content = None
    if final_path.exists() and final_path.suffix.lower() in (".md", ".json", ".csv", ".txt", ".html"):
        try:
            text_content = final_path.read_text(encoding="utf-8")[:25000]
        except Exception:
            pass

    uid = _get_active_user_id()
    wappy_download_url = f"https://wappy.club/api/notebooklm/download/{nb_id}/{artifact_id}?type={t or 'report'}"
    if uid:
        wappy_download_url += f"&userId={uid}"

    return {
        "saved_to": str(final_path),
        "artifact_type": t or "report",
        "content": text_content,
        "wappy_download_url": wappy_download_url,
        "notebooklm_web_url": f"https://notebook.google.com/notebook/{nb_id}",
        "title": getattr(art, "title", "") if art else "",
        "media_url": getattr(art, "url", None) if art else None,
    }


def _sanitize_preventive_sst_text(raw_text: Optional[str]) -> Optional[str]:
    """Traduce automáticamente términos de siniestralidad o daño físico a lenguaje técnico preventivo SG-SST para evitar rechazos de políticas en Studio."""
    if not raw_text or not str(raw_text).strip():
        return raw_text
    text = str(raw_text).strip()
    rules = [
        (r"\b(accidentes?\s+de\s+trabajo|accidentes?\s+laboral(?:es)?|accidentes?\s+vial(?:es)?|accidentes?\s+en\s+alturas?|accidentes?\s+graves?|accidentes?\s+mortales?|accidentes?)\b", "procedimiento preventivo de seguridad y salud en el trabajo"),
        (r"\b(caídas?\s+de\s+alturas?|caídas?\s+en\s+alturas?|caídas?\s+libres?|caídas?\s+al\s+vacío|caerse|cayendo)\b", "trabajo seguro en alturas con sistema de protección certificado"),
        (r"\b(heridos?|lesionados?|lesiones\s+graves?|lesiones|lesión|fracturas?|golpes?|amputación|atrapamientos?)\b", "protección integral del trabajador con EPP certificado"),
        (r"\b(muertes?|mortal(?:es)?|fatal(?:es)?|fallecidos?|cadáver(?:es)?|peligro\s+de\s+muerte)\b", "estándar crítico de preservación de la vida y bienestar laboral"),
        (r"\b(sangre|hemorragias?|quemaduras?|asfixia|electrocución|descargas?\s+eléctricas?)\b", "protocolo preventivo de seguridad industrial y control de energías peligrosas"),
        (r"\b(incendios?|explosión|explosiones|intoxicación|derrames?\s+tóxicos?)\b", "gestión técnica de prevención de emergencias y manejo seguro de sustancias"),
    ]
    for pattern, repl in rules:
        text = re.sub(pattern, repl, text, flags=re.IGNORECASE)
    return text


@mcp.tool()
async def studio_generate(
    notebook: str,
    artifact_type: str = "audio",
    instructions: Optional[str] = None,
    language: Optional[str] = "es",
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Genera cualquier artefacto del Studio de NotebookLM a partir de las fuentes del cuaderno:
    - 'audio' / 'podcast': Resumen de Audio (Podcast conversacional en español).
    - 'video' / 'cinematic_video': Resumen de Video explicativo con IA (MP4).
    - 'mind_map': Mapa mental interactivo jerárquico (JSON/estructura completa).
    - 'infographic': Infografía visual de alta resolución (PNG).
    - 'slide_deck' / 'slides': Presentación de diapositivas (PDF / PPTX).
    - 'data_table': Tabla estructurada de datos extraídos de las fuentes (CSV / Markdown).
    - 'quiz': Cuestionario de evaluación con respuestas explicadas.
    - 'flashcards': Tarjetas de estudio pregunta/respuesta.
    - 'report' / 'study_guide': Informe ejecutivo o guía de estudio en Markdown.
    Entrega automáticamente el contenido y el enlace directo de descarga ('wappy_download_url') para enviárselo al usuario en el chat.
    """
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)

        if isinstance(input, dict):
            artifact_type = input.get("artifact_type") or artifact_type
            instructions = input.get("instructions") or instructions
            language = input.get("language") or language

        instructions = _sanitize_preventive_sst_text(instructions)

        t = (artifact_type or "").lower().strip()
        uid = _get_active_user_id()

        if t in ("audio", "podcast", "audio_overview"):
            res = await client.artifacts.generate_audio(
                nb_id,
                language=language or "es",
                instructions=instructions,
            )
            norm_type = "audio"
        elif t in ("quiz", "cuestionario", "evaluacion", "evaluación"):
            res = await client.artifacts.generate_quiz(
                nb_id,
                instructions=instructions,
            )
            norm_type = "quiz"
        elif t in ("report", "informe", "resumen", "briefing_doc"):
            res = await client.artifacts.generate_report(
                nb_id,
                language=language or "es",
                custom_prompt=instructions,
            )
            norm_type = "report"
        elif t in ("flashcards", "flashcard", "fichas"):
            res = await client.artifacts.generate_flashcards(
                nb_id,
                instructions=instructions,
            )
            norm_type = "flashcards"
        elif t in ("mind_map", "mindmap", "mapa_conceptual", "mapa"):
            res = await client.artifacts.generate_mind_map(
                nb_id,
                language=language or "es",
                instructions=instructions,
            )
            note_id = getattr(res, "note_id", None)
            mind_map_data = getattr(res, "mind_map", res)
            dl_url = f"https://wappy.club/api/notebooklm/download/{nb_id}/{note_id or 'latest'}?type=mind_map"
            if uid:
                dl_url += f"&userId={uid}"
            return {
                "status": "completed",
                "notebook_id": nb_id,
                "artifact_id": note_id,
                "artifact_type": "mind_map",
                "mind_map": mind_map_data,
                "wappy_download_url": dl_url,
                "notebooklm_web_url": f"https://notebook.google.com/notebook/{nb_id}",
                "message": "Mapa mental generado exitosamente. Presenta la estructura jerárquica al usuario y compártele el enlace de descarga.",
            }
        elif t in ("study_guide", "guia", "guia_estudio", "guía"):
            res = await client.artifacts.generate_study_guide(
                nb_id,
                language=language or "es",
                extra_instructions=instructions,
            )
            norm_type = "report"
        elif t in ("slide_deck", "slides", "presentacion", "presentación"):
            res = await client.artifacts.generate_slide_deck(
                nb_id,
                language=language or "es",
                instructions=instructions,
            )
            norm_type = "slide_deck"
        elif t in ("video", "cinematic_video"):
            if hasattr(client.artifacts, "generate_video"):
                res = await client.artifacts.generate_video(
                    nb_id,
                    language=language or "es",
                    instructions=instructions,
                )
            else:
                res = await client.artifacts.generate_cinematic_video(
                    nb_id,
                    language=language or "es",
                    instructions=instructions,
                )
            norm_type = "video"
        elif t in ("infographic", "infografia", "infografía"):
            res = await client.artifacts.generate_infographic(
                nb_id,
                language=language or "es",
                instructions=instructions,
            )
            norm_type = "infographic"
        elif t in ("data_table", "tabla", "tabla_datos", "table"):
            res = await client.artifacts.generate_data_table(
                nb_id,
                language=language or "es",
                instructions=instructions,
            )
            norm_type = "data_table"
        else:
            raise ValueError(
                f"Tipo de artefacto no reconocido: '{artifact_type}'. "
                "Opciones válidas: audio, quiz, report, flashcards, mind_map, study_guide, slide_deck, video, infographic, data_table."
            )

        task_id = getattr(res, "task_id", getattr(res, "id", str(res)))
        wappy_download_url = f"https://wappy.club/api/notebooklm/download/{nb_id}/{task_id}?type={norm_type}"
        if uid:
            wappy_download_url += f"&userId={uid}"

        # Esperar hasta 65s para infografías/slides/reportes y 20s para audio/video (que toman 3-8 min y el visor del chat monitorea en vivo)
        wait_secs = 65.0 if norm_type not in ("audio", "video") else 20.0
        try:
            waited = await client.artifacts.wait_for_completion(nb_id, task_id, timeout=wait_secs)
            if waited and getattr(waited, "is_complete", False):
                res = waited
        except Exception:
            pass

        is_done = bool(getattr(res, "is_complete", False) or str(getattr(res, "status", "")).lower() in ("completed", "ready", "done"))
        extracted_content = None
        if is_done:
            try:
                dl_info = await _download_artifact_by_kind(client, nb_id, task_id, norm_type)
                extracted_content = dl_info.get("content")
            except Exception as dl_err:
                logger.warning(f"No se pudo pre-descargar artefacto '{task_id}' ({norm_type}): {dl_err}")
        else:
            # Lanzar tarea en segundo plano para pre-descargar el archivo a disco tan pronto Google termine de renderizarlo
            async def _bg_prefetch(c_ref, n_id: str, t_id: str, a_type: str):
                try:
                    w = await c_ref.artifacts.wait_for_completion(n_id, t_id, timeout=600.0)
                    if w and getattr(w, "is_complete", False):
                        await _download_artifact_by_kind(c_ref, n_id, t_id, a_type)
                        logger.info(f"[Studio BG Prefetch] Artefacto '{t_id}' ({a_type}) descargado y cacheado en disco.")
                except Exception as bg_err:
                    logger.debug(f"[Studio BG Prefetch] Fin espera '{t_id}': {bg_err}")

            asyncio.create_task(_bg_prefetch(client, nb_id, task_id, norm_type))

        return {
            "status": "completed" if is_done else "in_progress",
            "task_id": task_id,
            "artifact_id": task_id,
            "notebook_id": nb_id,
            "artifact_type": norm_type,
            "is_complete": is_done,
            "content": extracted_content,
            "wappy_download_url": wappy_download_url,
            "notebooklm_web_url": f"https://notebook.google.com/notebook/{nb_id}",
            "url": getattr(res, "url", None),
            "message": (
                f"¡Artefacto '{norm_type}' completado! Entrégale SIEMPRE al usuario UNA SOLA VEZ el enlace directo en Markdown para que se muestre la tarjeta descargable en el chat (NO dupliques imagen + enlace hacia la misma URL): {wappy_download_url}"
                if is_done
                else f"Generación de '{norm_type}' iniciada en Google NotebookLM Studio (task_id='{task_id}'). "
                     f"IMPORTANTE: Entrégale de inmediato al usuario UNA SOLA VEZ este enlace directo en Markdown (sin duplicar enlaces hacia la misma URL): {wappy_download_url} — el reproductor inteligente de WAPPY monitoreará el progreso automáticamente en el chat y mostrará la tarjeta con botón de descarga apenas termine de renderizarse."
            ),
        }
    except Exception as e:
        _handle_tool_error("studio_generate", e)


@mcp.tool()
async def studio_status(
    task_id: str,
    notebook: Optional[str] = None,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Consulta el estado de una generación en el Studio de NotebookLM y devuelve su enlace directo de descarga."""
    client = await get_client_for_request()

    if isinstance(input, dict):
        task_id = input.get("task_id") or task_id
        notebook = input.get("notebook") or notebook

    uid = _get_active_user_id()
    target_nb_id = None
    if notebook:
        target_nb_id = await _resolve_notebook_id(client, notebook)

    candidate_nbs = [target_nb_id] if target_nb_id else [nb.id for nb in await client.notebooks.list()]
    for nb_id in candidate_nbs:
        if not nb_id:
            continue
        try:
            res = await client.artifacts.poll_status(nb_id, task_id)
            if res and getattr(res, "status", "") not in ("not_found", ""):
                is_done = bool(getattr(res, "is_complete", False) or str(getattr(res, "status", "")).lower() in ("completed", "ready", "done"))
                dl_url = f"https://wappy.club/api/notebooklm/download/{nb_id}/{task_id}"
                if uid:
                    dl_url += f"?userId={uid}"
                return {
                    "status": getattr(res, "status", "completed" if is_done else "in_progress"),
                    "task_id": task_id,
                    "notebook_id": nb_id,
                    "url": getattr(res, "url", None),
                    "wappy_download_url": dl_url,
                    "notebooklm_web_url": f"https://notebook.google.com/notebook/{nb_id}",
                    "is_complete": is_done,
                    "error": getattr(res, "error", None),
                }
        except Exception:
            continue

    return {"status": "not_found", "task_id": task_id, "message": "No se encontró la tarea especificada."}


@mcp.tool()
async def studio_download(
    artifact_id: str,
    notebook: Optional[str] = None,
    artifact_type: Optional[str] = None,
    output_format: Optional[str] = None,
    output_path: Optional[str] = None,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Descarga y entrega cualquier artefacto generado en NotebookLM (video MP4, podcast/audio MP4,
    infografía PNG, presentación PDF/PPTX, mapa mental JSON, tabla CSV, cuestionario, fichas o informe Markdown).
    Retorna tanto el contenido legible ('content') como el enlace directo de descarga ('wappy_download_url')
    para que el usuario pueda descargarlo desde el chat con 1 clic.
    """
    client = await get_client_for_request()

    if isinstance(input, dict):
        artifact_id = input.get("artifact_id") or artifact_id
        notebook = input.get("notebook") or notebook
        artifact_type = input.get("artifact_type") or input.get("type") or artifact_type
        output_format = input.get("output_format") or input.get("format") or output_format
        output_path = input.get("output_path") or output_path

    target_nb_id = None
    if notebook:
        target_nb_id = await _resolve_notebook_id(client, notebook)

    try:
        candidate_nbs = [target_nb_id] if target_nb_id else [nb.id for nb in await client.notebooks.list()]
        for nb_id in candidate_nbs:
            if not nb_id:
                continue
            try:
                dl_info = await _download_artifact_by_kind(
                    client,
                    nb_id,
                    artifact_id,
                    artifact_type=artifact_type or "",
                    output_format=output_format,
                )
                return {
                    "status": "ready",
                    "artifact_id": artifact_id,
                    "notebook_id": nb_id,
                    **dl_info,
                }
            except Exception as inner_err:
                logger.debug(f"Intento de descarga en '{nb_id}' falló: {inner_err}")
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
    new_title: Optional[str] = None,
    auto_import: bool = True,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Inicia una investigación web (Deep Research) y por defecto importa automáticamente
    las fuentes encontradas directamente dentro del cuaderno de NotebookLM.
    Opcionalmente puede renombrar el cuaderno si se indica 'new_title'.
    """
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            query = input.get("query") or query
            mode = input.get("mode") or mode
            new_title = input.get("new_title") or input.get("title") or new_title
            if "auto_import" in input:
                auto_import = bool(input.get("auto_import"))

        renamed_to = None
        if new_title and str(new_title).strip():
            try:
                nb_obj = await client.notebooks.rename(nb_id, str(new_title).strip())
                renamed_to = getattr(nb_obj, "title", str(new_title).strip())
            except Exception as re_err:
                logger.warning(f"No se pudo renombrar cuaderno en research_start: {re_err}")

        res = await client.research.start(nb_id, query=query, source="web", mode=mode or "fast")
        task_id = getattr(res, "task_id", getattr(res, "id", str(res)))

        imported_sources = []
        if auto_import:
            try:
                task = await client.research.wait_for_completion(nb_id, task_id=task_id, timeout=40)
                discovered = list(getattr(task, "sources", []) or [])
                if discovered:
                    imported = await client.research.import_sources(
                        nb_id,
                        task_id=task_id,
                        sources=discovered,
                    )
                    imported_sources = [
                        {"id": s.get("id", ""), "title": s.get("title", "")}
                        for s in (imported or [])
                        if isinstance(s, dict)
                    ]
                    if not imported_sources:
                        imported_sources = [
                            {"url": getattr(s, "url", ""), "title": getattr(s, "title", "")}
                            for s in discovered
                        ]
            except Exception as imp_err:
                logger.warning(f"Auto-import en research_start no completó a tiempo (task_id={task_id}): {imp_err}")

        if imported_sources:
            return {
                "status": "completed_and_imported",
                "notebook_id": nb_id,
                "renamed_to": renamed_to,
                "task_id": task_id,
                "imported_count": len(imported_sources),
                "imported_sources": imported_sources,
                "message": f"Investigación completada e importadas {len(imported_sources)} fuentes web directamente al cuaderno.",
            }

        return {
            "status": "started",
            "notebook_id": nb_id,
            "renamed_to": renamed_to,
            "task_id": task_id,
            "message": f"Investigación web iniciada (task_id='{task_id}'). Ejecuta research_import(notebook='{nb_id}', task_id='{task_id}') para importar las fuentes.",
        }
    except Exception as e:
        _handle_tool_error("research_start", e)


@mcp.tool()
async def research_import(
    notebook: str,
    task_id: str,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Importa los resultados de una investigación web como nuevas fuentes reales del cuaderno."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            task_id = input.get("task_id") or task_id
            notebook = input.get("notebook") or notebook

        task = await client.research.poll(nb_id, task_id)
        discovered = list(getattr(task, "sources", []) or [])
        if not discovered:
            task = await client.research.wait_for_completion(nb_id, task_id=task_id, timeout=35)
            discovered = list(getattr(task, "sources", []) or [])

        if not discovered:
            return {
                "status": "no_sources_found",
                "notebook_id": nb_id,
                "task_id": task_id,
                "imported_count": 0,
                "message": "La tarea de investigación aún no reporta fuentes o no encontró resultados.",
            }

        res = await client.research.import_sources(nb_id, task_id=task_id, sources=discovered)
        return {
            "status": "imported",
            "notebook_id": nb_id,
            "task_id": task_id,
            "imported_count": len(res or discovered),
            "result": res,
        }
    except Exception as e:
        _handle_tool_error("research_import", e)


# =============================================================================
# HERRAMIENTAS AVANZADAS DE CUADERNOS, FUENTES, NOTAS, STUDIO Y COMPARTICIÓN
# =============================================================================

@mcp.tool()
async def notebook_get_summary(
    notebook: str,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Obtiene el resumen ejecutivo automático, descripción y temas sugeridos por Gemini para todo el cuaderno."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        summary = await client.notebooks.get_summary(nb_id)
        desc_obj = None
        try:
            desc_obj = await client.notebooks.get_description(nb_id)
        except Exception:
            pass
        return {
            "notebook_id": nb_id,
            "summary": summary,
            "description": str(getattr(desc_obj, "description", desc_obj or "")),
            "suggested_topics": [
                str(getattr(t, "topic", getattr(t, "title", t)))
                for t in (getattr(desc_obj, "suggested_topics", []) or [])
            ],
        }
    except Exception as e:
        _handle_tool_error("notebook_get_summary", e)


@mcp.tool()
async def notebook_suggest_prompts(
    notebook: str,
    query: Optional[str] = None,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Obtiene preguntas de investigación y próximos pasos sugeridos automáticamente por NotebookLM según las fuentes del cuaderno."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            query = input.get("query") or query

        prompts = []
        next_steps = []
        try:
            raw_prompts = await client.notebooks.suggest_prompts(nb_id, query=query)
            prompts = [str(getattr(p, "prompt", getattr(p, "text", p))) for p in (raw_prompts or [])]
        except Exception:
            pass
        try:
            raw_steps = await client.notebooks.suggest_next_steps(nb_id)
            next_steps = [str(getattr(s, "title", getattr(s, "prompt", s))) for s in (raw_steps or [])]
        except Exception:
            pass

        return {
            "notebook_id": nb_id,
            "suggested_prompts": prompts,
            "suggested_next_steps": next_steps,
        }
    except Exception as e:
        _handle_tool_error("notebook_suggest_prompts", e)


@mcp.tool()
async def notebook_copy(
    notebook: str,
    new_title: str,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Duplica (clona) un cuaderno completo de NotebookLM con todas sus fuentes bajo un nuevo título."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            new_title = input.get("new_title") or input.get("title") or new_title
        copied = await client.notebooks.copy(nb_id, title=new_title)
        return {
            "status": "copied",
            "source_notebook_id": nb_id,
            "new_notebook_id": getattr(copied, "id", ""),
            "title": getattr(copied, "title", new_title),
        }
    except Exception as e:
        _handle_tool_error("notebook_copy", e)


@mcp.tool()
async def notebook_delete(
    notebook: str,
    confirm: bool = False,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Elimina un cuaderno de NotebookLM. Requiere confirm=True explícitamente."""
    try:
        if isinstance(input, dict) and "confirm" in input:
            confirm = bool(input.get("confirm"))
        if not confirm:
            return {
                "status": "confirmation_required",
                "message": "Por seguridad, para eliminar un cuaderno debes invocar notebook_delete con confirm=True tras autorización explícita del usuario.",
            }
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        await client.notebooks.delete(nb_id)
        return {"status": "deleted", "notebook_id": nb_id}
    except Exception as e:
        _handle_tool_error("notebook_delete", e)


@mcp.tool()
async def notebook_share(
    notebook: str,
    action: str = "status",
    email: Optional[str] = None,
    role: str = "viewer",
    public: Optional[bool] = None,
    welcome_message: str = "",
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Gestiona la compartición de un cuaderno de NotebookLM:
    - action='status': Obtiene el estado de compartición y enlace para compartir.
    - action='set_public': Activa o desactiva acceso por enlace público (public=True/False).
    - action='add_user': Comparte el cuaderno con un correo (email, role='viewer'|'editor').
    - action='remove_user': Revoca el acceso a un correo (email).
    """
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            action = input.get("action") or action
            email = input.get("email") or email
            role = input.get("role") or role
            if "public" in input:
                public = bool(input.get("public"))
            welcome_message = input.get("welcome_message") or welcome_message

        act = (action or "status").lower().strip()
        share_url = ""
        try:
            share_url = await client.notebooks.get_share_url(nb_id)
        except Exception:
            share_url = f"https://notebook.google.com/notebook/{nb_id}"

        if act == "set_public":
            status = await client.sharing.set_public(nb_id, bool(public if public is not None else True))
            return {"status": "updated_public", "notebook_id": nb_id, "share_url": share_url, "details": str(status)}
        elif act == "add_user":
            if not email:
                raise ValueError("El parámetro 'email' es obligatorio para action='add_user'.")
            from notebooklm.types import SharePermission
            perm = SharePermission.EDITOR if "edit" in role.lower() else SharePermission.VIEWER
            status = await client.sharing.add_user(nb_id, email=email, permission=perm, notify=True, welcome_message=welcome_message)
            return {"status": "user_added", "notebook_id": nb_id, "email": email, "role": role, "share_url": share_url, "details": str(status)}
        elif act == "remove_user":
            if not email:
                raise ValueError("El parámetro 'email' es obligatorio para action='remove_user'.")
            status = await client.sharing.remove_user(nb_id, email=email)
            return {"status": "user_removed", "notebook_id": nb_id, "email": email, "details": str(status)}
        else:
            status = await client.sharing.get_status(nb_id)
            return {"status": "ok", "notebook_id": nb_id, "share_url": share_url, "details": str(status)}
    except Exception as e:
        _handle_tool_error("notebook_share", e)


@mcp.tool()
async def source_add_file(
    notebook: str,
    file_path: str,
    title: Optional[str] = None,
    mime_type: Optional[str] = None,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Sube un archivo local (PDF, TXT, Markdown, Audio, etc.) como fuente directa del cuaderno."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            file_path = input.get("file_path") or file_path
            title = input.get("title") or title
            mime_type = input.get("mime_type") or mime_type
        src = await client.sources.add_file(nb_id, file_path=file_path, mime_type=mime_type, title=title, wait=True)
        return {
            "status": "added",
            "notebook_id": nb_id,
            "source_id": getattr(src, "id", ""),
            "title": getattr(src, "title", title or file_path),
        }
    except Exception as e:
        _handle_tool_error("source_add_file", e)


@mcp.tool()
async def source_add_drive(
    notebook: str,
    file_id: str,
    title: Optional[str] = None,
    mime_type: str = "application/vnd.google-apps.document",
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Vincula un documento de Google Drive (Docs, Slides, PDF) directamente al cuaderno usando su file_id."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            file_id = input.get("file_id") or input.get("document_id") or file_id
            title = input.get("title") or title
            mime_type = input.get("mime_type") or mime_type
        src = await client.sources.add_drive(nb_id, file_id=file_id, title=title or "Documento de Drive", mime_type=mime_type, wait=True)
        return {
            "status": "added",
            "notebook_id": nb_id,
            "source_id": getattr(src, "id", ""),
            "title": getattr(src, "title", title or file_id),
        }
    except Exception as e:
        _handle_tool_error("source_add_drive", e)


@mcp.tool()
async def source_add_urls_batch(
    notebook: str,
    urls: List[str],
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Agrega múltiples URLs web o de YouTube simultáneamente en lote a un cuaderno."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict) and input.get("urls"):
            urls = input.get("urls")
        outcomes = await client.sources.add_urls_batch(nb_id, urls=urls)
        return {
            "status": "batch_completed",
            "notebook_id": nb_id,
            "requested_count": len(urls),
            "outcomes": [str(o) for o in (outcomes or [])],
        }
    except Exception as e:
        _handle_tool_error("source_add_urls_batch", e)


@mcp.tool()
async def source_get_fulltext(
    notebook: str,
    source_id: str,
    output_format: str = "markdown",
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Extrae el texto completo indexado de una fuente específica del cuaderno (PDF, web, YouTube o documento)."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            source_id = input.get("source_id") or source_id
            output_format = input.get("output_format") or output_format
        fmt = "markdown" if output_format == "markdown" else "text"
        ft = await client.sources.get_fulltext(nb_id, source_id, output_format=fmt)
        return {
            "notebook_id": nb_id,
            "source_id": source_id,
            "title": getattr(ft, "title", ""),
            "content": getattr(ft, "content", getattr(ft, "text", str(ft))),
        }
    except Exception as e:
        _handle_tool_error("source_get_fulltext", e)


@mcp.tool()
async def source_get_guide(
    notebook: str,
    source_id: str,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Obtiene la guía de lectura, resumen individual y temas clave generados por Gemini para una fuente específica."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            source_id = input.get("source_id") or source_id
        guide = await client.sources.get_guide(nb_id, source_id)
        return {
            "notebook_id": nb_id,
            "source_id": source_id,
            "summary": getattr(guide, "summary", str(guide)),
            "keywords": getattr(guide, "keywords", []),
        }
    except Exception as e:
        _handle_tool_error("source_get_guide", e)


@mcp.tool()
async def source_search(
    notebook: str,
    query: str,
    limit: int = 10,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Busca pasajes y fragmentos específicos dentro de las fuentes del cuaderno."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            query = input.get("query") or query
            limit = int(input.get("limit") or limit)
        chunks = await client.sources.search(nb_id, query=query, limit=limit)
        return {
            "notebook_id": nb_id,
            "query": query,
            "results": [
                {
                    "source_id": getattr(c, "source_id", ""),
                    "text": getattr(c, "text", getattr(c, "content", str(c))),
                    "score": getattr(c, "score", None),
                }
                for c in (chunks or [])
            ],
        }
    except Exception as e:
        _handle_tool_error("source_search", e)


@mcp.tool()
async def source_rename(
    notebook: str,
    source_id: str,
    new_title: str,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Cambia el título de una fuente específica dentro del cuaderno."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            source_id = input.get("source_id") or source_id
            new_title = input.get("new_title") or input.get("title") or new_title
        src = await client.sources.rename(nb_id, source_id, new_title)
        return {
            "status": "renamed",
            "notebook_id": nb_id,
            "source_id": source_id,
            "title": getattr(src, "title", new_title),
        }
    except Exception as e:
        _handle_tool_error("source_rename", e)


@mcp.tool()
async def source_append_text(
    notebook: str,
    source_id: str,
    text: str,
    header: str = "",
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Anexa texto adicional a una fuente de texto existente en el cuaderno."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            source_id = input.get("source_id") or source_id
            text = input.get("text") or input.get("content") or text
            header = input.get("header") or header
        await client.sources.append_text(nb_id, source_id, text, header=header)
        return {"status": "appended", "notebook_id": nb_id, "source_id": source_id}
    except Exception as e:
        _handle_tool_error("source_append_text", e)


@mcp.tool()
async def source_refresh(
    notebook: str,
    source_id: str,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Actualiza/resincroniza el contenido de una fuente (Drive o URL) con su documento original."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            source_id = input.get("source_id") or source_id
        await client.sources.refresh(nb_id, source_id)
        return {"status": "refreshed", "notebook_id": nb_id, "source_id": source_id}
    except Exception as e:
        _handle_tool_error("source_refresh", e)


@mcp.tool()
async def source_delete(
    notebook: str,
    source_id: str,
    confirm: bool = False,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Elimina una fuente de un cuaderno. Requiere confirm=True explícitamente."""
    try:
        if isinstance(input, dict):
            source_id = input.get("source_id") or source_id
            if "confirm" in input:
                confirm = bool(input.get("confirm"))
        if not confirm:
            return {
                "status": "confirmation_required",
                "message": "Por seguridad, para eliminar una fuente debes invocar source_delete con confirm=True.",
            }
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        await client.sources.delete(nb_id, source_id)
        return {"status": "deleted", "notebook_id": nb_id, "source_id": source_id}
    except Exception as e:
        _handle_tool_error("source_delete", e)


@mcp.tool()
async def note_list(
    notebook: str,
    input: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """Lista todas las notas guardadas dentro de un cuaderno de NotebookLM."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        notes = await client.notes.list(nb_id)
        return [
            {
                "id": getattr(n, "id", ""),
                "title": getattr(n, "title", ""),
                "content": getattr(n, "content", ""),
            }
            for n in (notes or [])
        ]
    except Exception as e:
        _handle_tool_error("note_list", e)


@mcp.tool()
async def note_create(
    notebook: str,
    title: str,
    content: str,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Crea una nueva nota escrita dentro del cuaderno de NotebookLM."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            title = input.get("title") or title
            content = input.get("content") or input.get("text") or content
        note = await client.notes.create(nb_id, title=title or "Nota WAPPY", content=content or "")
        return {
            "status": "created",
            "notebook_id": nb_id,
            "note_id": getattr(note, "id", ""),
            "title": getattr(note, "title", title),
        }
    except Exception as e:
        _handle_tool_error("note_create", e)


@mcp.tool()
async def note_update(
    notebook: str,
    note_id: str,
    title: str,
    content: str,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Actualiza el título y contenido de una nota existente en el cuaderno."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            note_id = input.get("note_id") or note_id
            title = input.get("title") or title
            content = input.get("content") or input.get("text") or content
        await client.notes.update(nb_id, note_id=note_id, content=content, title=title)
        return {"status": "updated", "notebook_id": nb_id, "note_id": note_id, "title": title}
    except Exception as e:
        _handle_tool_error("note_update", e)


@mcp.tool()
async def note_delete(
    notebook: str,
    note_id: str,
    confirm: bool = False,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Elimina una nota del cuaderno. Requiere confirm=True."""
    try:
        if isinstance(input, dict):
            note_id = input.get("note_id") or note_id
            if "confirm" in input:
                confirm = bool(input.get("confirm"))
        if not confirm:
            return {"status": "confirmation_required", "message": "Requiere confirm=True para eliminar la nota."}
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        await client.notes.delete(nb_id, note_id)
        return {"status": "deleted", "notebook_id": nb_id, "note_id": note_id}
    except Exception as e:
        _handle_tool_error("note_delete", e)


@mcp.tool()
async def chat_configure(
    notebook: str,
    custom_prompt: Optional[str] = None,
    response_length: Optional[str] = None,
    action: str = "configure",
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Configura el comportamiento del chat del cuaderno (custom_prompt, response_length='default'|'shorter'|'longer')
    o consulta el historial de conversación del cuaderno (action='history').
    """
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            custom_prompt = input.get("custom_prompt") or custom_prompt
            response_length = input.get("response_length") or response_length
            action = input.get("action") or action

        if (action or "").lower() == "history":
            history = await client.chat.get_history(nb_id, limit=50)
            return {"notebook_id": nb_id, "history": history}

        from notebooklm.types import ChatResponseLength
        length_enum = None
        if response_length:
            rl = response_length.lower()
            if "short" in rl or "cort" in rl:
                length_enum = ChatResponseLength.SHORTER
            elif "long" in rl or "larg" in rl:
                length_enum = ChatResponseLength.LONGER
            else:
                length_enum = ChatResponseLength.DEFAULT

        await client.chat.configure(nb_id, response_length=length_enum, custom_prompt=custom_prompt)
        return {
            "status": "configured",
            "notebook_id": nb_id,
            "custom_prompt": custom_prompt,
            "response_length": response_length or "default",
        }
    except Exception as e:
        _handle_tool_error("chat_configure", e)


@mcp.tool()
async def studio_export(
    notebook: str,
    artifact_id: str,
    title: str = "Exportación WAPPY SST",
    export_to: str = "docs",
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Exporta un informe o tabla de datos generada en el Studio directamente a Google Docs ('docs') o Google Sheets ('sheets')."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            artifact_id = input.get("artifact_id") or artifact_id
            title = input.get("title") or title
            export_to = input.get("export_to") or export_to

        if "sheet" in (export_to or "").lower() or "tabla" in (export_to or "").lower():
            res = await client.artifacts.export_data_table(nb_id, artifact_id=artifact_id, title=title)
        else:
            res = await client.artifacts.export_report(nb_id, artifact_id=artifact_id, title=title)
        return {
            "status": "exported",
            "notebook_id": nb_id,
            "artifact_id": artifact_id,
            "title": title,
            "result": str(res),
        }
    except Exception as e:
        _handle_tool_error("studio_export", e)


@mcp.tool()
async def studio_revise_slide(
    notebook: str,
    artifact_id: str,
    slide_index: int,
    prompt: str,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """Revisa y modifica una diapositiva específica (slide_index) de una presentación generada en el Studio usando una instrucción (prompt)."""
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            artifact_id = input.get("artifact_id") or artifact_id
            slide_index = int(input.get("slide_index") if input.get("slide_index") is not None else slide_index)
            prompt = input.get("prompt") or prompt
        res = await client.artifacts.revise_slide(nb_id, artifact_id=artifact_id, slide_index=slide_index, prompt=prompt)
        return {
            "status": getattr(res, "status", "in_progress"),
            "notebook_id": nb_id,
            "artifact_id": artifact_id,
            "slide_index": slide_index,
        }
    except Exception as e:
        _handle_tool_error("studio_revise_slide", e)


@mcp.tool()
async def studio_manage(
    notebook: str,
    artifact_id: str,
    action: str = "rename",
    new_title: Optional[str] = None,
    confirm: bool = False,
    input: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Gestiona un artefacto existente del Studio:
    - action='rename': Cambia el título del artefacto (new_title).
    - action='retry': Reintenta un artefacto cuya generación haya fallado.
    - action='delete': Elimina el artefacto (requiere confirm=True).
    """
    try:
        client = await get_client_for_request()
        nb_id = await _resolve_notebook_id(client, notebook)
        if isinstance(input, dict):
            artifact_id = input.get("artifact_id") or artifact_id
            action = input.get("action") or action
            new_title = input.get("new_title") or input.get("title") or new_title
            if "confirm" in input:
                confirm = bool(input.get("confirm"))

        act = (action or "rename").lower().strip()
        if act == "rename":
            if not new_title:
                raise ValueError("Se requiere 'new_title' para action='rename'.")
            art = await client.artifacts.rename(nb_id, artifact_id, new_title)
            return {"status": "renamed", "notebook_id": nb_id, "artifact_id": artifact_id, "title": getattr(art, "title", new_title)}
        elif act == "retry":
            res = await client.artifacts.retry_failed(nb_id, artifact_id)
            return {"status": "retried", "notebook_id": nb_id, "artifact_id": artifact_id, "details": str(res)}
        elif act == "delete":
            if not confirm:
                return {"status": "confirmation_required", "message": "Requiere confirm=True para eliminar un artefacto del Studio."}
            await client.artifacts.delete(nb_id, artifact_id)
            return {"status": "deleted", "notebook_id": nb_id, "artifact_id": artifact_id}
        else:
            raise ValueError(f"Acción no soportada en studio_manage: {action}")
    except Exception as e:
        _handle_tool_error("studio_manage", e)


# =============================================================================
# ENDPOINT HTTP DIRECTO PARA TENSHI / SERVICIOS INTERNOS
# =============================================================================

from starlette.requests import Request
from starlette.responses import JSONResponse

@mcp.custom_route("/api/refresh-cookies", methods=["POST"])
async def refresh_cookies_handler(request: Request) -> JSONResponse:
    """
    Endpoint interno bajo demanda para refrescar __Secure-1PSIDTS y SIDCC
    usando las Master Cookies (SID, OSID, SAPISID) tanto para NotebookLM como para Google Flow.
    """
    try:
        body = await request.json()
        user_id = str(body.get("user_id") or request.headers.get("x-user-id") or "").strip()
        user_email = str(body.get("email") or request.headers.get("x-user-email") or "").strip()
        incoming_cookies = body.get("cookies") or []

        safe_profile = f"user_{''.join(c for c in user_id if c.isalnum() or c in ('_', '-'))}" if user_id else "default"
        target_profile_dir = PROFILES_DIR / safe_profile
        target_profile_dir.mkdir(parents=True, exist_ok=True)
        user_storage_file = target_profile_dir / "storage_state.json"

        if incoming_cookies and isinstance(incoming_cookies, list):
            normalized_inc = [_normalize_cookie(c) for c in incoming_cookies if isinstance(c, dict) and c.get("name") and c.get("value")]
            existing_cookies: List[Dict[str, Any]] = []
            prev_last_rotated = 0.0
            if user_storage_file.exists() and user_storage_file.stat().st_size > 0:
                try:
                    existing_doc = json.loads(user_storage_file.read_text())
                    existing_cookies = existing_doc.get("cookies", [])
                    prev_last_rotated = float(existing_doc.get("notebooklm", {}).get("lastRotatedAt", 0) or 0)
                except Exception:
                    pass
            merged = _merge_preserving_rotated_cookies(normalized_inc, existing_cookies)
            from datetime import datetime, timezone
            storage_data = {
                "cookies": merged,
                "origins": [],
                "notebooklm": {
                    "version": 1,
                    "updatedAt": datetime.now(timezone.utc).isoformat(),
                    "lastRotatedAt": prev_last_rotated,
                    "account": {
                        "authuser": 0,
                    },
                },
            }
            user_storage_file.write_text(json.dumps(storage_data, indent=2))

        force_flag = bool(body.get("force", False))
        healed = await asyncio.to_thread(_ensure_psidts_ready, user_storage_file, force_flag)
        if healed:
            await _evict_cached_client(safe_profile)
            if user_id:
                await asyncio.to_thread(_sync_disk_cookies_to_mongo, user_id, user_email, user_storage_file)

        final_cookies: List[Dict[str, Any]] = []
        if user_storage_file.exists() and user_storage_file.stat().st_size > 0:
            try:
                final_cookies = json.loads(user_storage_file.read_text()).get("cookies", [])
            except Exception:
                pass

        return JSONResponse({
            "success": True,
            "healed": healed,
            "cookies": final_cookies,
            "hasPsidts": _has_psidts(final_cookies),
        })
    except Exception as e:
        logger.error(f"[Refresh Cookies] Error: {e}", exc_info=True)
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@mcp.custom_route("/api/direct-tool", methods=["POST"])
async def direct_tool_handler(request: Request) -> JSONResponse:
    """
    Permite a Tenshi (Voz y Asistente WAPPY) y llamadas internas ejecutar
    herramientas de NotebookLM directamente por HTTP POST sin necesidad
    del ciclo de vida completo de SSE/Streamable-HTTP de MCP.
    """
    try:
        body = await request.json()
        tool_name = body.get("name") or body.get("tool") or ""
        raw_args = body.get("arguments") or body.get("args") or {}
        tool_args = dict(raw_args) if isinstance(raw_args, dict) else {}

        # Mapeo de las 35 herramientas disponibles
        tools_map = {
            "notebook_list": notebook_list,
            "notebook_create": notebook_create,
            "notebook_rename": notebook_rename,
            "notebook_get_summary": notebook_get_summary,
            "notebook_suggest_prompts": notebook_suggest_prompts,
            "notebook_copy": notebook_copy,
            "notebook_delete": notebook_delete,
            "notebook_share": notebook_share,
            "source_list": source_list,
            "source_add": source_add,
            "source_add_file": source_add_file,
            "source_add_drive": source_add_drive,
            "source_add_urls_batch": source_add_urls_batch,
            "source_get_fulltext": source_get_fulltext,
            "source_get_guide": source_get_guide,
            "source_search": source_search,
            "source_rename": source_rename,
            "source_append_text": source_append_text,
            "source_refresh": source_refresh,
            "source_delete": source_delete,
            "note_list": note_list,
            "note_create": note_create,
            "note_update": note_update,
            "note_delete": note_delete,
            "chat_ask": chat_ask,
            "chat_configure": chat_configure,
            "studio_generate": studio_generate,
            "studio_status": studio_status,
            "studio_download": studio_download,
            "studio_list": studio_list,
            "studio_export": studio_export,
            "studio_revise_slide": studio_revise_slide,
            "studio_manage": studio_manage,
            "research_start": research_start,
            "research_import": research_import,
        }

        func = tools_map.get(tool_name)
        if not func:
            return JSONResponse(
                {"error": f"Herramienta '{tool_name}' no soportada en endpoint directo."},
                status_code=400,
            )

        # Normalizar alias comunes en español enviados por Tenshi Voice / Gemini Live
        alias_map = {
            "cuaderno": "notebook",
            "pregunta": "query",
            "consulta": "query",
            "titulo": "title",
            "nuevo_titulo": "new_title",
            "tipo_artefacto": "artifact_type",
            "instrucciones": "instructions",
            "tipo_fuente": "source_type",
            "texto": "text",
            "modo": "mode",
        }
        for es_key, en_key in alias_map.items():
            if es_key in tool_args and en_key not in tool_args:
                tool_args[en_key] = tool_args.pop(es_key)

        tool_args.pop("dummy", None)

        # Filtrar argumentos contra la firma real de la función para evitar TypeError por kwargs inesperados
        import inspect
        sig = inspect.signature(func)
        accepts_var_kw = any(p.kind == inspect.Parameter.VAR_KEYWORD for p in sig.parameters.values())
        if not accepts_var_kw:
            tool_args = {k: v for k, v in tool_args.items() if k in sig.parameters}

        # Propagar cabeceras y user_id mediante ContextVar para get_client_for_request()
        ctx_dict = {}
        for k, v in request.headers.items():
            ctx_dict[k.lower()] = v
        if body.get("user_id"):
            ctx_dict["x-user-id"] = str(body["user_id"])
        if body.get("user_email"):
            ctx_dict["x-user-email"] = str(body["user_email"])

        token = _CURRENT_USER_CONTEXT.set(ctx_dict)
        try:
            try:
                result = await func(**tool_args)
            except Exception as first_err:
                err_lower = str(first_err).lower()
                if any(t in err_lower for t in ("autenticación", "csrf", "snlm0e", "401", "403", "cookie", "expired", "caducado")):
                    logger.info(f"[Direct Tool] Reintentando '{tool_name}' tras rotación forzada de PSIDTS...")
                    await get_client_for_request(force_reinit=True)
                    result = await func(**tool_args)
                else:
                    raise
            return JSONResponse({"success": True, "result": result})
        finally:
            _CURRENT_USER_CONTEXT.reset(token)
    except Exception as e:
        logger.error(f"[Direct Tool] Error ejecutando '{tool_name}': {e}", exc_info=True)
        return JSONResponse({"error": str(e)}, status_code=500)


@mcp.custom_route("/api/download-artifact", methods=["GET"])
async def download_artifact_route(request: Request):
    """Descarga binaria directa (o consulta de estado con status_only=1) de cualquier artefacto generado en NotebookLM."""
    from starlette.responses import FileResponse
    try:
        nb_id = request.query_params.get("notebook_id") or ""
        artifact_id = request.query_params.get("artifact_id") or ""
        art_type = request.query_params.get("type") or ""
        out_format = request.query_params.get("format") or None
        status_only = request.query_params.get("status_only") == "1"
        force_download = request.query_params.get("download") == "1"
        user_id = request.query_params.get("user_id") or request.headers.get("x-user-id") or ""

        if not nb_id or not artifact_id:
            return JSONResponse({"error": "notebook_id y artifact_id son obligatorios"}, status_code=400)

        ctx_dict = {k.lower(): v for k, v in request.headers.items()}
        if user_id:
            ctx_dict["x-user-id"] = str(user_id)

        token = _CURRENT_USER_CONTEXT.set(ctx_dict)
        try:
            # Si es solo consulta de estado, verificar primero si ya existe en caché en disco
            if status_only:
                dl_dir = Path("/tmp/notebooklm_downloads")
                if artifact_id != "latest" and dl_dir.exists():
                    matches = list(dl_dir.glob(f"*_{artifact_id}.*"))
                    for m in matches:
                        if m.exists() and m.stat().st_size > 100:
                            return JSONResponse({
                                "ready": True,
                                "status": "completed",
                                "cached": True,
                                "size_bytes": m.stat().st_size,
                            })

                client = await get_client_for_request()
                resolved_nb = await _resolve_notebook_id(client, nb_id)
                arts = await client.artifacts.list(resolved_nb)
                target_art = None
                for a in (arts or []):
                    if artifact_id == "latest" or str(getattr(a, "id", "")) == str(artifact_id):
                        target_art = a
                        break

                if not target_art:
                    return JSONResponse({
                        "ready": False,
                        "status": "in_progress",
                        "message": "El artefacto se está inicializando en Google NotebookLM Studio...",
                    })

                is_ready = bool(getattr(target_art, "is_completed", False) or getattr(target_art, "status", 0) == 3)
                status_str = str(getattr(target_art, "status_str", "completed" if is_ready else "in_progress"))
                return JSONResponse({
                    "ready": is_ready,
                    "status": "completed" if is_ready else status_str,
                    "title": getattr(target_art, "title", ""),
                    "duration_seconds": getattr(target_art, "duration_seconds", None),
                })

            client = await get_client_for_request()
            resolved_nb = await _resolve_notebook_id(client, nb_id)
            try:
                dl_info = await _download_artifact_by_kind(
                    client,
                    resolved_nb,
                    None if artifact_id == "latest" else artifact_id,
                    artifact_type=art_type,
                    output_format=out_format,
                )
            except Exception as dl_exc:
                err_msg = str(dl_exc)
                if "is not ready" in err_msg.lower() or "notready" in type(dl_exc).__name__.lower():
                    return JSONResponse(
                        {
                            "ready": False,
                            "status": "in_progress",
                            "error": "El recurso multimedia aún se está procesando en Google NotebookLM Studio.",
                            "details": err_msg,
                        },
                        status_code=202,
                    )
                raise

            saved_path = Path(dl_info["saved_to"])
            if not saved_path.exists():
                return JSONResponse({"error": "El archivo descargado no se encontró en disco"}, status_code=404)

            return FileResponse(
                path=str(saved_path),
                filename=saved_path.name,
                content_disposition_type="attachment" if force_download else "inline",
            )
        finally:
            _CURRENT_USER_CONTEXT.reset(token)
    except Exception as e:
        logger.error(f"[Download Artifact] Error descargando artefacto: {e}", exc_info=True)
        return JSONResponse({"error": str(e)}, status_code=500)


# =============================================================================
# INICIALIZACIÓN Y SERVICIO
# =============================================================================

if __name__ == "__main__":
    host = os.environ.get("NOTEBOOKLM_MCP_HOST", "0.0.0.0")
    port = int(os.environ.get("NOTEBOOKLM_MCP_PORT", "9420"))
    logger.info(f"Iniciando WAPPY NotebookLM FastMCP Server en http://{host}:{port}/mcp ...")
    mcp.run(transport="http", host=host, port=port)

