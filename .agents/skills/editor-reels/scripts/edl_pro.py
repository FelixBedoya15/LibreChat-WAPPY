"""Convierte el guion "pro" de un reel en el EDL que lee Remotion (composición ReelPro).

Uso (desde la carpeta del proyecto):
    python edl_pro.py <reel>

Lee, en trabajo/<reel>/:
    guion_pro.json            decisiones creativas: piezas, capítulos, encuadres, subtítulos y sonidos
    alineacion/tiempos.json   inicio y fin exactos de cada palabra (reel.py alinear)
    cortes.json               tramos conservados (para los saltos de encuadre)
    encuadre.json             dónde va el vídeo en el lienzo
y editor/public/logos/logos.json, editor/public/sfx2/sonidos.json y marca.json.
Escribe editor/public/reels/<reel>/edl_pro.json (y edl_portada.json si el guion trae "portada") e imprime:
    - los subtítulos, página a página;
    - la tabla de sincronía: cada cosa que entra, con la palabra que suena en ese instante;
    - avisos: piezas que se pisan, cosas que se ven poco tiempo, golpes graves seguidos, logos que faltan…

Lo mecánico lo hace este script: paginar los subtítulos, encender las palabras del titular, convertir los títulos
("¿CUÁNTO *CUESTA*?"), poner el sonido de cada entrada, quitar el fundido de la pieza que tapa una escena y
esconder los subtítulos mientras una pieza ya es el texto.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

RAIZ = Path.cwd()
ENLACES = {"de", "del", "la", "el", "los", "las", "en", "un", "una", "y", "e", "a", "al", "con", "por", "para", "que",
           "lo", "su", "sus", "sin", "o", "se", "te", "mi", "tu", "es", "ha", "me", "no", "más"}
ESCENAS = {"revelado", "escena"}  # piezas a pantalla completa (más las que lleven "pantalla": true)
# Campos que son un instante en el que entra algo (para la tabla de sincronía y los avisos)
EVENTOS = {"en", "golpe", "marcaEn", "lineaEn", "cierraEn", "escribirEn", "aparece", "seUne", "blancoEn"}
PULSOS = {"golpe", "marcaEn", "cierraEn", "blancoEn"}  # animan algo que ya está en pantalla: no hay nada nuevo que leer
LISTAS = {"lista", "logos", "columnas", "filas", "monedas"}  # piezas con varios elementos: completas, piden 2 s
DESPLAZAR_Y = -60  # px que sube la cara respecto al encuadre clásico: deja 85 px entre la barbilla y la pieza


def norm(s):
    s = unicodedata.normalize("NFKD", str(s).lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in s if not unicodedata.combining(c)))


def es_escena(p):
    return p["tipo"] in ESCENAS or bool(p.get("pantalla"))


# ---- subtítulos ------------------------------------------------------------------------------------------------
def partir_lineas(ws, max_linea):
    """Una o dos líneas equilibradas. Evita acabar la primera en una palabra de enlace si hay otra opción."""
    textos = [w["t"] for w in ws]
    total = len(" ".join(textos))
    if total <= max_linea or len(ws) == 1:
        return [ws]
    mejor, coste_mejor = None, 1e9
    for k in range(1, len(ws)):
        a, b = len(" ".join(textos[:k])), len(" ".join(textos[k:]))
        if a > max_linea or b > max_linea:
            continue
        # No acabar la primera línea en una palabra de enlace («QUE HACE LAS / COSAS») ni partir un nombre propio
        # de dos palabras («ESTADOS / UNIDOS»)
        nombre = textos[k - 1][:1].isupper() and textos[k][:1].isupper() and k - 1 > 0
        coste = abs(a - b) + (9 if norm(textos[k - 1]) in ENLACES else 0) + (8 if nombre else 0)
        if coste < coste_mejor:
            mejor, coste_mejor = k, coste
    if mejor is None:
        return None  # no cabe en dos líneas
    return [ws[:mejor], ws[mejor:]]


def paginar(palabras, cfg, offsets):
    max_linea = cfg.get("max_linea", 18)
    max_dur = cfg.get("max_dur", 2.3)
    partir = set(cfg.get("partir_antes", []))
    unir = set(cfg.get("no_partir_antes", []))
    paginas, actual = [], []

    def tramo(t):
        return sum(1 for o in offsets if t >= o - 1e-6)

    def cerrar(pag):
        arrastre = []
        while len(pag) > 1 and norm(pag[-1]["t"]) in ENLACES and pag[-1]["idx"] + 1 not in partir:
            arrastre.insert(0, pag.pop())
        paginas.append(pag)
        return arrastre

    for w in palabras:
        if actual:
            ant = actual[-1]
            if w["idx"] in partir or w["frase"] != ant["frase"] or tramo(w["i"]) != tramo(ant["i"]):
                paginas.append(actual)
                actual = []
            elif w["idx"] in unir:
                pass
            elif partir_lineas(actual + [w], max_linea) is None or w["f"] - actual[0]["i"] > max_dur or w["i"] - ant["f"] > 0.5:
                actual = cerrar(actual)
        actual.append(w)
    if actual:
        paginas.append(actual)
    return [p for p in paginas if p]


# ---- ayudas para escribir menos en el guion ----------------------------------------------------------------------
def trozos(titulo):
    """"¿CUÁNTO *CUESTA*?\\nAHORA" -> [[{t}, {t, azul}, {t}], [{t}]] (asteriscos = color de acento)."""
    if not isinstance(titulo, str):
        return titulo
    lineas = []
    for linea in titulo.split("\n"):
        partes = linea.split("*")
        lineas.append([{"t": x, **({"azul": True} if k % 2 else {})} for k, x in enumerate(partes) if x])
    return lineas


def palabras_titular(p, tiempos):
    """Líneas escritas como {"texto": "ACABA DE SOLTAR"}: cada palabra se enciende cuando se dice (si se dice)."""
    cursor = 0
    candidatas = [w for w in tiempos if p["i"] - 0.3 <= w["s"] <= p["f"] + 0.6]
    for linea in p.get("lineas", []):
        if "palabras" in linea or "texto" not in linea:
            continue
        palabras = []
        for txt in linea["texto"].split():
            hallada = next((k for k in range(cursor, len(candidatas)) if norm(candidatas[k]["w"]) == norm(txt)), None)
            if hallada is None:
                palabras.append({"t": txt, "i": 999, "f": 999})
            else:
                w = candidatas[hallada]
                palabras.append({"t": txt, "i": w["s"], "f": w["e"]})
                cursor = hallada + 1
        for a, b in zip(palabras, palabras[1:]):  # encendida hasta que empieza la siguiente
            if a["i"] < 900 and b["i"] < 900:
                a["f"] = b["i"]
        linea["palabras"] = palabras
        del linea["texto"]


# ---- sonidos: uno discreto por cada cosa que entra ------------------------------------------------------------------
def sonidos_auto(p, sigue_escena):
    """Sonidos por defecto de una pieza: (nombre, instante del golpe, volumen[, duración]).
    "sonidos" dentro de la pieza los sustituye ([] la deja en silencio). Golpes graves, solo en lo importante."""
    if "sonidos" in p:
        return [tuple(x) for x in p["sonidos"]]
    t, s = p["tipo"], []
    i, f = p["i"], p["f"]
    if t == "titular":
        if "golpe" in p:
            s.append(("golpe", p["golpe"], 0.5))
    elif t == "revelado":
        if i > 0.05:
            s.append(("barrido", i - 0.12, 0.5))
        s += [("tick", w["en"], 0.9) for w in p.get("linea1", [])]
        if p.get("linea2"):
            e = p["linea2"]["en"]
            s += [("swell", e, 0.5), ("golpe-grave", e, 0.6), ("brillo", e + 0.05, 0.5)]
    elif t == "presentacion":
        s.append(("aire", p["propio"]["en"], 0.7))
        if p.get("nexo"):
            s.append(("aire", p["nexo"]["en"], 0.45))
        s += [("tick", x["en"], 1.0) for x in p.get("items", [])]
    elif t == "columnas":
        s.append(("aire", i + 0.12, 0.7))
        for c in p["columnas"]:
            s += [("tick-suave", c["en"], 1.0), ("golpe-corto", c["en"] + 0.45, 0.3)]
        if "lineaEn" in p:
            s.append(("barrido", p["lineaEn"], 0.35))
    elif t == "cambio":
        s += [("aire", i + 0.14, 0.6), ("aire", p["despues"]["en"] - 0.03, 0.4)]
        s += [("tick", x["en"], 1.2) for x in p["filas"]]
        if p.get("nota"):
            s.append(("tick-suave", p["nota"]["en"], 0.9))
    elif t == "sentencia":
        s.append(("aire", p["caja"]["en"], 0.6))
        cierre = p.get("cierraEn", p["caja"]["en"] + 0.2)
        if p.get("icono", "candado") == "candado":
            s += [("click", cierre, 1.0), ("descarte", cierre, 0.5)]
        if p.get("linea"):
            s.append(("golpe-corto", p["linea"]["en"], 0.4))
        else:  # la caja sola es el remate de la frase: un golpe en su palabra
            s.append(("golpe", p["caja"]["en"], 0.5))
        if p.get("pie"):
            s.append(("tick-suave", p["pie"]["en"], 0.8))
    elif t == "campo":
        s.append(("aire", i + 0.2, 0.6))
        if p.get("vias"):
            s.append(("aire", p["vias"]["en"], 0.4))
            s += [("tick", x["en"], 1.2) for x in p["vias"]["items"]]
        s.append(("descarte", p["campo"]["en"], 0.55))
    elif t == "pregunta":
        s.append(("aire", i + 0.18, 0.6))
        if p.get("grupo"):
            s += [("tick", p["grupo"]["nuevo"]["aparece"], 0.8), ("golpe-corto", p["grupo"]["nuevo"]["seUne"] + 0.26, 0.48)]
        s += [("tick", x["en"], 1.0) for x in p["opciones"]]
    elif t == "comenta":
        s += [("aire", i + 0.13, 0.5), ("tecleo", p["escribirEn"], 0.7, round(len(p["texto"]) / p.get("cps", 14) + 0.12, 2))]
    elif t == "acciones":
        s.append(("aire", i + 0.14, 0.5))
        s += [("tick", x["en"], 1.2) for x in p["items"][:-1]]
        if p["items"]:
            ult = p["items"][-1]["en"]
            s += [("click", ult, 1.0), ("nota-doble", ult + 0.07, 0.6)]
    elif t == "lista":
        s.append(("aire", i + 0.14, 0.6))
        for x in p["items"]:
            s += [("tick", x["en"], 1.0), ("nota", x["en"], 0.5)]
    elif t == "logos":
        s.append(("aire", i + 0.14, 0.5))
        s += [("tick", x["en"], 1.0) for x in p["items"]]
    elif t == "escena":
        if i > 0.05:
            s.append(("barrido", i - 0.12, 0.5))
        if p.get("sub", {}).get("blancoEn") is not None:
            s.append(("tick", p["sub"]["blancoEn"], 0.8))
        for k, c in enumerate(p.get("cuerpos", [])):
            if k > 0 and "en" in c:
                s.append(("aire", c["en"] + 0.08, 0.6))
            if c["tipo"] == "monedas":
                paso = c.get("paso", 0.11)
                for pila in c["pilas"]:
                    if pila["n"] <= 1:
                        s.append(("tick", pila["en"], 0.9))
                    else:  # dos monedas que suenan y el golpe en la última: se oye cuántas son sin ametrallar
                        s += [("tick-suave", pila["en"], 1.0), ("tick-suave", pila["en"] + 2 * paso, 1.0),
                              ("golpe-corto", pila["en"] + (pila["n"] - 1) * paso, 0.5)]
            elif c["tipo"] == "flujo":
                s += [("golpe-corto", c[x]["en"], 0.55) for x in ("entrada", "salida") if x in c]
            elif c["tipo"] == "filas":
                for fl in c["filas"]:
                    if "en" in fl:
                        s += [("tick", fl["en"], 1.0), ("nota", fl["en"], 0.6)]
        if not sigue_escena:
            s.append(("aire-salida", f - 0.03, 0.5))
    return s


# ---- tabla de sincronía y avisos -----------------------------------------------------------------------------------
def eventos(o, camino=""):
    """Todos los instantes de una pieza: (dónde, segundo, campo). Para comprobar que cada cosa entra en su palabra."""
    out = []
    if isinstance(o, dict):
        nombre = next((str(o[c]).replace("\n", " ") for c in ("nombre", "texto", "titulo", "t") if isinstance(o.get(c), str)), "")
        for k, v in o.items():
            if k in EVENTOS and isinstance(v, (int, float)) and not isinstance(v, bool) and v < 900:
                relevo = k == "en" and "tipo" in o  # el "en" de un cuerpo de escena: cuándo releva al anterior
                out.append(((camino + "." + k).lstrip(".") + (f" «{nombre}»" if nombre else ""), float(v),
                            "relevo" if relevo else k))
            elif isinstance(v, (dict, list)) and k != "sonidos":
                out += eventos(v, camino + "." + k)
    elif isinstance(o, list):
        for n, v in enumerate(o):
            out += eventos(v, f"{camino}[{n}]")
    return out


def palabra_en(t, tiempos):
    """La palabra que suena (o está a punto de sonar) en el segundo t, y cuánto falta para que empiece."""
    if not tiempos:
        return "", 0.0
    mejor = min(tiempos, key=lambda w: abs(w["s"] - t) if w["s"] >= t - 0.12 else abs(w["s"] - t) + 0.25 * (t > w["e"]))
    return mejor["w"], mejor["s"] - t


def main():
    for st in (sys.stdout, sys.stderr):  # en Windows, sin esto las tildes rompen la salida
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    reel = sys.argv[1]
    trabajo = RAIZ / "trabajo" / reel
    publico = RAIZ / "editor" / "public"

    def leer(ruta, defecto=None):
        if not ruta.exists():
            if defecto is not None:
                return defecto
            sys.exit(f"Falta {ruta.relative_to(RAIZ)}")
        return json.loads(ruta.read_text(encoding="utf-8"))

    guion = leer(trabajo / "guion_pro.json")
    if not (trabajo / "alineacion" / "tiempos.json").exists():
        sys.exit("Faltan los tiempos de cada palabra: repasa trabajo/<reel>/alineacion/guion.txt y ejecuta reel.py alinear <reel>")
    tiempos = leer(trabajo / "alineacion" / "tiempos.json")
    cortes = leer(trabajo / "cortes.json")
    encuadre = leer(trabajo / "encuadre.json")
    registro = leer(publico / "logos" / "logos.json", {})
    sonidos = leer(publico / "sfx2" / "sonidos.json", {})
    marca_json = leer(RAIZ / "marca.json", {})

    tramos = cortes["tramos"]
    offsets = [tr["offset"] for tr in tramos][1:]
    dur = cortes["duracion"]
    avisos = []

    # ---- piezas: completar lo que el guion deja implícito ---------------------------------------------------------
    piezas = sorted(guion.get("piezas", []), key=lambda p: p["i"])
    escenas = [p for p in piezas if es_escena(p)]
    # Mientras una pieza ya es el texto (titular, sentencia, el nombre de un revelado) no hay subtítulos
    ocultos = [tuple(x) for x in guion.get("subtitulos", {}).get("sin", [])]

    def hasta(p):
        """Hasta cuándo esconde los subtítulos una pieza que ya es el texto. Si se queda unas décimas sobre el
        plano siguiente (para que se lea sin dejar una pausa en la voz), los subtítulos vuelven en el corte:
        si no, se perdería la primera página de la frase siguiente. "subtitulos_hasta" lo fija a mano."""
        if "subtitulos_hasta" in p:
            return p["subtitulos_hasta"]
        cortes_dentro = [o for o in offsets if p["i"] < o < p["f"] and p["f"] - o <= 0.6]
        return cortes_dentro[-1] if cortes_dentro else p["f"]

    for p in piezas:
        if p.get("subtitulos") is True:
            continue
        if p.get("subtitulos") is False or p["tipo"] == "titular":
            ocultos.append((p["i"], hasta(p)))
        elif p["tipo"] == "sentencia":
            ocultos.append((p["caja"]["en"] - 0.12, hasta(p)))
        elif p["tipo"] == "revelado" and p.get("linea1"):
            ocultos.append((p["linea1"][0]["en"] - 0.1, p["f"]))
    for p in piezas:
        if p["f"] <= p["i"]:
            avisos.append(f"{p['tipo']} en {p['i']}: acaba antes de empezar")
        if p["tipo"] == "titular":
            palabras_titular(p, tiempos)
        if p["tipo"] == "escena":
            p["titulo"] = trozos(p.get("titulo", ""))
        if not es_escena(p):
            # Una pieza que llega hasta una escena no se funde: se queda entera hasta que la tapa la cortina
            sig = next((e for e in escenas if e["i"] - 0.2 <= p["f"] <= e["i"] + 0.25), None)
            if sig and "salida" not in p:
                p["salida"] = 0
                p["f"] = round(sig["i"] + 0.06, 3)
    cara = [p for p in piezas if not es_escena(p)]
    for a, b in zip(cara, cara[1:]):
        if b["i"] < a["f"] - 0.02:
            avisos.append(f"{a['tipo']} ({a['i']}–{a['f']}) y {b['tipo']} ({b['i']}–{b['f']}) coinciden: se pisan")
    for p in cara:
        dentro = next((e for e in escenas if e["i"] < p["i"] < e["f"] - 0.3), None)
        if dentro:
            avisos.append(f"{p['tipo']} entra en {p['i']} con la escena de {dentro['i']}–{dentro['f']} delante: no se ve hasta {dentro['f']}")

    # ---- subtítulos -------------------------------------------------------------------------------------------
    sub = guion.get("subtitulos", {})
    textos = {int(k): v for k, v in sub.get("textos", {}).items()}
    destacar = {norm(x) for x in sub.get("destacar", [])}
    destacar_idx = set(sub.get("destacar_idx", []))  # por número de palabra (ver alineacion/tiempos.json)
    palabras = []
    for w in tiempos:
        t = textos.get(w["i"], w["w"])
        palabras.append({"idx": w["i"], "t": t, "i": w["s"], "f": w["e"], "frase": w["frase"],
                         **({"d": True} if norm(t) in destacar or w["i"] in destacar_idx else {})})
    grandes = [tuple(x) for x in sub.get("grande", [])]
    paginas = []
    crudas = paginar(palabras, sub, offsets)
    for k, pag in enumerate(crudas):
        i = pag[0]["i"] - 0.04
        ultimo = pag[-1]["f"]
        fin = ultimo + 0.3
        if k + 1 < len(crudas):
            sig = crudas[k + 1][0]["i"] - 0.04
            fin = sig if sig - ultimo < 0.55 else ultimo + 0.3
        # una página no pasa de un corte: se quedaría un fotograma encima del plano siguiente
        for o in offsets:
            if pag[0]["i"] < o < fin and ultimo <= o + 0.03:
                fin = o
        # tramos sin subtítulos: la página que empieza dentro se quita; la que se mete, se recorta
        if any(a <= pag[0]["i"] < b for a, b in ocultos):
            continue
        for a, b in ocultos:
            if i < a < fin:
                fin = a
        for j, w in enumerate(pag):  # la palabra sigue encendida hasta que empieza la siguiente
            w["f"] = round(pag[j + 1]["i"] if j + 1 < len(pag) else w["f"] + 0.25, 3)
        lineas = partir_lineas(pag, sub.get("max_linea", 18)) or [pag]
        p = {"i": round(max(0, i), 3), "f": round(min(dur, fin), 3),
             "lineas": [[{c: v for c, v in w.items() if c in ("t", "i", "f", "d")} for w in l] for l in lineas]}
        if any(a <= pag[0]["i"] < b for a, b in grandes):
            p["tam"] = sub.get("tam_grande", 78)
        elif "tam" in sub:
            p["tam"] = sub["tam"]
        if p["f"] - p["i"] < 0.4:
            avisos.append(f"subtítulo de {p['f'] - p['i']:.2f} s en {p['i']}: «{' '.join(w['t'] for w in pag)}»")
        paginas.append(p)

    # ---- encuadre y saltos de zoom en cada corte ----------------------------------------------------------------
    # Cada tramo: [escala al empezar, escala al acabar, ancla]. El ancla es dónde se sujeta el zoom:
    #   "barbilla" (por defecto): la cara crece hacia arriba y nunca baja hacia la pieza que va sobre el pecho;
    #   "cara": el centro de la cara, para un primer plano sin pieza.
    dy = guion.get("desplazarY", DESPLAZAR_Y)
    ancla_cara = guion.get("anclaY", encuadre["anclaY"]) + dy / 1920
    ancla_barbilla = (encuadre["cara_en_lienzo"]["barbilla"] + dy) / 1920
    gz = guion.get("zooms", [])
    if gz and len(gz) != len(tramos):
        avisos.append(f"\"zooms\" tiene {len(gz)} encuadres y el vídeo {len(tramos)} tramos")
    zooms = []
    for k, tr in enumerate(tramos):
        z = list(gz[k]) if k < len(gz) else ([1.0, 1.03] if k % 2 == 0 else [1.07, 1.09])
        ancla = ancla_cara if (len(z) > 2 and z[2] == "cara") else ancla_barbilla
        fin = tramos[k + 1]["offset"] if k + 1 < len(tramos) else dur + 1
        zooms.append({"i": tr["offset"], "f": fin, "e0": z[0], "e1": z[1], "ancla": round(ancla, 4)})
        con_pieza = any(p["i"] < fin - 0.3 and p["f"] > tr["offset"] + 0.3 for p in cara)
        if con_pieza and len(z) > 2 and z[2] == "cara" and max(z[0], z[1]) > 1.06:
            avisos.append(f"tramo {k} ({tr['offset']:.2f} s): zoom {max(z[0], z[1])} anclado en la cara con una pieza debajo; "
                          "la barbilla puede tocarla (quita \"cara\" o baja el zoom)")

    # ---- capítulos (arriba a la izquierda) ------------------------------------------------------------------------
    secciones = guion.get("secciones", [])
    for k, s in enumerate(secciones):
        s.setdefault("num", f"{k + 1:02d}")
        s["titulo"] = s["titulo"].upper()

    # ---- sonidos: el golpe de cada efecto cae en su instante ------------------------------------------------------
    pedidos = []
    if guion.get("sonidos_auto", True):
        for p in piezas:
            sigue = any(e is not p and abs(e["i"] - p["f"]) < 0.3 for e in escenas)
            pedidos += [x for x in sonidos_auto(p, sigue)]
    pedidos += [tuple(x) for x in guion.get("sonidos", [])]
    vistos, sfx = set(), []
    for nombre, en, *resto in pedidos:
        clave = (nombre, round(en, 2))
        if clave in vistos:  # dos piezas piden lo mismo en el mismo instante: una vez
            continue
        vistos.add(clave)
        if nombre not in sonidos:
            avisos.append(f"sonido desconocido: {nombre}")
            continue
        s = sonidos[nombre]
        vol = (resto[0] if resto else 1.0) * 10 ** (s["gain_db"] / 20)
        # el golpe del sonido cae en "en"; el swell termina ahí; el tecleo empieza ahí (suena mientras se escribe)
        inicio = en if s.get("familia") == "tecla" else en - (s["dur"] if s.get("ancla") == "fin" else s["pico"])
        sfx.append({"src": f"sfx2/{s['archivo']}", "en": round(max(0, inicio), 3), "vol": round(vol, 4), "golpe": en, "nombre": nombre,
                    **({"dur": resto[1]} if len(resto) > 1 else {})})  # ["tecleo", t, vol, dur]: se corta a los dur segundos
    sfx.sort(key=lambda x: x["en"])
    graves = sorted(x["golpe"] for x in sfx if x["nombre"] in ("golpe", "golpe-grave", "impacto"))
    for a, b in zip(graves, graves[1:]):
        if b - a < 1.0:
            avisos.append(f"dos golpes graves a menos de 1 s ({a:.2f} y {b:.2f})")
    if len(graves) > 6:
        avisos.append(f"{len(graves)} golpes graves: con más de 4–6 dejan de notarse")

    # ---- logos ---------------------------------------------------------------------------------------------------
    indice = {}
    for slug, e in registro.items():
        for n in [slug, e.get("name", "")] + list(e.get("aliases", [])):
            indice.setdefault(norm(n), e["file"])
    logos = {}
    for clave, nombre in guion.get("logos", {}).items():
        ruta = nombre if "/" in nombre else indice.get(norm(nombre)) or indice.get(norm(clave))
        if not ruta:
            avisos.append(f"sin logo para {clave!r} ({nombre}): reel.py logos \"{nombre}\"")
            continue
        if not (publico / ruta).exists():
            avisos.append(f"el logo {ruta} no existe en editor/public")
        logos[clave] = ruta
    usados = set(re.findall(r'"(?:logo|logoEtiqueta)": "([^"]+)"', json.dumps(piezas, ensure_ascii=False)))
    for u in sorted(usados - set(logos)):
        avisos.append(f"una pieza usa el logo {u!r} y no está en \"logos\" del guion")

    edl = {
        "video": guion.get("video", f"reels/{reel}/base.mp4"),
        "duracion": dur,
        "fps": cortes.get("fps", 30),
        "anclaY": round(ancla_cara, 4),
        "marco": dict(encuadre["marco"], arriba=round(encuadre["marco"]["arriba"] + dy, 1), relleno=guion.get("relleno", "estirar")),
        "zooms": zooms,
        "paginas": paginas,
        "secciones": secciones,
        "piezas": piezas,
        "sfx": [{k: v for k, v in x.items() if k in ("src", "en", "vol", "dur")} for x in sfx],
        "logos": logos,
    }
    if "imagen" in guion:
        edl["imagen"] = guion["imagen"]
    # Logo propio, siempre arriba a la derecha: el de marca.json ("logo") salvo que el guion diga otra cosa
    m = guion.get("marca", {"logo": marca_json["logo"]} if marca_json.get("logo") else None)
    if m:
        ruta = logos.get(m["logo"], m["logo"])
        if (publico / ruta).exists():
            edl["marca"] = {"logo": ruta, **({"desde": m["desde"]} if "desde" in m else {})}
        else:
            avisos.append(f"no encuentro el logo de la marca ({ruta}) en editor/public")
    destino = publico / "reels" / reel / "edl_pro.json"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(edl, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"OK: {destino.relative_to(RAIZ)} · {dur:.2f}s a {edl['fps']} fps · {len(paginas)} páginas · {len(piezas)} piezas · "
          f"{len(sfx)} sonidos · logos: {', '.join(logos) or 'ninguno'}")

    print("\nSUBTÍTULOS")
    for p in paginas:
        print(f"  {p['i']:6.2f}-{p['f']:6.2f}  " + " / ".join(" ".join(w["t"].upper() for w in l) for l in p["lineas"])
              + ("   [grande]" if "tam" in p else ""))

    print("\nSINCRONÍA (cada cosa que entra y la palabra que suena; «+» = la pieza se adelanta a la palabra)")
    for p in piezas:
        ev = sorted(eventos(p), key=lambda x: x[1])
        plano = "escena" if es_escena(p) else "cara"
        print(f"  {p['i']:6.2f}-{p['f']:6.2f}  {p['tipo']} ({plano})")
        for donde, t, campo in ev:
            w, falta = palabra_en(t, tiempos)
            suelto = "   ¿suelto? no cae en ninguna palabra" if abs(falta) > 0.35 and campo != "relevo" else ""
            print(f"      {t:6.2f}  {donde:<44} ↔ «{w}» {falta:+.2f}{suelto}")
            if t < p["i"] - 0.05 or t > p["f"]:
                avisos.append(f"{p['tipo']} ({p['i']}–{p['f']}): {donde} cae en {t}, fuera de la pieza")
        # ¿Da tiempo a leerlo? Lo último que entra y el conjunto completo
        grupos = [(p, p["f"])]
        if p["tipo"] == "escena":
            cs = p.get("cuerpos", [])
            grupos = [(c, cs[k + 1].get("en", p["f"]) if k + 1 < len(cs) else p["f"]) for k, c in enumerate(cs)]
        for g, hasta in grupos:
            tg = [t for _, t, campo in eventos(g) if campo not in PULSOS and campo != "relevo"]
            if not tg:
                continue
            hasta = min(hasta, dur)
            visto = hasta - (max(tg) + 0.3)  # 0,3 s tarda en acabar de entrar
            nombre = p["tipo"] + (f" · {g['tipo']}" if g is not p else "")
            if visto < 0.8:
                avisos.append(f"{nombre}: lo último que entra ({max(tg):.2f}) solo se ve {max(0, visto):.1f} s antes de irse en {hasta:.2f}")
            elif visto < 2.0 and g["tipo"] in LISTAS:
                print(f"      (completa {visto:.1f} s; una lista pide 2 s: que al menos se vea entera, apagada, desde antes)")
    if avisos:
        print("\nAVISOS")
        for a in avisos:
            print("  ·", a)

    # ---- portada: el mismo vídeo parado en un fotograma bueno, con el titular de portada y nada más -------------------
    if "portada" in guion:
        pt = guion["portada"]
        z = pt.get("zoom", 1.0)
        tit = dict(pt["titular"], tipo="titular", i=0, f=dur + 1)
        for linea in tit.get("lineas", []):
            if "texto" in linea:
                linea["palabras"] = [{"t": x, "i": 999, "f": 999} for x in linea.pop("texto").split()]
        portada = dict(edl, zooms=[{"i": 0, "f": dur + 1, "e0": z, "e1": z, "ancla": round(ancla_barbilla, 4)}], paginas=[], secciones=[],
                       sfx=[], piezas=[tit])
        if not pt.get("marca"):  # el logo de arriba queda cortado en el recorte 3:4 del perfil: fuera de la portada
            portada.pop("marca", None)
        (destino.parent / "edl_portada.json").write_text(json.dumps(portada, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"\nPortada: fotograma del segundo {pt['t']} -> reel.py portada {reel}")


if __name__ == "__main__":
    main()
