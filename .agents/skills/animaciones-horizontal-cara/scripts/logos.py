"""Descarga los logos de las herramientas que se nombran en la locución (Claude, n8n, ChatGPT...).

Copiado de la skill editor-reels; aquí la salida por defecto es <proyecto>/assets/logos y el fondo #0a0c10.

Uso:
    python logos.py "Claude Code" "n8n" "ChatGPT" [--out DIR] [--force] [--domain nombre=dominio.com ...]
    python logos.py --list                # muestra el registro (logos.json)
    python logos.py --resolve "GPT-5"     # a qué logo del registro lleva un alias

Los logos salen sobre fondo casi negro (#0a0c10), así que cada archivo se adapta a ese fondo:
- Iconos monocromos (currentColor o relleno negro) -> blanco #FFFFFF.
- Simple Icons: se pinta con el color de marca, o en blanco si es demasiado oscuro (luminancia < 0.2).
- Si un logo sigue siendo oscuro sobre transparente (invisible en el fondo), se pasa a blanco.

Fuentes, por orden (se queda la primera que da un resultado válido):
  1. Lobe Icons (npm @lobehub/icons-static-svg en jsDelivr): marcas de IA. Prefiere <slug>-color.svg
     y, si existe <slug>-text.svg (el logotipo con letras), lo guarda también.
  2. SVGL (api.svgl.app): el título que mejor encaja, en su variante "dark" (hecha para fondos oscuros).
  3. Simple Icons (npm simple-icons en jsDelivr), coloreado con el hex de marca.
  4. La web oficial de la herramienta (logo_web.py): su icono SVG o el PNG más grande que publique,
     en la variante para fondo oscuro si la hay. Usa "web" del mapa de alias o el dominio.
  5. Favicon de Google en PNG, solo si se conoce el dominio (--domain o el mapa de alias). Calidad "low".

Salida (por defecto <proyecto>/assets/logos):
  <slug>.svg o <slug>.png, <slug>-text.svg, logos.json (registro por slug) y las cachés de índices
  _lobe_index.json y _simpleicons_index.json (se renuevan cada 7 días).
En la plantilla HTML: <img data-logo="slug"> (el arranque lee logos.json y pone el archivo). find_in_registry() / resolve_logo() convierten cualquier
alias ("GPT-5", "Claude Code"...) en su entrada del registro.

Solo usa la biblioteca estándar de Python.
"""
from __future__ import annotations

import argparse
import datetime as dt
import difflib
import http.client
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zlib
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from logo_web import mejor_icono  # noqa: E402  (icono oficial desde la web de la herramienta)

PROYECTO = Path.cwd()  # carpeta del proyecto de reels
OUT_DEFECTO = PROYECTO / "assets" / "logos"

FONDO = (0x0A, 0x0C, 0x10)  # fondo de las animaciones, #0a0c10
CONTRASTE_MIN = 3.0         # mínimo WCAG para gráficos: por debajo, un color cuenta como "oscuro"
LUM_MIN_SI = 0.2            # Simple Icons: si el hex de marca tiene menos luminancia, se usa blanco
LADO_PX = 512               # tamaño (lado mayor) para SVG sin tamaño absoluto (Lobe trae 1em)
DIAS_CACHE = 7
TIMEOUT = 15
MAX_BYTES = 5_000_000
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")

JSD_DATA = "https://data.jsdelivr.com/v1/packages/npm"
JSD_CDN = "https://cdn.jsdelivr.net/npm"
LOBE_PKG = "@lobehub/icons-static-svg"
SI_PKG = "simple-icons"
SVGL_API = "https://api.svgl.app"
FAVICON_API = "https://www.google.com/s2/favicons?domain={}&sz=256"

REGISTRO = "logos.json"
CACHE_LOBE = "_lobe_index.json"
CACHE_SI = "_simpleicons_index.json"

