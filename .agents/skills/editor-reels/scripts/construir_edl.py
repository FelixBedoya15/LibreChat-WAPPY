"""Convierte el guion creativo de un reel en el EDL que lee Remotion.

Uso:
    python construir_edl.py <reel>        (desde la carpeta del proyecto)

Lee (en trabajo/<reel>/):
    transcripcion_base.json  palabras con tiempos del vídeo base ya limpio
    cortes.json              tramos conservados (para los saltos de zoom)
    guion.json               decisiones creativas: capítulos, elementos, palabras clave, zooms
y el registro de logos (editor/public/logos/logos.json).
Escribe editor/public/reels/<reel>/edl.json.

Lo mecánico lo hace este script: agrupar subtítulos, corregir palabras, colocar los zooms en
cada corte y poner los efectos de sonido a cada animación.
"""
import json
import re
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path

RAIZ = Path.cwd()  # se ejecuta desde la carpeta del proyecto de reels
MAX_CHARS_LINEA = 16
MAX_LINEAS = 2
MAX_DUR_PAGINA = 2.2
# Palabras de enlace con las que nunca debe terminar una página de subtítulos
ENLACES = {"de", "del", "la", "el", "los", "las", "en", "un", "una", "y", "e", "a", "al", "con", "por",
           "para", "que", "lo", "su", "sus", "sin", "o", "se", "te", "mi", "tu"}
# Icono de cada tipo de pieza en la pieza "sincronia" (la línea de tiempo del propio reel)
ICONO_TIPO = {"portada": "type", "tiempo": "scissors", "visor": "zoom", "logo": "image", "logos": "image",
              "ecosistema": "share", "lista": "check", "chips": "sparkle", "convergencia": "brain",
              "mockup": "monitor", "pipeline": "git", "cta": "msg", "pantalla": "monitor"}


def norm(s):
    s = unicodedata.normalize("NFKD", s.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in s if not unicodedata.combining(c)))


def limpiar(texto):
    return texto.strip().strip(".,;:")


def resolver_logos(nombres, registro):
    """clave -> ruta del logo dentro de public/, buscando por slug, nombre o alias."""
    indice = {}
    for slug, e in registro.items():
        for n in [slug, e.get("name", "")] + list(e.get("aliases", [])):
            indice.setdefault(norm(n), e["file"])
    salida = {}
    for clave, nombre in nombres.items():
        ruta = indice.get(norm(nombre)) or indice.get(norm(clave))
        if not ruta:
            print(f"[aviso] sin logo para {clave!r} ({nombre}); ejecuta herramientas/logos.py", file=sys.stderr)
            continue
        salida[clave] = ruta
    return salida


def palabras_base(trans, cortes, guion):
    corr = {norm(k): v for k, v in guion.get("correcciones", {}).items()}
    offsets = [tr["offset"] for tr in cortes["tramos"]][1:]
    out = []
    for w in trans["palabras"]:
        texto = limpiar(w["word"])
        if not texto:
            continue
        clave = norm(texto)
        if clave in corr:
            texto = corr[clave]
        i, f = w["start"], w["end"]
        # Whisper adelanta la primera palabra tras un corte; la llevamos al inicio real del tramo
        for off in offsets:
            if i < off < f:
                i = off + 0.05
        tramo = sum(1 for off in offsets if i >= off)
        out.append({"t": texto, "i": round(i, 3), "f": round(f, 3), "fin_frase": w["word"].strip()[-1:] in ".?!",
                    "coma": w["word"].strip()[-1:] in ",;:", "tramo": tramo})
    for regla in guion.get("destacar", []):
        pal, desde, hasta = regla[0], (regla[1] if len(regla) > 1 else -1), (regla[2] if len(regla) > 2 else 1e9)
        for w in out:
            if norm(w["t"]) == norm(pal) and desde <= w["i"] <= hasta:
                w["d"] = True
    return out


def partir_lineas(ws):
    lineas, actual, n = [], [], 0
    for w in ws:
        extra = len(w["t"]) + (1 if actual else 0)
        if actual and n + extra > MAX_CHARS_LINEA:
            lineas.append(actual)
            actual, n = [], 0
            extra = len(w["t"])
        actual.append(w)
        n += extra
    if actual:
        lineas.append(actual)
    return lineas


