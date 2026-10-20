"""Último recurso para logos: el icono oficial que publica la web de la herramienta.

Uso suelto:
    python logo_web.py https://stitch.withgoogle.com/ salida_sin_extension

Mira los <link rel="icon"/"apple-touch-icon"> y el manifest de la página, y también las URLs
de favicons que aparezcan en el HTML (p. ej. favicon-512x512.png). Se queda con el mejor:
SVG si hay; si no, el PNG más grande. Si la web ofrece versiones clara/oscura, elige la
pensada para fondo oscuro.
"""
import json
import re
import struct
import sys
import urllib.parse
import urllib.request

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36"


def bajar(url, timeout=15):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), r.geturl()


def medida_png(datos):
    if datos[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    w, h = struct.unpack(">II", datos[16:24])
    return w, h


def candidatos(url):
    html, final = bajar(url)
    html = html.decode("utf-8", "replace")
    cands = []
    for tag in re.findall(r"<link\b[^>]*>", html, flags=re.I):
        rel = (re.search(r'rel=["\']([^"\']+)', tag, re.I) or [None, ""])[1].lower()
        href = (re.search(r'href=["\']([^"\']+)', tag, re.I) or [None, ""])[1]
        if not href:
            continue
        if "manifest" in rel:
            try:
                man, man_url = bajar(urllib.parse.urljoin(final, href))
                for ic in json.loads(man).get("icons", []):
                    tam = max((int(x) for x in re.findall(r"(\d+)x\d+", ic.get("sizes", ""))), default=0)
                    cands.append({"url": urllib.parse.urljoin(man_url, ic["src"]), "tam": tam, "oscuro": False})
            except Exception:
                pass
            continue
        if "icon" not in rel:
            continue
        tam = max((int(x) for x in re.findall(r'sizes=["\'](\d+)x\d+', tag, re.I)), default=0)
        media = (re.search(r'media=["\']([^"\']+)', tag, re.I) or [None, ""])[1]
        cands.append({"url": urllib.parse.urljoin(final, href), "tam": tam, "oscuro": "dark" in media})
    # Favicons grandes que aparecen en el HTML aunque no estén en <link>
    for m in re.finditer(r'((?:https?:)?//[^\s"\'<>]+?favicon[-_]?(\d+)x\d+\.png)', html):
        cands.append({"url": urllib.parse.urljoin(final, m.group(1)), "tam": int(m.group(2)), "oscuro": False})
    # Rutas habituales que muchas webs sirven aunque no las enlacen
    for ruta, tam in (("/favicon.svg", 0), ("/icon.svg", 0), ("/apple-touch-icon.png", 180)):
        cands.append({"url": urllib.parse.urljoin(final, ruta), "tam": tam, "oscuro": False})
    return cands


def mejor_icono(url):
    """Devuelve (bytes, extension, url_origen, (ancho, alto) o None) del mejor icono, o None."""
    cands = candidatos(url)
    # Orden: SVG primero, luego versión para fondo oscuro, luego tamaño declarado
    cands.sort(key=lambda c: (c["url"].lower().split("?")[0].endswith(".svg"), c["oscuro"], c["tam"]), reverse=True)
    vistos = set()
    mejor = None
    for c in cands:
        if c["url"] in vistos:
            continue
        vistos.add(c["url"])
        try:
            datos, _ = bajar(c["url"])
        except Exception:
            continue
        if b"<svg" in datos[:2000].lower():
            return datos, "svg", c["url"], None
        medida = medida_png(datos)
        if medida and (mejor is None or (c["oscuro"], medida[0]) > (mejor[4], mejor[3][0])):
            mejor = (datos, "png", c["url"], medida, c["oscuro"])
    return mejor[:4] if mejor else None


if __name__ == "__main__":
    r = mejor_icono(sys.argv[1])
    if not r:
        print("No se ha encontrado ningún icono")
        sys.exit(1)
    datos, ext, origen, medida = r
    destino = f"{sys.argv[2]}.{ext}"
    open(destino, "wb").write(datos)
    print(f"OK: {destino} ({ext}, {medida}) desde {origen}")