# ---------------------------------------------------------------------------------------------
# Mapa de alias. slug -> nombre, alias, dominio (para el favicon) y, si hace falta:
#   si=[...]        slugs de Simple Icons distintos del nuestro
#   skip=[...]      fuentes que no usar para esta marca ("lobe", "svgl", "simpleicons")
#   fallback="x"    si ninguna fuente tiene un icono propio, usar el logo de "x"
# Un nombre que no esté aquí se prueba tal cual (normalizado) en Lobe, SVGL y Simple Icons.
# ---------------------------------------------------------------------------------------------
TOOLS: dict[str, dict] = {
    # OpenAI
    "openai": {"name": "OpenAI", "domain": "openai.com",
               "aliases": ["ChatGPT", "Chat GPT", "GPT", "GPT-4", "GPT-4o", "GPT-4.1", "GPT-5", "GPT-5 Pro",
                           "o1", "o3", "o4-mini", "Open AI", "OpenAI API"]},
    "codex": {"name": "Codex", "domain": "openai.com", "fallback": "openai",
              "aliases": ["OpenAI Codex", "Codex CLI", "ChatGPT Codex"]},
    "sora": {"name": "Sora", "domain": "sora.com", "fallback": "openai", "aliases": ["Sora 2", "OpenAI Sora"]},
    # Anthropic: Claude y Claude Code usan el icono de Claude; Anthropic, el suyo
    "claude": {"name": "Claude", "domain": "claude.ai",
               "aliases": ["Claude Code", "Claude AI", "Claude.ai", "Claude Desktop", "Claude Opus",
                           "Claude Sonnet", "Claude Haiku"]},
    "anthropic": {"name": "Anthropic", "domain": "anthropic.com", "aliases": ["Anthropic API"]},
    # Google
    "gemini": {"name": "Gemini", "domain": "gemini.google.com", "si": ["googlegemini"],
               "aliases": ["Google Gemini", "Gemini Pro", "Gemini Flash", "Bard", "Google Bard"]},
    "google": {"name": "Google", "domain": "google.com", "aliases": []},
    "aistudio": {"name": "Google AI Studio", "domain": "aistudio.google.com", "aliases": ["AI Studio"]},
    "notebooklm": {"name": "NotebookLM", "domain": "notebooklm.google.com",
                   "aliases": ["Notebook LM", "Google NotebookLM"]},
    # Stitch y Flow no están en los catálogos: su icono oficial se saca de su web ("web")
    "googlestitch": {"name": "Google Stitch", "domain": "stitch.withgoogle.com",
                     "web": "https://stitch.withgoogle.com/", "aliases": ["Stitch", "Stitch de Google"]},
    "googleflow": {"name": "Google Flow", "domain": "labs.google", "web": "https://labs.google/fx/tools/flow",
                   "aliases": ["Flow", "Flow de Google", "Google Labs Flow"]},
    "antigravity": {"name": "Antigravity", "domain": "antigravity.google",
                    "aliases": ["Google Antigravity", "Anti-Gravity", "Anti Gravity"]},
    "gmail": {"name": "Gmail", "domain": "mail.google.com", "aliases": ["Google Mail"]},
    "googledrive": {"name": "Google Drive", "domain": "drive.google.com", "aliases": ["Drive", "GDrive"]},
    # Microsoft / GitHub
    "copilot": {"name": "Microsoft Copilot", "domain": "copilot.microsoft.com",
                "aliases": ["Copilot", "MS Copilot", "Bing Copilot"]},
    "githubcopilot": {"name": "GitHub Copilot", "domain": "github.com", "aliases": ["GH Copilot"]},
    "github": {"name": "GitHub", "domain": "github.com", "aliases": []},
    # Programar y crear apps
    "cursor": {"name": "Cursor", "domain": "cursor.com", "aliases": ["Cursor AI", "Cursor IDE"]},
    "windsurf": {"name": "Windsurf", "domain": "windsurf.com", "aliases": ["Codeium"]},
    "lovable": {"name": "Lovable", "domain": "lovable.dev", "aliases": ["Lovable.dev"]},
    "bolt": {"name": "Bolt", "domain": "bolt.new", "aliases": ["Bolt.new", "Bolt new"]},
    "v0": {"name": "v0", "domain": "v0.dev", "aliases": ["v0.dev", "v0 by Vercel"]},
    "replit": {"name": "Replit", "domain": "replit.com", "aliases": ["Replit Agent"]},
    "vercel": {"name": "Vercel", "domain": "vercel.com", "aliases": []},
    "supabase": {"name": "Supabase", "domain": "supabase.com", "aliases": []},
    # Modelos y chats
    "perplexity": {"name": "Perplexity", "domain": "perplexity.ai", "aliases": ["Perplexity AI"]},
    "deepseek": {"name": "DeepSeek", "domain": "deepseek.com", "aliases": ["Deep Seek"]},
    "grok": {"name": "Grok", "domain": "grok.com", "aliases": []},
    "xai": {"name": "xAI", "domain": "x.ai", "aliases": ["x.ai", "X AI"]},
    "mistral": {"name": "Mistral AI", "domain": "mistral.ai", "si": ["mistralai"], "aliases": ["Mistral", "Le Chat"]},
    "meta": {"name": "Meta", "domain": "meta.com", "aliases": ["Llama", "Meta Llama", "LLaMA"]},
    "metaai": {"name": "Meta AI", "domain": "meta.ai", "fallback": "meta", "aliases": []},
    "huggingface": {"name": "Hugging Face", "domain": "huggingface.co", "aliases": ["HuggingFace", "HF"]},
    "ollama": {"name": "Ollama", "domain": "ollama.com", "aliases": []},
    # Imagen, vídeo, voz y diseño
    "midjourney": {"name": "Midjourney", "domain": "midjourney.com", "aliases": ["Mid Journey"]},
    "elevenlabs": {"name": "ElevenLabs", "domain": "elevenlabs.io", "aliases": ["Eleven Labs", "11Labs", "11 Labs"]},
    "heygen": {"name": "HeyGen", "domain": "heygen.com", "aliases": ["Hey Gen"]},
    "runway": {"name": "Runway", "domain": "runwayml.com", "aliases": ["RunwayML", "Runway ML"]},
    "kling": {"name": "Kling", "domain": "klingai.com", "aliases": ["Kling AI"]},
    "suno": {"name": "Suno", "domain": "suno.com", "aliases": ["Suno AI"]},
    "canva": {"name": "Canva", "domain": "canva.com", "aliases": []},
    "figma": {"name": "Figma", "domain": "figma.com", "aliases": []},
    # Automatización y productividad
    "n8n": {"name": "n8n", "domain": "n8n.io", "aliases": ["n8n.io"]},
    "make": {"name": "Make", "domain": "make.com", "aliases": ["Make.com", "Integromat"]},
    # En Lobe, Zapier es solo el guion bajo naranja (logomarca de 2023): suelto en pantalla no se
    # reconoce. Simple Icons trae el icono de app (cuadrado naranja con "zapier").
    "zapier": {"name": "Zapier", "domain": "zapier.com", "skip": ["lobe"], "aliases": []},
    "notion": {"name": "Notion", "domain": "notion.so", "aliases": ["Notion AI"]},
    "airtable": {"name": "Airtable", "domain": "airtable.com", "aliases": []},
    "slack": {"name": "Slack", "domain": "slack.com", "aliases": []},
    # SVGL trae solo la franja morada del logotipo nuevo, que no se reconoce: mejor la "S" de Simple Icons.
    "stripe": {"name": "Stripe", "domain": "stripe.com", "skip": ["svgl"], "aliases": []},
    # Redes y mensajería
    "whatsapp": {"name": "WhatsApp", "domain": "whatsapp.com", "aliases": ["Whats App", "WhatsApp Business"]},
    "telegram": {"name": "Telegram", "domain": "telegram.org", "aliases": []},
    "instagram": {"name": "Instagram", "domain": "instagram.com", "aliases": ["IG", "Insta"]},
    "youtube": {"name": "YouTube", "domain": "youtube.com", "aliases": ["YT"]},
    "tiktok": {"name": "TikTok", "domain": "tiktok.com", "aliases": ["Tik Tok"]},
    "linkedin": {"name": "LinkedIn", "domain": "linkedin.com", "aliases": ["Linked In"]},
}

# Nombres de modelo con versión ("GPT-5 mini", "Claude Opus 4.1", "Gemini 2.5 Pro"...), ya normalizados.
PATTERNS = [
    (r"(chat)?gpt([0-9][0-9a-z]*)?|chatgpt[a-z]+|o[1-4](mini|pro)?", "openai"),
    (r"claude[0-9a-z]*", "claude"),
    (r"gemini[0-9][0-9a-z]*", "gemini"),
    (r"llama[0-9][0-9a-z]*", "meta"),
    (r"deepseek[rv]?[0-9][0-9a-z]*", "deepseek"),
    (r"grok[0-9][0-9a-z]*", "grok"),
    (r"kling(ai)?[0-9][0-9a-z]*", "kling"),
    (r"sora[0-9][0-9a-z]*", "sora"),
    (r"midjourneyv?[0-9][0-9a-z]*", "midjourney"),
]
SUFIJOS = ("official", "app", "com", "dev", "io", "hq", "ai")  # "Perplexity AI" -> "perplexity"


def norm(text: str) -> str:
    """'Claude Code' -> 'claudecode', 'GPT-5' -> 'gpt5' (sin tildes, espacios ni signos)."""
    text = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]", "", text.lower())


def sin_sufijo(n: str) -> str:
    for suf in SUFIJOS:
        if n.endswith(suf) and len(n) - len(suf) >= 3:
            return n[: -len(suf)]
    return n


ALIAS_INDEX: dict[str, str] = {}
for _slug, _tool in TOOLS.items():
    for _alias in (_slug, _tool["name"], *_tool["aliases"]):
        ALIAS_INDEX.setdefault(norm(_alias), _slug)


def resolve_slug(name: str) -> tuple[str, bool]:
    """Nombre -> (slug, está en el mapa de alias). Si no se conoce, el slug es el nombre normalizado."""
    n = norm(name)
    if not n:
        return "", False
    if n in ALIAS_INDEX:
        return ALIAS_INDEX[n], True
    for pattern, slug in PATTERNS:
        if re.fullmatch(pattern, n):
            return slug, True
    if sin_sufijo(n) in ALIAS_INDEX:
        return ALIAS_INDEX[sin_sufijo(n)], True
    return n, False


def unicos(items) -> list:
    out = []
    for x in items:
        if x and x not in out:
            out.append(x)
    return out


def make_plan(slug: str, requested: str | None, domains: dict[str, str]) -> dict:
    """Qué buscar en cada fuente para un slug. requested=None en el plan de reserva (fallback)."""
    tool = TOOLS.get(slug)
    n = norm(requested or "")
    if tool:
        name = tool["name"]
        lobe = [slug]
        si = unicos([*tool.get("si", []), slug])
        match = {norm(x) for x in (slug, name, *tool["aliases"])} | ({n} if n else set())
        domain = tool["domain"]
    else:
        name = (requested or slug).strip()
        lobe = si = unicos([n, sin_sufijo(n)])
        match = {n, sin_sufijo(n)}
        domain = None
    domain = domains.get(n) or domains.get(slug) or domain
    return {"slug": slug, "name": name, "requested": requested, "lobe": lobe, "si": si,
            "svgl": unicos([name, requested] if requested and norm(requested) != norm(name) else [name]),
            "match": match - {""}, "domain": domain, "fallback": (tool or {}).get("fallback"),
            "skip": (tool or {}).get("skip", []), "web": (tool or {}).get("web")}


# ---------------------------------------------------------------------------------------------
# Red
# ---------------------------------------------------------------------------------------------
class FetchError(Exception):
    def __init__(self, msg: str, status: int | None = None):
        super().__init__(msg)
        self.status = status


_CAIDOS: set[str] = set()  # servidores que no responden: no se les vuelve a esperar en esta ejecución