def paginar(palabras, partir_en=()):
    paginas, actual = [], []

    def cerrar(pag):
        """Guarda la página sin dejarla colgando en una palabra de enlace; devuelve lo arrastrado."""
        arrastre = []
        while len(pag) > 1 and norm(pag[-1]["t"]) in ENLACES:
            arrastre.insert(0, pag.pop())
        paginas.append(pag)
        return arrastre

    # Cortes de página forzados desde el guion: antes de la palabra que empieza más cerca de cada tiempo
    forzados = {min(range(len(palabras)), key=lambda k: abs(palabras[k]["i"] - t)) for t in partir_en} if palabras else set()
    for idx, w in enumerate(palabras):
        forzar = idx in forzados
        if actual and (actual[-1]["tramo"] != w["tramo"] or forzar):  # cada corte del vídeo abre página
            paginas.append(actual)
            actual = []
        if actual and len(partir_lineas(actual + [w])) > MAX_LINEAS:
            actual = cerrar(actual)
        actual.append(w)
        dur = actual[-1]["f"] - actual[0]["i"]
        if w["fin_frase"]:
            paginas.append(actual)
            actual = []
        elif (w["coma"] and len(actual) >= 2) or dur > MAX_DUR_PAGINA:
            actual = cerrar(actual)
    if actual:
        paginas.append(actual)
    salida = []
    for k, pag in enumerate(paginas):
        i = pag[0]["i"]
        fin = pag[-1]["f"] + 0.25
        if k + 1 < len(paginas):
            sig = paginas[k + 1][0]["i"]
            fin = sig if sig - pag[-1]["f"] < 0.6 else pag[-1]["f"] + 0.25
        lineas = [[{k2: v for k2, v in w.items() if k2 in ("t", "i", "f", "d")} for w in linea]
                  for linea in partir_lineas(pag)]
        salida.append({"i": round(i, 3), "f": round(fin, 3), "lineas": lineas})
    return salida


def quitar_repetidas_por_sello(paginas, elementos):
    """Si una palabra destacada ya dice lo mismo que el subtítulo (p. ej. GRATIS), el subtítulo sobra mientras dure.
    Mientras hay una portada (título de los primeros segundos) no hay subtítulos: la portada es el texto."""
    sellos = [e for e in elementos if e["tipo"] == "destacado"]
    portadas = [e for e in elementos if e["tipo"] == "portada"]
    paginas = [p for p in paginas if not any(p["i"] < e["f"] and p["f"] > e["i"] for e in portadas)]
    salida = []
    for p in paginas:
        palabras = [norm(w["t"]) for linea in p["lineas"] for w in linea]
        repetida = False
        for s in sellos:
            if p["i"] < s["f"] and p["f"] > s["i"]:
                texto = [norm(x) for x in s["texto"].split()]
                comunes = sum(1 for w in palabras if len(w) > 2 and any(t.startswith(w) or w.startswith(t) for t in texto))
                utiles = sum(1 for w in palabras if len(w) > 2) or 1
                repetida = repetida or comunes / utiles >= 0.5
        if not repetida:
            salida.append(p)
    return salida


def duracion_original(trabajo, cortes, encuadre):
    """Duración del vídeo en bruto (para la pieza "tiempo")."""
    if encuadre and encuadre.get("fuente", {}).get("duracion"):
        return encuadre["fuente"]["duracion"]
    try:
        video = json.load(open(trabajo / "reel.json", encoding="utf-8"))["video"]
        return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                     video], capture_output=True, text=True).stdout)
    except (OSError, ValueError, KeyError):
        return max(tr["fin"] for tr in cortes["tramos"])


def completar_piezas(elementos, cortes, total_original):
    """Rellena con los datos reales del reel las piezas que los enseñan: "tiempo" (los trozos que se conservan
    del vídeo en bruto) y "sincronia" (dónde empieza cada pieza del guion). Lo que ya venga en el guion se respeta."""
    tramos = cortes["tramos"]
    for el in elementos:
        if el["tipo"] == "tiempo":
            el.setdefault("bloques", [[tr["inicio"], tr["fin"]] for tr in tramos])
            el.setdefault("total", round(total_original, 2))
            el.setdefault("final", cortes["duracion"])
        elif el["tipo"] == "sincronia":
            el.setdefault("total", cortes["duracion"])
            el.setdefault("bloques", [[tr["offset"], round(tr["offset"] + tr["fin"] - tr["inicio"], 3)] for tr in tramos])
            el.setdefault("barrido", [round(el["i"] + 0.15, 3), round(el["f"] - 0.45, 3)])
            if "marcas" not in el:
                separacion = 70 / (780 / el["total"])  # segundos que ocupa un icono en la pista (780 px, como TARJETA.pista)
                marcas = []
                for otro in sorted(elementos, key=lambda e: e["i"]):
                    if otro is el:
                        continue
                    icono = (otro.get("icono") if otro["tipo"] == "destacado" else None) or                         ICONO_TIPO.get(otro["tipo"], "sparkle")
                    if not marcas or otro["i"] - marcas[-1]["t"] >= separacion:
                        marcas.append({"t": round(otro["i"], 3), "icono": icono})
                el["marcas"] = marcas