def http_get(url: str, accept: str = "*/*") -> tuple[bytes, str]:
    host = urllib.parse.urlsplit(url).netloc
    if host in _CAIDOS:
        raise FetchError(f"{host} no responde (lo salto)")
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept,
                                               "Accept-Language": "en-US,en;q=0.9,es;q=0.8"})
    error = "?"
    for intento in range(2):  # un reintento para cortes de red y errores 5xx
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                body = resp.read(MAX_BYTES + 1)
                if len(body) > MAX_BYTES:
                    raise FetchError("respuesta demasiado grande")
                return body, resp.headers.get("Content-Type", "")
        except urllib.error.HTTPError as e:
            if e.code < 500 or intento:
                raise FetchError(f"HTTP {e.code}", e.code) from None
            error = f"HTTP {e.code}"
        except (urllib.error.URLError, http.client.HTTPException, OSError) as e:
            error = f"error de red: {getattr(e, 'reason', None) or e}"
            if isinstance(e, TimeoutError) or isinstance(getattr(e, "reason", None), TimeoutError):
                break  # tras 15 s sin respuesta no merece la pena reintentar
    if error.startswith("error de red"):
        _CAIDOS.add(host)
    raise FetchError(error)


def get_json(url: str):
    body, _ = http_get(url, "application/json")
    try:
        return json.loads(body.decode("utf-8-sig"))
    except ValueError:
        raise FetchError("JSON no válido") from None


def decode_svg(body: bytes, content_type: str = "") -> str:
    """Valida la descarga: tiene que ser un SVG, no una página de error HTML."""
    try:
        text = body.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = body.decode("latin-1")
    head = text.lstrip()[:400].lower()
    if "text/html" in content_type.lower() or head.startswith(("<!doctype html", "<html")) or "<html" in head:
        raise FetchError("devolvió una página HTML, no un SVG")
    if "<svg" not in text.lower():
        raise FetchError("la descarga no contiene <svg")
    return text


def get_svg(url: str) -> str:
    body, ctype = http_get(url, "image/svg+xml,image/*;q=0.8,*/*;q=0.5")
    return decode_svg(body, ctype)


def ahora() -> str:
    return dt.datetime.now().isoformat(timespec="seconds")


def es_reciente(stamp) -> bool:
    try:
        return dt.datetime.now() - dt.datetime.fromisoformat(stamp) < dt.timedelta(days=DIAS_CACHE)
    except (TypeError, ValueError):
        return False