def sfx_para(el):
    """Efectos de sonido por defecto de cada tipo de animación (con cuentagotas). "sonidos" en la pieza los sustituye."""
    if "sonidos" in el:
        return [tuple(x) for x in el["sonidos"]]
    s = []
    tipo = el["tipo"]
    if tipo == "logo":
        s.append(("sfx/pop.wav", el["i"], 0.45))
        if "acoplar" in el:
            s.append(("sfx/whoosh.wav", el["acoplar"], 0.3))
    elif tipo == "ecosistema":
        s += [("sfx/pop.wav", e, 0.28) for e in el["entradas"]]
    elif tipo == "destacado":
        s += [("sfx/whoosh.wav", el["i"] - 0.05, 0.25), ("sfx/exito.wav", el["i"] + 0.05, 0.45)]
    elif tipo == "lista":
        s += [("sfx/check.wav", it["en"] + 0.13, 0.45) for it in el["items"]]
    elif tipo == "chips":
        s += [("sfx/blip.wav", it["en"], 0.35) for it in el["items"]]
    elif tipo == "convergencia":
        s += [("sfx/whip.wav", el["unir"], 0.3), ("sfx/pop.wav", el["final"]["en"], 0.5)]
    elif tipo == "mockup":
        s.append(("sfx/whoosh.wav", el["i"], 0.25))
        if el["appEn"] < el["f"]:
            s.append(("sfx/switch.wav", el["appEn"], 0.35))
        s += [("sfx/blip.wav", r["en"], 0.3) for r in el.get("resaltes", [])]
        if "totalEn" in el:
            s.append(("sfx/ding.wav", el["totalEn"] + 0.9, 0.22))
    elif tipo == "pipeline":
        s += [("sfx/blip.wav", n["en"], 0.35) for n in el["nodos"]]
    elif tipo == "cta":
        s.append(("sfx/whoosh.wav", el["i"], 0.3))
        s += [("sfx/mouse-click.wav", el["escribirEn"] + k * 0.1, 0.18) for k in range(len(el["palabra"]))]
        s.append(("sfx/ding.wav", el["escribirEn"] + len(el["palabra"]) * 0.1, 0.4))
    elif tipo == "pantalla" and el.get("entra", True):
        s.append(("sfx/whoosh.wav", el["i"], 0.22))
    elif tipo == "tiempo":
        s.append(("sfx/whoosh.wav", el["i"], 0.22))
        if "pausasEn" in el:
            s.append(("sfx/blip.wav", el["pausasEn"], 0.3))
        s.append(("sfx/whip.wav", el["juntarEn"], 0.35))
    elif tipo == "sincronia":
        s.append(("sfx/whoosh.wav", el["i"], 0.2))
        b0, b1 = el["barrido"]
        s += [("sfx/blip.wav", b0 + m["t"] / el["total"] * (b1 - b0), 0.2) for m in el["marcas"]]
    elif tipo == "visor":
        s.append(("sfx/whoosh.wav", el["i"] - 0.03, 0.25))
    elif tipo == "logos":
        s += [("sfx/pop.wav", it["en"], 0.45) for it in el["items"]]
    return s


def preparar_pantallas(elementos, encuadre, reel):
    """Piezas "pantalla" (grabaciones dobles): fuente, burbuja de la cara y relevos sin animación entre piezas seguidas."""
    pantallas = sorted((e for e in elementos if e["tipo"] == "pantalla"), key=lambda e: e["i"])
    if not pantallas:
        return {}
    video = RAIZ / "editor" / "public" / "reels" / reel / "pantalla.mp4"
    if not (encuadre and encuadre.get("pantalla") and video.exists()):
        print("[aviso] hay piezas 'pantalla' pero este reel no es una grabación doble (falta pantalla.mp4): "
              "no se verán", file=sys.stderr)
        return {}
    p = encuadre["pantalla"]
    for e in pantallas:
        for v in e["vistas"]:
            if v["x"] < 0 or v["y"] < 0 or v["x"] + v["w"] > p["ancho"] + 1 or v["y"] + v["h"] > p["alto"] + 1:
                print(f"[aviso] pantalla en {e['i']}: la vista {v} se sale de {p['ancho']}x{p['alto']}", file=sys.stderr)
    for a, b in zip(pantallas, pantallas[1:]):  # una detrás de otra: la tarjeta se queda y cambia el contenido
        if b["i"] - a["f"] < 0.1:
            a["sale"], b["entra"] = False, False
    extra = {"pantalla": {"src": f"reels/{reel}/pantalla.mp4", "ancho": p["ancho"], "alto": p["alto"]}}
    if encuadre.get("cara_base"):
        extra["caraBase"] = encuadre["cara_base"]
    return extra


def main():
    reel = sys.argv[1] if len(sys.argv) > 1 else "prueba"
    trabajo = RAIZ / "trabajo" / reel
    trans = json.load(open(trabajo / "transcripcion_base.json", encoding="utf-8"))
    cortes = json.load(open(trabajo / "cortes.json", encoding="utf-8"))
    guion = json.load(open(trabajo / "guion.json", encoding="utf-8"))
    enc_path = trabajo / "encuadre.json"
    encuadre = json.load(open(enc_path, encoding="utf-8")) if enc_path.exists() else None
    reg_path = RAIZ / "editor" / "public" / "logos" / "logos.json"
    registro = json.load(open(reg_path, encoding="utf-8")) if reg_path.exists() else {}

    completar_piezas(guion["elementos"], cortes, duracion_original(trabajo, cortes, encuadre))
    palabras = palabras_base(trans, cortes, guion)
    paginas = paginar(palabras, guion.get("partir_subtitulos_en", []))
    paginas = quitar_repetidas_por_sello(paginas, guion["elementos"])

    tramos = cortes["tramos"]
    zooms = []
    for k, tr in enumerate(tramos):
        e0, e1 = guion["zooms"][k] if k < len(guion["zooms"]) else (1.0, 1.03)
        fin = tramos[k + 1]["offset"] if k + 1 < len(tramos) else cortes["duracion"] + 1
        zooms.append({"i": tr["offset"], "f": fin, "e0": e0, "e1": e1})

    extra_pantalla = preparar_pantallas(guion["elementos"], encuadre, reel)
    sfx = []
    for el in guion["elementos"]:
        sfx += [{"src": s, "en": round(en, 3), "vol": v} for s, en, v in sfx_para(el)]
    sfx.sort(key=lambda x: x["en"])

    capitulos = []
    for c in guion["capitulos"]:
        c = dict(c)
        c["titulo"] = c["titulo"].upper()
        capitulos.append(c)

    musica = None
    if guion.get("musica", {}).get("archivo"):
        origen = Path(guion["musica"]["archivo"])
        origen = origen if origen.is_absolute() else RAIZ / origen
        destino_m = RAIZ / "editor" / "public" / "reels" / reel / ("musica" + origen.suffix.lower())
        destino_m.parent.mkdir(parents=True, exist_ok=True)
        if origen.exists():
            shutil.copyfile(origen, destino_m)
            musica = {"src": f"reels/{reel}/{destino_m.name}", "vol": guion["musica"].get("volumen", 0.1)}
        else:
            print(f"[aviso] no encuentro la música {origen}", file=sys.stderr)

    # Dónde va el vídeo en el lienzo: de encuadre.py (cara fuera de las zonas de texto y gráficos) o, con
    # "encuadre": "completo" (vídeo vertical de móvil), a pantalla completa, tal cual se grabó
    if encuadre and guion.get("encuadre") != "completo":
        ancla = guion.get("anclaY", encuadre["anclaY"])
        marco = dict(encuadre["marco"], relleno=guion.get("relleno", "estirar"))
    else:
        ancla = guion.get("anclaY", 0.4)
        marco = {"ancho": 1080, "alto": 1920, "arriba": 0, "izquierda": 0, "relleno": "oscuro"}
    edl = {
        "video": guion.get("video", f"reels/{reel}/base.mp4"),
        "duracion": cortes["duracion"],
        "fps": cortes.get("fps", 30),
        "anclaY": ancla,
        "marco": marco,
        "zooms": zooms,
        "paginas": paginas,
        "capitulos": capitulos,
        "elementos": guion["elementos"],
        "sfx": sfx,
        "logos": resolver_logos(guion.get("logos", {}), registro),
    }
    if musica:
        edl["musica"] = musica
    edl.update(extra_pantalla)
    destino = RAIZ / "editor" / "public" / "reels" / reel / "edl.json"
    destino.parent.mkdir(parents=True, exist_ok=True)
    json.dump(edl, open(destino, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"OK: {destino.relative_to(RAIZ)} · {len(paginas)} páginas de subtítulos · "
          f"{len(guion['elementos'])} elementos · {len(sfx)} sonidos · logos: {', '.join(edl['logos']) or 'ninguno'}")
    for p in paginas:
        print(f"  {p['i']:6.2f}-{p['f']:6.2f}  " + " / ".join(" ".join(
            (w['t'].upper() + ('*' if w.get('d') else '')) for w in linea) for linea in p["lineas"]))


if __name__ == "__main__":
    main()