def leer_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def escribir_json(path: Path, data) -> None:
    """Escritura atómica (archivo temporal + replace), con reintentos si Windows lo tiene bloqueado."""
    tmp = path.with_name(f"{path.name}.{os.getpid()}.tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for intento in range(5):
        try:
            tmp.replace(path)
            return
        except PermissionError:
            if intento == 4:
                tmp.unlink(missing_ok=True)
                raise
            time.sleep(0.2)


def version_actual(pkg: str) -> str:
    # La API de datos de jsDelivr no acepta etiquetas npm (".../pkg@latest" da 404): primero se
    # resuelve "latest" a una versión concreta y con ella se piden la lista de archivos y los iconos.
    version = get_json(f"{JSD_DATA}/{pkg}/resolved?specifier=latest").get("version")
    if not version:
        raise FetchError(f"no se pudo resolver la versión de {pkg}")
    return version


def lista_archivos(pkg: str, version: str) -> list[str]:
    data = get_json(f"{JSD_DATA}/{pkg}@{version}?structure=flat")
    files = [f.get("name", "") for f in data.get("files", []) if isinstance(f, dict)]
    if not files:
        raise FetchError(f"lista de archivos vacía para {pkg}@{version}")
    return files


def cargar_indice(path: Path, etiqueta: str, construir, claves: tuple[str, ...]) -> dict | None:
    """Caché de 7 días; si falla la red se usa la copia vieja antes que nada."""
    cache = leer_json(path)
    if not (isinstance(cache, dict) and all(cache.get(k) for k in claves)):
        cache = None  # no existe o está incompleta
    if cache and es_reciente(cache.get("fetched")):
        return cache
    try:
        data = construir()
        data["fetched"] = ahora()
        escribir_json(path, data)
        return data
    except (FetchError, KeyError, TypeError, AttributeError, OSError) as e:
        if cache:
            print(f"  aviso: no se pudo renovar el índice de {etiqueta} ({e}); uso la copia del {cache.get('fetched')}")
            return cache
        print(f"  aviso: índice de {etiqueta} no disponible ({e}); me salto esa fuente")
        return None


def indice_lobe(out: Path) -> dict | None:
    def construir():
        version = version_actual(LOBE_PKG)
        files = sorted(f.rsplit("/", 1)[-1] for f in lista_archivos(LOBE_PKG, version)
                       if f.startswith("/icons/") and f.endswith(".svg"))
        return {"package": LOBE_PKG, "version": version, "files": files}
    return cargar_indice(out / CACHE_LOBE, "Lobe Icons", construir, ("version", "files"))


SI_REEMPLAZOS = {"+": "plus", ".": "dot", "&": "and", "đ": "d", "ħ": "h", "ı": "i", "ĸ": "k", "ŀ": "l",
                 "ł": "l", "ß": "ss", "ŧ": "t", "ø": "o"}


def si_title_to_slug(title: str) -> str:
    """Igual que titleToSlug() de simple-icons, para iconos sin 'slug' explícito en sus datos."""
    text = "".join(SI_REEMPLAZOS.get(c, c) for c in title.lower())
    return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", text))


def indice_si(out: Path) -> dict | None:
    def construir():
        version = version_actual(SI_PKG)
        files = lista_archivos(SI_PKG, version)
        # El JSON de datos ha cambiado de sitio entre versiones (_data/ antes, data/ ahora): se busca.
        data_path = next((f for f in files if re.fullmatch(r"/_?data/simple-icons\.json", f)), None) \
            or next((f for f in files if f.endswith("/simple-icons.json")), None)
        if not data_path:
            raise FetchError("simple-icons.json no aparece en el paquete")
        raw = get_json(f"{JSD_CDN}/{SI_PKG}@{version}{data_path}")
        entries = raw if isinstance(raw, list) else raw.get("icons", [])
        svgs = {f[len("/icons/"):-4] for f in files if f.startswith("/icons/") and f.endswith(".svg")}
        icons, titles, aka = {}, {}, {}
        for e in entries:
            slug = e.get("slug") or si_title_to_slug(e["title"])
            if slug not in svgs:
                continue
            icons[slug] = [e["title"], e.get("hex", "000000")]
            titles.setdefault(norm(e["title"]), slug)
            alias = e.get("aliases") or {}
            for key in ("aka", "old", "dup"):
                for a in alias.get(key) or []:
                    t = a if isinstance(a, str) else (a or {}).get("title", "")
                    if norm(t):
                        aka.setdefault(norm(t), slug)
        if not icons:
            raise FetchError("datos de Simple Icons vacíos")
        return {"package": SI_PKG, "version": version, "data_path": data_path,
                "icons": icons, "titles": titles, "aka": aka}
    return cargar_indice(out / CACHE_SI, "Simple Icons", construir, ("version", "icons", "titles"))


# ---------------------------------------------------------------------------------------------
# Color y análisis del SVG
# ---------------------------------------------------------------------------------------------
NOMBRES_COLOR = {
    "black": (0, 0, 0), "white": (255, 255, 255), "red": (255, 0, 0), "lime": (0, 255, 0), "green": (0, 128, 0),
    "blue": (0, 0, 255), "yellow": (255, 255, 0), "cyan": (0, 255, 255), "aqua": (0, 255, 255),
    "magenta": (255, 0, 255), "fuchsia": (255, 0, 255), "silver": (192, 192, 192), "gray": (128, 128, 128),
    "grey": (128, 128, 128), "maroon": (128, 0, 0), "olive": (128, 128, 0), "purple": (128, 0, 128),
    "teal": (0, 128, 128), "navy": (0, 0, 128), "orange": (255, 165, 0), "gold": (255, 215, 0),
    "pink": (255, 192, 203), "brown": (165, 42, 42), "darkgray": (169, 169, 169), "darkgrey": (169, 169, 169),
    "dimgray": (105, 105, 105), "dimgrey": (105, 105, 105), "lightgray": (211, 211, 211),
    "lightgrey": (211, 211, 211), "whitesmoke": (245, 245, 245), "darkblue": (0, 0, 139),
    "darkgreen": (0, 100, 0), "darkred": (139, 0, 0), "indigo": (75, 0, 130), "violet": (238, 130, 238),
    "crimson": (220, 20, 60), "tomato": (255, 99, 71), "coral": (255, 127, 80), "orangered": (255, 69, 0),
}


def parse_color(value: str | None) -> tuple[int, int, int] | None:
    v = (value or "").strip().lower()
    if v.startswith("#"):
        h = v[1:]
        if re.fullmatch(r"[0-9a-f]{3,4}", h):
            h = "".join(c * 2 for c in h[:3])
        elif re.fullmatch(r"[0-9a-f]{6}([0-9a-f]{2})?", h):
            h = h[:6]
        else:
            return None
        return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    m = re.fullmatch(r"rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:\s*[,/]\s*[\d.]+%?)?\s*\)", v)
    if m:
        return tuple(max(0, min(255, round(float(g[:-1]) * 2.55 if g.endswith("%") else float(g))))
                     for g in m.groups())
    return NOMBRES_COLOR.get(v)


def luminance(rgb) -> float:
    """Luminancia relativa (WCAG): 0 = negro, 1 = blanco."""
    def canal(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * canal(rgb[0]) + 0.7152 * canal(rgb[1]) + 0.0722 * canal(rgb[2])


LUM_FONDO = luminance(FONDO)


def es_oscuro(rgb) -> bool:
    """True si apenas se distingue del fondo #06080d (contraste < 3:1)."""
    lum = luminance(rgb)
    return (max(lum, LUM_FONDO) + 0.05) / (min(lum, LUM_FONDO) + 0.05) < CONTRASTE_MIN


def to_hex(rgb) -> str:
    return "#%02X%02X%02X" % tuple(rgb)


FORMAS = {"path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan", "textPath"}
NO_PINTAN = {"defs", "mask", "clipPath", "symbol", "pattern", "marker", "filter", "linearGradient",
             "radialGradient", "style", "title", "desc", "metadata", "script"}
PROPS = {"fill", "stroke", "color", "stop-color", "stop-opacity", "opacity", "fill-opacity", "stroke-opacity",
         "stroke-width", "display", "visibility"}
HEREDADAS = {"fill", "stroke", "color", "fill-opacity", "stroke-opacity", "stroke-width", "visibility"}
XLINK_HREF = "{http://www.w3.org/1999/xlink}href"


def _local(tag) -> str:
    return tag.rsplit("}", 1)[-1] if isinstance(tag, str) else ""


def _decls(style: str) -> dict:
    out = {}
    for part in style.split(";"):
        key, sep, value = part.partition(":")
        key = key.strip().lower()
        if sep and key in PROPS:
            out[key] = value.replace("!important", "").strip()
    return out


def _num(value, default: float = 1.0) -> float:
    if value is None:
        return default
    v = str(value).strip()
    try:
        return float(v[:-1]) / 100 if v.endswith("%") else float(re.sub(r"[a-z]+$", "", v))
    except ValueError:
        return default


def analyze_svg(text: str) -> dict:
    """Recorre el SVG y calcula el color efectivo de cada relleno/trazo que se pinta (herencia,
    <style> con .clase/#id/etiqueta, style="", degradados y <use>). No mira dentro de máscaras."""
    try:
        root = ET.fromstring(re.sub(r"^\s*<\?xml[^>]*\?>", "", text))
    except ET.ParseError as e:
        raise FetchError(f"SVG mal formado ({e})") from None
    if _local(root.tag) != "svg":
        raise FetchError("la raíz no es <svg>")

    rules = []  # (especificidad, tipo, nombre, declaraciones)
    for el in root.iter():
        if _local(el.tag) == "style" and el.text:
            css = re.sub(r"/\*.*?\*/", "", el.text, flags=re.S)
            for selectors, body in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
                decls = _decls(body)
                for sel in (s.strip() for s in selectors.split(",")):
                    if decls and re.fullmatch(r"\.[\w-]+", sel):
                        rules.append((1, "class", sel[1:], decls))
                    elif decls and re.fullmatch(r"#[\w-]+", sel):
                        rules.append((2, "id", sel[1:], decls))
                    elif decls and re.fullmatch(r"[A-Za-z][\w-]*", sel):
                        rules.append((0, "tag", sel, decls))
    rules.sort(key=lambda r: r[0])
    ids = {el.get("id"): el for el in root.iter() if el.get("id")}

    def propias(el) -> dict:
        props = {k: v.strip() for k, v in el.attrib.items() if k in PROPS}
        tag, classes, eid = _local(el.tag), set((el.get("class") or "").split()), el.get("id")
        for _, kind, name, decls in rules:
            if (kind == "tag" and name == tag) or (kind == "class" and name in classes) or (kind == "id" and name == eid):
                props.update(decls)
        if el.get("style"):
            props.update(_decls(el.get("style")))
        return props

    def degradado(gid: str, depth: int = 0):
        el = ids.get(gid)
        if el is None or depth > 5 or _local(el.tag) not in ("linearGradient", "radialGradient"):
            return None
        stops = [s for s in el if _local(s.tag) == "stop"]
        if not stops:
            href = el.get("href") or el.get(XLINK_HREF) or ""
            return degradado(href[1:], depth + 1) if href.startswith("#") else []
        colors = []
        for s in stops:
            p = propias(s)
            if _num(p.get("stop-opacity")) > 0.05:
                c = p.get("stop-color", "black")
                rgb = parse_color("black" if c.lower() == "currentcolor" else c)
                if rgb:
                    colors.append(rgb)
        return colors

    pinturas: list[list[tuple]] = []  # una lista de colores por cada relleno o trazo pintado
    raster = False

    def pintar(value, cur):
        v = (value or "").strip()
        if v.lower() in ("", "none", "transparent"):
            return
        if v.lower() == "currentcolor":  # en un <img> currentColor es negro
            v = cur.get("color") or "black"
            if v.lower() == "currentcolor":
                v = "black"
        if v.lower().startswith("url("):
            m = re.match(r"url\(\s*['\"]?#([^'\")\s]+)['\"]?\s*\)\s*(.*)$", v, re.S)
            colors = degradado(m.group(1)) if m else None
            if colors:
                pinturas.append(colors)
            elif colors is None and m and m.group(2):
                pintar(m.group(2), cur)  # color de reserva: url(#x) #000
            return
        rgb = parse_color(v)
        if rgb:
            pinturas.append([rgb])

    def recorrer(el, heredado: dict, depth: int):
        nonlocal raster
        tag = _local(el.tag)
        if depth > 50 or tag in NO_PINTAN:
            return
        props = propias(el)
        if props.get("display", "").lower() == "none" or _num(props.get("opacity")) <= 0.05:
            return
        cur = {**heredado, **{k: v for k, v in props.items() if k in HEREDADAS}}
        if tag == "image":
            raster = True
        if tag == "use":
            href = el.get("href") or el.get(XLINK_HREF) or ""
            target = ids.get(href[1:]) if href.startswith("#") else None
            if target is not None:
                for hijo in (list(target) if _local(target.tag) == "symbol" else [target]):
                    recorrer(hijo, cur, depth + 1)
            return
        if tag in FORMAS and cur.get("visibility", "visible") not in ("hidden", "collapse"):
            if _num(cur.get("fill-opacity")) > 0.05:
                pintar(cur.get("fill", "black"), cur)
            if (cur.get("stroke", "none").lower() != "none" and _num(cur.get("stroke-width")) > 0
                    and _num(cur.get("stroke-opacity")) > 0.05):
                pintar(cur["stroke"], cur)
        for hijo in el:
            recorrer(hijo, cur, depth + 1)

    recorrer(root, {"fill": "black"}, 0)
    oscuras = [all(es_oscuro(c) for c in cols) for cols in pinturas]
    counts = Counter(to_hex(c) for cols in pinturas for c in cols)
    return {"pinturas": len(pinturas), "raster": raster, "colors": counts,
            "all_dark": bool(pinturas) and all(oscuras),
            "dark_share": sum(oscuras) / len(pinturas) if pinturas else 0.0,
            "all_white": bool(counts) and set(counts) == {"#FFFFFF"}}


def color_principal(counts: Counter) -> str | None:
    """El color más usado que se ve bien en el fondo (ni blanco ni oscuro); si no hay, blanco."""
    for hx, _ in counts.most_common():
        if hx != "#FFFFFF" and not es_oscuro(parse_color(hx)):
            return hx
    return "#FFFFFF" if "#FFFFFF" in counts else None


_ATTR_COLOR = re.compile(r"(?<![\w:-])(fill|stroke|stop-color|color|flood-color)(\s*=\s*)([\"'])(.*?)\3", re.I | re.S)
_CSS_COLOR = re.compile(r"(?<![\w-])(fill|stroke|stop-color|color|flood-color)(\s*:\s*)([^;\"'{}<>]+)", re.I)
_MASCARAS = re.compile(r"(<(?:mask|clipPath)\b.*?</(?:mask|clipPath)\s*>)", re.I | re.S)


def cambiar_colores(text: str, fn) -> str:
    """Aplica fn(valor) -> nuevo valor | None a cada color (atributos y CSS), fuera de máscaras."""
    def attr(m):
        new = fn(m.group(4))
        return m.group(0) if new is None else f"{m.group(1)}{m.group(2)}{m.group(3)}{new}{m.group(3)}"

    def css(m):
        new = fn(m.group(3).strip())
        return m.group(0) if new is None else f"{m.group(1)}{m.group(2)}{new}"

    partes = _MASCARAS.split(text)
    for i in range(0, len(partes), 2):  # las impares son máscaras/clipPath: se dejan igual
        partes[i] = _CSS_COLOR.sub(css, _ATTR_COLOR.sub(attr, partes[i]))
    return "".join(partes)


def _a_blanco(value: str) -> str | None:
    if value.strip().lower() == "currentcolor":
        return "#FFFFFF"
    rgb = parse_color(value)
    return "#FFFFFF" if rgb and es_oscuro(rgb) else None


def _tag_raiz(text: str) -> re.Match:
    m = re.search(r"<svg\b[^>]*>", text, re.I)
    if not m:
        raise FetchError("la descarga no contiene <svg")
    return m


def set_root_attr(text: str, name: str, value: str) -> str:
    m = _tag_raiz(text)
    tag = re.sub(rf"\s{name}\s*=\s*([\"']).*?\1", "", m.group(0))
    tag = f'{tag[:4]} {name}="{value}"{tag[4:]}'
    return text[:m.start()] + tag + text[m.end():]


def ajustar_tamano(text: str) -> str:
    """Lobe trae width/height="1em" (16 px fuera de una web) y Simple Icons no trae tamaño: se pone
    un tamaño en px con la proporción del viewBox. Si ya hay un tamaño absoluto, se deja."""
    m = _tag_raiz(text)
    tag = m.group(0)

    def attr(name):
        a = re.search(rf"(?<![\w:-]){name}\s*=\s*([\"'])(.*?)\1", tag)
        return a.group(2).strip() if a else None

    w, h = attr("width"), attr("height")
    if w and h and re.fullmatch(r"[\d.]+(px)?", w) and re.fullmatch(r"[\d.]+(px)?", h):
        return text
    try:
        vb = [float(x) for x in re.split(r"[\s,]+", (attr("viewBox") or "").strip())]
    except ValueError:
        return text
    if len(vb) != 4 or vb[2] <= 0 or vb[3] <= 0:
        return text
    escala = LADO_PX / max(vb[2], vb[3])
    tag = re.sub(r"\s(?:width|height)\s*=\s*([\"']).*?\1", "", tag)
    tag = f'{tag[:4]} width="{max(1, round(vb[2] * escala))}" height="{max(1, round(vb[3] * escala))}"{tag[4:]}'
    return text[:m.start()] + tag + text[m.end():]


def preparar_svg(text: str) -> tuple[str, dict, list[str]]:
    """Deja el SVG listo para el fondo oscuro. Devuelve (svg, análisis, notas)."""
    notas = []
    nuevo = cambiar_colores(text, lambda v: "#FFFFFF" if v.strip().lower() == "currentcolor" else None)
    cambiado, text = nuevo != text, nuevo
    info = analyze_svg(text)
    if cambiado:
        notas.append("mono -> blanco" if info["all_white"] else "currentColor -> blanco")
    if info["all_dark"]:
        text = cambiar_colores(text, _a_blanco)
        raiz = _tag_raiz(text).group(0)
        if not re.search(r"(?<![\w:-])fill\s*=|(?<![\w-])fill\s*:", raiz):
            text = set_root_attr(text, "fill", "#FFFFFF")  # formas sin fill = negro por defecto
        info = analyze_svg(text)
        if info["all_dark"]:
            raise FetchError("sigue siendo invisible sobre fondo oscuro")
        notas.append("oscuro -> blanco")
    elif info["dark_share"] >= 0.5:
        notas.append("OJO: más de la mitad es oscuro, revisar")
    if not info["pinturas"]:
        notas.append("colores no analizables, revisar" if not info["raster"] else "lleva una imagen incrustada")
    text = re.sub(r"^(\s*<\?xml[^>]*?encoding=[\"'])[^\"']+", r"\1UTF-8", ajustar_tamano(text))
    return text, info, notas


# ---------------------------------------------------------------------------------------------
# PNG (solo para el favicon de reserva)
# ---------------------------------------------------------------------------------------------
PNG_SIG = b"\x89PNG\r\n\x1a\n"


def png_size(data: bytes) -> tuple[int, int] | None:
    if data[:8] != PNG_SIG or data[12:16] != b"IHDR":
        return None
    return int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")


def _png_rgba(data: bytes):
    """Decodifica PNG de 8 bits sin entrelazar (lo normal en favicons) a píxeles RGBA."""
    chunks, idat, pos = {}, bytearray(), 8
    while pos + 8 <= len(data):
        n = int.from_bytes(data[pos:pos + 4], "big")
        kind, body = data[pos + 4:pos + 8], data[pos + 8:pos + 8 + n]
        pos += 12 + n
        if kind == b"IDAT":
            idat += body
        elif kind == b"IEND":
            break
        else:
            chunks.setdefault(kind, body)
    ihdr = chunks.get(b"IHDR", b"")
    if len(ihdr) < 13:
        return None
    w, h = int.from_bytes(ihdr[:4], "big"), int.from_bytes(ihdr[4:8], "big")
    ch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}.get(ihdr[9])
    if ihdr[8] != 8 or ihdr[12] or not ch or not 0 < w * h <= 1024 * 1024:
        return None
    try:
        raw = zlib.decompress(bytes(idat))
    except zlib.error:
        return None
    stride = w * ch
    if len(raw) < h * (stride + 1):
        return None
    plte, trns = chunks.get(b"PLTE", b""), chunks.get(b"tRNS", b"")
    prev, px = bytearray(stride), []
    for y in range(h):
        f = raw[y * (stride + 1)]
        line = bytearray(raw[y * (stride + 1) + 1:(y + 1) * (stride + 1)])
        for i in range(stride):
            a = line[i - ch] if i >= ch else 0
            b = prev[i]
            c = prev[i - ch] if i >= ch else 0
            if f == 1:
                line[i] = (line[i] + a) & 255
            elif f == 2:
                line[i] = (line[i] + b) & 255
            elif f == 3:
                line[i] = (line[i] + ((a + b) >> 1)) & 255
            elif f == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[i] = (line[i] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        prev = line
        for x in range(w):
            v = line[x * ch:(x + 1) * ch]
            if ch == 4:
                px.append(tuple(v))
            elif ch == 3:
                px.append((v[0], v[1], v[2], 255))
            elif ch == 2:
                px.append((v[0], v[0], v[0], v[1]))
            elif ihdr[9] == 0:
                px.append((v[0], v[0], v[0], 255))
            else:
                rgb = plte[v[0] * 3:v[0] * 3 + 3] or b"\0\0\0"
                px.append((rgb[0], rgb[1], rgb[2], trns[v[0]] if v[0] < len(trns) else 255))
    return w, h, px


def _png_encode(w: int, h: int, px) -> bytes:
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for p in px[y * w:(y + 1) * w]:
            raw += bytes(p)

    def chunk(kind, body):
        return len(body).to_bytes(4, "big") + kind + body + zlib.crc32(kind + body).to_bytes(4, "big")
    ihdr = w.to_bytes(4, "big") + h.to_bytes(4, "big") + bytes([8, 6, 0, 0, 0])
    return PNG_SIG + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")


def preparar_png(data: bytes) -> tuple[bytes, bool, list[str]]:
    """Si el favicon es un glifo oscuro sobre transparente, lo pasa a blanco. (png, mono, notas).
    Una "baldosa" oscura con contenido claro (X, Uber, Threads...) se ve bien en el fondo: se deja."""
    dec = _png_rgba(data)
    if not dec:
        return data, False, ["PNG no analizable, revisar"]
    w, h, px = dec
    visibles = [p for p in px if p[3] >= 128]
    if not visibles:
        raise FetchError("el PNG está vacío")
    oscuro = sum(1 for p in visibles if es_oscuro(p[:3])) / len(visibles)
    borde = px[:w] + px[-w:] + px[::w] + px[w - 1::w]
    suelto = sum(1 for p in borde if p[3] >= 128) < len(borde) / 2  # sin fondo propio que llegue al borde
    if len(visibles) < len(px) and oscuro >= 0.97:  # casi nada claro: glifo oscuro sobre transparente
        return _png_encode(w, h, [(255, 255, 255, p[3]) for p in px]), True, ["oscuro -> blanco"]
    return data, False, (["OJO: partes oscuras sobre transparente, revisar"] if suelto and oscuro >= 0.5 else [])


# ---------------------------------------------------------------------------------------------
# Fuentes
# ---------------------------------------------------------------------------------------------
LOBE_SUFIJOS = re.compile(r"-(color|text|brand|cn)(-(color|text|cn))*$")


def desde_lobe(plan: dict, ctx: "Contexto") -> dict | None:
    idx = ctx.lobe()
    if not idx:
        raise FetchError("índice no disponible")
    files, base = set(idx["files"]), f"{JSD_CDN}/{LOBE_PKG}@{idx['version']}/icons/"
    for s in plan["lobe"]:
        fname = next((f for f in (f"{s}-color.svg", f"{s}.svg") if f in files), None)
        if not fname:
            continue
        found = {"source": "lobe", "url": base + fname, "svg": get_svg(base + fname), "detalle": fname, "notas": []}
        if f"{s}-text.svg" in files:
            try:
                found["wordmark"] = get_svg(base + f"{s}-text.svg")
            except FetchError as e:
                found["notas"].append(f"sin letras ({e})")
        return found
    return None


def mejor_titulo(items: list, match: set[str]) -> dict | None:
    """Título exacto (sin tildes/espacios), exacto sin sufijo tipo "AI", o casi idéntico (erratas)."""
    best, best_score = None, 0.0
    for it in items:
        if not isinstance(it, dict) or not isinstance(it.get("title"), str):
            continue
        t = norm(it["title"])
        if t in match:
            score = 1.0
        elif sin_sufijo(t) in match:
            score = 0.95
        else:
            score = max((difflib.SequenceMatcher(None, t, m).ratio() for m in match), default=0.0)
            if score < 0.92:  # "llama" vs "ollama" (0.91) no vale
                continue
        if score > best_score:
            best, best_score = it, score
    return best


def desde_svgl(plan: dict, ctx: "Contexto") -> dict | None:
    errores = []
    for term in plan["svgl"]:
        try:
            items = get_json(f"{SVGL_API}?search={urllib.parse.quote(term)}")
        except FetchError as e:
            if e.status != 404:  # SVGL responde 404 cuando no encuentra nada
                errores.append(str(e))
            continue
        best = mejor_titulo(items if isinstance(items, list) else [], plan["match"])
        if not best:
            continue
        route, variante = best.get("route"), "variante única"
        if isinstance(route, dict):
            variante = "variante dark" if route.get("dark") else "variante light"
            route = route.get("dark") or route.get("light")
        if not isinstance(route, str) or not route:
            continue
        url = urllib.parse.urljoin("https://svgl.app/", route)
        return {"source": "svgl", "url": url, "svg": get_svg(url), "detalle": f"{best['title']} ({variante})",
                "notas": []}
    if errores:
        raise FetchError("; ".join(errores))
    return None


def desde_simpleicons(plan: dict, ctx: "Contexto") -> dict | None:
    idx = ctx.si()
    if not idx:
        raise FetchError("índice no disponible")
    cands = list(plan["si"])
    for q in (norm(plan["name"]), norm(plan["requested"] or "")):
        cands += [idx["titles"].get(q), idx.get("aka", {}).get(q)]
    for s in unicos(cands):
        if s not in idx["icons"]:
            continue
        url = f"{JSD_CDN}/{SI_PKG}@{idx['version']}/icons/{s}.svg"
        svg = get_svg(url)
        marca = "#" + str(idx["icons"][s][1]).upper()
        rgb = parse_color(marca) or (0, 0, 0)
        color = marca if luminance(rgb) >= LUM_MIN_SI else "#FFFFFF"
        nota = f"marca {marca}" + ("" if color == marca else " demasiado oscuro -> blanco")
        return {"source": "simpleicons", "url": url, "svg": set_root_attr(svg, "fill", color),
                "detalle": f"{s}.svg", "notas": [nota]}
    return None


def desde_favicon(plan: dict) -> dict:
    url = FAVICON_API.format(urllib.parse.quote(plan["domain"], safe=".-"))
    body, _ = http_get(url, "image/png,image/*;q=0.8,*/*;q=0.5")
    if body[:8] != PNG_SIG or not png_size(body):
        raise FetchError("no es un PNG (¿página de error?)")
    return {"source": "favicon", "url": url, "png": body, "detalle": plan["domain"], "notas": []}


def desde_web(plan: dict, url: str) -> dict | None:
    """Icono oficial publicado por la propia web (link rel=icon, manifest...). SVG o PNG de 128 px o más."""
    try:
        r = mejor_icono(url)
    except Exception as e:  # red, HTML raro...
        raise FetchError(str(e) or e.__class__.__name__)
    if not r:
        return None
    datos, ext, origen, medida = r
    if ext == "svg":
        return {"source": "web", "url": origen, "svg": decode_svg(datos), "detalle": url, "notas": []}
    if not medida or medida[0] < 128:
        raise FetchError(f"icono demasiado pequeño ({medida[0] if medida else '?'} px)")
    return {"source": "web", "url": origen, "png": datos, "detalle": url, "notas": []}


FUENTES = (("lobe", desde_lobe), ("svgl", desde_svgl), ("simpleicons", desde_simpleicons))


# ---------------------------------------------------------------------------------------------
# Registro
# ---------------------------------------------------------------------------------------------
def load_registry(out: Path, reparar: bool = False) -> dict:
    """Lee logos.json. Si está dañado: con reparar=True (antes de escribir) lo aparta a logos.json.roto."""
    path = out / REGISTRO
    if not path.exists():
        return {}
    data = leer_json(path)
    if isinstance(data, dict):
        return data
    if reparar:
        copia = path.with_name(REGISTRO + ".roto")
        path.replace(copia)
        print(f"  aviso: {path.name} estaba dañado; lo he movido a {copia.name} y empiezo uno nuevo")
    else:
        print(f"  aviso: {path.name} está dañado (no es JSON válido)")
    return {}


def find_in_registry(name: str, registry: dict) -> tuple[str | None, dict | None]:
    """Cualquier alias ("GPT-5", "Claude Code", "chatgpt", el slug...) -> (slug, entrada) o (None, None)."""
    n = norm(name)
    if not n:
        return None, None
    slug, _ = resolve_slug(name)
    if slug in registry:
        return slug, registry[slug]
    for s, entry in registry.items():
        claves = {norm(s), norm(entry.get("name", ""))} | {norm(a) for a in entry.get("aliases", [])}
        if n in claves:
            return s, entry
    return None, None


def resolve_logo(name: str, out: Path | str = OUT_DEFECTO) -> dict | None:
    """Para usar desde otros scripts: la entrada del registro para un alias, con 'slug' y 'path' absoluto."""
    out = Path(out)
    slug, entry = find_in_registry(name, load_registry(out))
    if entry is None:
        return None
    return {**entry, "slug": slug, "path": str(out / Path(entry["file"]).name)}


def juntar_alias(*grupos) -> list[str]:
    vistos, out = set(), []
    for grupo in grupos:
        for a in ([grupo] if isinstance(grupo, str) else grupo or []):
            if a and norm(a) and norm(a) not in vistos:
                vistos.add(norm(a))
                out.append(a.strip())
    return out


class Contexto:
    def __init__(self, out: Path, domains: dict[str, str]):
        self.out, self.domains = out, domains
        self.registry = load_registry(out, reparar=True)
        self.tocados: set[str] = set()  # entradas que ha cambiado esta ejecución
        self._indices: dict[str, dict | None] = {}

    def lobe(self) -> dict | None:
        if "lobe" not in self._indices:
            self._indices["lobe"] = indice_lobe(self.out)
        return self._indices["lobe"]

    def si(self) -> dict | None:
        if "si" not in self._indices:
            self._indices["si"] = indice_si(self.out)
        return self._indices["si"]

    def guardar(self) -> None:
        # Otra ejecución (o alguien a mano) puede haber tocado logos.json mientras tanto: se relee
        # y solo se escriben encima las entradas que ha cambiado esta ejecución.
        disco = load_registry(self.out)
        disco.update({s: self.registry[s] for s in self.tocados})
        self.registry = disco
        escribir_json(self.out / REGISTRO, dict(sorted(disco.items())))

    def existe(self, entry: dict) -> bool:
        return (self.out / Path(entry.get("file", "")).name).is_file()

    def anadir_alias(self, slug: str, requested: str) -> None:
        entry = self.registry[slug]
        antes = list(entry.get("aliases", []))
        entry["aliases"] = juntar_alias(antes, requested)
        if entry["aliases"] != antes:
            self.tocados.add(slug)
            self.guardar()

    def poner(self, slug: str, entry: dict, requested: str) -> None:
        viejo = self.registry.get(slug, {})
        entry["aliases"] = juntar_alias(entry["name"], TOOLS.get(slug, {}).get("aliases", []),
                                        viejo.get("aliases", []), requested)
        rn = norm(requested)  # un nombre pedido apunta solo a este logo
        for s, e in self.registry.items():
            if s != slug and rn in {norm(a) for a in e.get("aliases", [])}:
                e["aliases"] = [a for a in e["aliases"] if norm(a) != rn]
                self.tocados.add(s)
        self.registry[slug] = entry
        self.tocados.add(slug)
        self.guardar()


def nueva_entrada(plan: dict, ctx: Contexto, fname: str, source: str, color, mono: bool, wordmark,
                  url: str, quality: str) -> dict:
    return {"name": plan["name"], "aliases": [], "file": f"{ctx.out.name}/{fname}", "source": source,
            "color": color, "mono": mono, "wordmark": wordmark, "url": url, "quality": quality,
            "fetched": dt.date.today().isoformat()}


def guardar_svg(found: dict, plan: dict, ctx: Contexto, requested: str) -> list[str]:
    text, info, notas = preparar_svg(found["svg"])  # si no vale, FetchError y se prueba la siguiente fuente
    slug = plan["slug"]
    (ctx.out / f"{slug}.svg").write_text(text, encoding="utf-8", newline="")
    wordmark = None
    if found.get("wordmark"):
        try:
            wtext, _, _ = preparar_svg(found["wordmark"])
            (ctx.out / f"{slug}-text.svg").write_text(wtext, encoding="utf-8", newline="")
            wordmark = f"{ctx.out.name}/{slug}-text.svg"
        except FetchError as e:
            notas.append(f"letras descartadas ({e})")
    viejo = ctx.registry.get(slug, {}).get("wordmark")
    if not wordmark and viejo and (ctx.out / Path(viejo).name).is_file():
        wordmark = viejo  # con --force, si la nueva fuente no trae letras se conservan las de antes
    ctx.poner(slug, nueva_entrada(plan, ctx, f"{slug}.svg", found["source"], color_principal(info["colors"]),
                                  info["all_white"], wordmark, found["url"], "high"), requested)
    return found["notas"] + notas + (["+ letras"] if wordmark else [])


def guardar_png(found: dict, plan: dict, ctx: Contexto, requested: str) -> list[str]:
    data, mono, notas = preparar_png(found["png"])
    w, h = png_size(data)
    slug = plan["slug"]
    calidad = "high" if min(w, h) >= 256 else "low"
    (ctx.out / f"{slug}.png").write_bytes(data)
    ctx.poner(slug, nueva_entrada(plan, ctx, f"{slug}.png", found["source"], None, mono, None, found["url"], calidad),
              requested)
    return [f"PNG {w}x{h}" + (", calidad baja" if calidad == "low" else "")] + notas


def parecidos(n: str, ctx: Contexto, k: int = 3) -> list[str]:
    """Los k slugs más parecidos de los índices de Lobe y Simple Icons."""
    pool = set()
    if ctx.lobe():
        pool |= {LOBE_SUFIJOS.sub("", f[:-4]) for f in ctx.lobe()["files"]}
    if ctx.si():
        pool |= set(ctx.si()["icons"])

    def score(c):
        r = difflib.SequenceMatcher(None, n, c).ratio()
        return r + 0.3 if len(n) >= 3 and len(c) >= 3 and (n in c or c in n) else r
    return sorted(pool, key=lambda c: (-score(c), c))[:k]


def procesar(name: str, ctx: Contexto, force: bool, hechos: set[str]) -> dict:
    fila = {"name": name, "slug": "-", "source": "", "file": "-", "notas": [], "traza": []}
    if not norm(name):
        fila.update(source="ERROR", notas=["nombre vacío"])
        return fila

    slug, entry = find_in_registry(name, ctx.registry)
    if entry is not None and ctx.existe(entry) and (slug in hechos or not force):
        ctx.anadir_alias(slug, name)
        fila.update(slug=slug, source=entry["source"], file=entry["file"],
                    notas=["mismo logo que arriba" if slug in hechos else "ya estaba (--force para renovarlo)"])
        return fila

    base, _ = resolve_slug(name)
    planes = [make_plan(base, name, ctx.domains)]
    if planes[0]["fallback"]:
        planes.append(make_plan(planes[0]["fallback"], None, ctx.domains))

    for i, plan in enumerate(planes):
        if i:  # reserva: p. ej. Codex sin icono propio -> el de OpenAI
            e = ctx.registry.get(plan["slug"])
            if e and ctx.existe(e) and (plan["slug"] in hechos or not force):
                ctx.anadir_alias(plan["slug"], name)
                fila.update(slug=plan["slug"], source=e["source"], file=e["file"],
                            notas=[f"sin icono propio: uso el de {plan['name']}"])
                return fila
        for fuente, fn in FUENTES:
            if fuente in plan["skip"]:
                fila["traza"].append(f"{fuente}: descartada en el mapa de alias")
                continue
            try:
                found = fn(plan, ctx)
                if not found:
                    fila["traza"].append(f"{fuente}: no está")
                    continue
                notas = guardar_svg(found, plan, ctx, name)
            except FetchError as e:
                fila["traza"].append(f"{fuente}: {e}")
                continue
            hechos.add(plan["slug"])
            extra = [f"sin icono propio: uso el de {plan['name']}"] if i else []
            fila.update(slug=plan["slug"], source=fuente, file=f"{ctx.out.name}/{plan['slug']}.svg",
                        notas=extra + [found["detalle"]] + notas)
            return fila

    # Último recurso bueno: el icono oficial que publica la web de la herramienta
    for plan in planes:
        url = plan["web"] or (f"https://{plan['domain']}/" if plan["domain"] else None)
        if not url:
            continue
        try:
            found = desde_web(plan, url)
            if not found:
                fila["traza"].append(f"web {url}: sin icono útil")
                continue
            notas = guardar_svg(found, plan, ctx, name) if "svg" in found else guardar_png(found, plan, ctx, name)
        except FetchError as e:
            fila["traza"].append(f"web {url}: {e}")
            continue
        hechos.add(plan["slug"])
        ext = "svg" if "svg" in found else "png"
        fila.update(slug=plan["slug"], source="web", file=f"{ctx.out.name}/{plan['slug']}.{ext}",
                    notas=[url] + notas)
        return fila

    for plan in planes:
        if not plan["domain"]:
            continue
        try:
            found = desde_favicon(plan)
            notas = guardar_png(found, plan, ctx, name)
        except FetchError as e:
            fila["traza"].append(f"favicon {plan['domain']}: {e}")
            continue
        hechos.add(plan["slug"])
        fila.update(slug=plan["slug"], source="favicon", file=f"{ctx.out.name}/{plan['slug']}.png",
                    notas=[plan["domain"]] + notas)
        return fila
    if not any(p["domain"] for p in planes):
        fila["traza"].append("favicon: sin dominio (usa --domain nombre=dominio.com)")

    cands = parecidos(norm(name), ctx)
    fila.update(slug=base, source="NOT FOUND",
                notas=["parecidos: " + ", ".join(cands) if cands else "sin índices para sugerir"])
    return fila


# ---------------------------------------------------------------------------------------------
# Salida por consola
# ---------------------------------------------------------------------------------------------
def tabla(cabecera: list[str], filas: list[list]) -> None:
    anchos = [max(len(str(x)) for x in col) for col in zip(cabecera, *filas)]
    print("  ".join(h.ljust(a) for h, a in zip(cabecera, anchos)).rstrip())
    print("  ".join("-" * a for a in anchos))
    for f in filas:
        print("  ".join(str(x).ljust(a) for x, a in zip(f, anchos)).rstrip())


def mostrar_registro(out: Path) -> None:
    reg = load_registry(out)
    if not reg:
        print(f"El registro está vacío ({out / REGISTRO}).")
        return
    filas = []
    for slug, e in sorted(reg.items()):
        falta = "" if (out / Path(e.get("file", "")).name).is_file() else " (¡falta!)"
        alias = ", ".join(a for a in e.get("aliases", []) if a != e.get("name"))
        filas.append([slug, e.get("name", ""), e.get("source", ""), e.get("quality", ""),
                      "sí" if e.get("mono") else "", e.get("color") or "", e.get("file", "") + falta,
                      "sí" if e.get("wordmark") else "", alias if len(alias) <= 48 else alias[:45] + "..."])
    tabla(["slug", "nombre", "fuente", "calidad", "mono", "color", "archivo", "letras", "alias"], filas)
    print(f"\n{len(reg)} logos en {out / REGISTRO}")


def mostrar_resolve(nombres: list[str], out: Path) -> None:
    reg = load_registry(out)
    for n in nombres:
        slug, e = find_in_registry(n, reg)
        if e:
            print(f"{n} -> {slug}: {e['file']} ({e['source']}, calidad {e['quality']})")
        else:
            s, conocido = resolve_slug(n)
            print(f"{n} -> no está en el registro (sería '{s}'{'' if conocido else ', nombre desconocido'})")


def parse_domains(parser: argparse.ArgumentParser, items: list[str]) -> dict[str, str]:
    domains = {}
    for item in items:
        name, sep, dom = item.partition("=")
        dom = re.sub(r"^https?://", "", dom.strip().lower()).split("/")[0]
        if not sep or not norm(name) or not re.fullmatch(r"[a-z0-9.-]+\.[a-z]{2,}", dom):
            parser.error(f"--domain espera nombre=dominio.com (recibido {item!r})")
        domains[norm(name)] = dom
        domains.setdefault(resolve_slug(name)[0], dom)
    return domains


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):  # UTF-8 también al redirigir (en Windows sería cp1252)
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    parser = argparse.ArgumentParser(
        description="Descarga logos de herramientas (IA/tech) listos para fondo oscuro #0a0c10.",
        epilog='Ejemplo: python logos.py "Claude Code" n8n ChatGPT --domain HeyGen=heygen.com')
    parser.add_argument("names", nargs="*", help="nombres de herramientas, p. ej. \"Claude Code\" n8n ChatGPT")
    parser.add_argument("--out", type=Path, default=OUT_DEFECTO, help=f"carpeta de salida (por defecto {OUT_DEFECTO})")
    parser.add_argument("--force", action="store_true", help="volver a descargar aunque ya esté en el registro")
    parser.add_argument("--domain", action="append", default=[], metavar="NOMBRE=DOMINIO",
                        help="dominio para el favicon de reserva (se puede repetir)")
    parser.add_argument("--list", action="store_true", help="mostrar el registro")
    parser.add_argument("--resolve", nargs="+", metavar="NOMBRE", help="a qué logo del registro lleva cada alias")
    args = parser.parse_args(argv)
    if not (args.names or args.list or args.resolve):
        parser.print_help()
        return 2
    out = args.out.expanduser().resolve()
    domains = parse_domains(parser, args.domain)

    if args.names:
        try:
            out.mkdir(parents=True, exist_ok=True)
        except OSError as e:
            print(f"error: no se puede crear {out}: {e}", file=sys.stderr)
            return 1
        ctx, hechos, filas = Contexto(out, domains), set(), []
        for i, name in enumerate(args.names, 1):
            try:
                fila = procesar(name.strip(), ctx, args.force, hechos)
            except OSError as e:  # disco lleno, archivo bloqueado...: se informa y se sigue con el resto
                fila = {"name": name.strip(), "slug": "-", "source": "ERROR", "file": "-", "traza": [],
                        "notas": [f"no se pudo escribir en {out}: {e}"]}
            filas.append(fila)
            print(f"[{i}/{len(args.names)}] {fila['name']} -> {fila['slug']}: {fila['source']}", flush=True)
        print()
        tabla(["Nombre", "Slug", "Fuente", "Archivo", "Notas"],
              [[f["name"], f["slug"], f["source"], f["file"], "; ".join(f["notas"])] for f in filas])
        for f in filas:
            if f["source"] == "NOT FOUND":
                print(f"\n{f['name']}: " + " | ".join(f["traza"]))
        print(f"\nRegistro: {out / REGISTRO} ({len(ctx.registry)} logos)")

    if args.resolve:
        mostrar_resolve(args.resolve, out)
    if args.list:
        mostrar_registro(out)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nInterrumpido. Lo ya descargado queda guardado en el registro.")
        sys.exit(130)
