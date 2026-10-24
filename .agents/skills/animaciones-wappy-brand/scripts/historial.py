"""Historial de vídeos hechos con la skill: qué dirección de arte y qué piezas llevó cada uno, para no repetirse
(references/direccion.md § 4). Se guarda en ~/.animaciones/historial.json (fuera de la skill: es de este equipo).

Uso (desde la carpeta del proyecto):
    python anim.py historial                     los últimos vídeos, con su fondo, acabado, tipografía, acento, música y piezas
    python anim.py historial --comprobar         compara el proyecto actual con el último vídeo y avisa de lo que se repite
    python anim.py historial --anotar [--titulo "Intro de X"]   al entregar: apunta el proyecto actual
"""
import argparse
import datetime
import json
import re
import sys
from pathlib import Path

RUTA = Path.home() / ".animaciones" / "historial.json"
RANURAS = ["fondo", "acabado", "tipo", "acento", "musica", "transicion"]
PIEZAS = ["Orbita", "TituloGigante", "Subtitulos", "Leyenda", "RotuloNombre", "Buscador", "tarjetaFuente", "TarjetaProgreso",
          "Notificacion", "carpeta", "Revelado", "EsferaPuntos", "Polvo", "Cuadricula100", "Rotulo", "Cursor", "LineaTiempo",
          "VisorREC", "Escaneo", "PanelTareas", "PanelConcepto", "Explorador", "Arrastre", "RevelarHaces", "RutaPasos",
          "TarjetaRegalo", "LineaBruto", "Comentario", "videoFicha", "tarjeta", "nodo", "insignia", "barra", "ChipEscrito", "Wire"]

# lo entregado antes de existir el historial (de ejemplos/README.md)
SEMILLA = [
    {"fecha": "2026-09-25", "titulo": "Astra vs Opus · las reglas de la comparación", "modo": "audio", "fondo": "puntos", "acabado": "tarjetas oscuras",
     "tipo": "outfit", "acento": "coral Claude + azul OpenAI", "musica": "solo voz", "transicion": "escenas encadenadas",
     "piezas": ["tarjeta", "balanza", "carta que gira", "escalera de gamas", "barra", "ChipEscrito"], "firma": ["balanza con física", "carta que gira"]},
    {"fecha": "2026-09-25", "titulo": "Qué es Hermes Agent", "modo": "audio", "fondo": "puntos", "acabado": "tarjetas oscuras", "tipo": "outfit",
     "acento": "#3E6EF2 (Hermes)", "musica": "solo voz", "transicion": "escenas encadenadas",
     "piezas": ["nodo", "Wire", "tarjetas de capacidades", "móvil con chat"], "firma": ["móvil con chat"]},
    {"fecha": "2026-09-25", "titulo": "Astra vs Opus · 5 escenarios", "modo": "audio", "fondo": "puntos", "acabado": "tarjetas oscuras", "tipo": "outfit",
     "acento": "coral + azul", "musica": "solo voz", "transicion": "escenas encadenadas", "piezas": ["huecos numerados", "carta que gira", "tarjeta"],
     "firma": ["fila de huecos que se rellenan"]},
    {"fecha": "2026-09-26", "titulo": "Astra vs Opus · intro sin audio", "modo": "audio", "fondo": "puntos", "acabado": "tarjetas oscuras", "tipo": "outfit",
     "acento": "coral + azul", "musica": "sin audio", "transicion": "escenas encadenadas", "piezas": ["bocadillo tachado", "salto", "corona", "tarjeta"],
     "firma": ["bocadillo que se arruga"]},
    {"fecha": "2026-09-28", "titulo": "Muse · intro cara ↔ animación", "modo": "cara", "fondo": "puntos", "acabado": "tarjetas oscuras", "tipo": "outfit",
     "acento": "#0381F7 (Muse)", "musica": "solo voz", "transicion": "corte seco", "piezas": ["logo a trazo", "mapa en puntos", "conectores", "casos de uso"],
     "firma": ["la «m» que se escribe", "mapa del mundo en puntos"]},
    {"fecha": "2026-09-29", "titulo": "Muse · explicación", "modo": "cara", "fondo": "puntos", "acabado": "tarjetas oscuras", "tipo": "outfit",
     "acento": "#0381F7 (Muse)", "musica": "solo voz", "transicion": "corte seco", "piezas": ["trío ≈", "medidor", "panel de conectores", "nube", "barras sin cifras"],
     "firma": ["medidor de uso", "nube con máquina"]},
    {"fecha": "2026-09-29", "titulo": "Muse · capas (demo)", "modo": "combinado", "fondo": "espacio", "acabado": "cristal", "tipo": "outfit",
     "acento": "#4C86FF", "musica": "intro-scifi", "transicion": "cuchilla",
     "piezas": ["Revelado", "TituloGigante", "Rotulo", "Orbita", "Buscador", "tarjetaFuente", "videoFicha", "carpeta"], "firma": []},
    {"fecha": "2026-09-30", "titulo": "Editado por IA · intro v3 («brutal»)", "modo": "combinado", "fondo": "cortina", "acabado": "cristal", "tipo": "outfit",
     "acento": "#3E6EF2", "musica": "intro-tambores (desde 22.665)", "transicion": "iris",
     "piezas": ["LineaTiempo", "Escaneo", "PanelTareas", "VisorREC", "videoFicha", "Explorador", "Arrastre", "RevelarHaces", "Rotulo", "PanelConcepto",
                "TituloGigante", "Orbita", "RutaPasos", "TarjetaRegalo", "Subtitulos"],
     "firma": ["LineaTiempo", "Explorador + Arrastre", "RevelarHaces", "RutaPasos"]},
    {"fecha": "2026-09-30", "titulo": "Editado por IA · reel vertical", "modo": "combinado (vertical)", "fondo": "cortina", "acabado": "cristal", "tipo": "outfit",
     "acento": "#3E6EF2", "musica": "sin música (voz + efectos)", "transicion": "iris",
     "piezas": ["videoFicha", "Escaneo", "PanelTareas", "VisorREC", "LineaBruto", "TituloGigante", "Orbita", "Buscador", "Rotulo", "LineaTiempo", "Explorador",
                "Arrastre", "RevelarHaces", "TarjetaRegalo", "Comentario", "Subtitulos"],
     "firma": ["LineaBruto", "Comentario"],
     "nota": "repitió casi todas las piezas de la intro v3: justo lo que no hay que hacer"},
]


def cargar():
    if not RUTA.is_file():
        RUTA.parent.mkdir(parents=True, exist_ok=True)
        json.dump(SEMILLA, open(RUTA, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    try:
        return json.load(open(RUTA, encoding="utf-8"))
    except (OSError, ValueError):
        return []


def guardar(h):
    RUTA.parent.mkdir(parents=True, exist_ok=True)
    json.dump(h, open(RUTA, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def resumen(h):
    r = " · ".join(f"{k} {h.get(k, '?')}" for k in RANURAS)
    firma = h.get("firma") or []
    return r + (f" · firma: {', '.join(firma)}" if firma else "") + (f" · piezas: {', '.join(h.get('piezas', [])[:12])}" if h.get("piezas") else "")


def detectar():
    """dirección de arte y piezas del proyecto actual, leídas de index.html (ESTILO y escenas) y trabajo/concepto.md"""
    html = Path("index.html").read_text(encoding="utf-8")
    m = re.search(r"^const ESTILO = (\{.*\});", html, re.M)
    e = json.loads(m.group(1)) if m else {}
    i = html.find("ELEMENTOS")
    esc = html[i:] if i >= 0 else html
    esc = esc[:esc.find("FIN DE LA DEMO")] if "FIN DE LA DEMO" in esc else esc
    piezas = [p for p in PIEZAS if re.search(r"(new\s+|\b)" + p + r"\s*\(", esc)]
    propias = sorted(set(re.findall(r"^class\s+(\w+)", esc, re.M)) | {f for f in re.findall(r"^function\s+(\w+)\s*\(", esc, re.M)
                                                                      if not re.match(r"(escena|layout|render|estadoVideo)", f)})
    trans = [n for n, pat in (("iris", r"\biris\("), ("cuchilla", r"\bcuchilla\("), ("ficha", r"videoFicha\(")) if re.search(pat, esc)] or ["corte seco"]
    fondo = e.get("fondo", "cortina") if e.get("tema") == "profundidad" else "puntos (tema oscuro)"
    m2 = re.search(r"crearFondo\(\s*'(\w+)'", esc)
    if m2:
        fondo = m2.group(1)
    musica = e.get("musica", "") if e.get("sonido") == "musica" else ("voz + efectos" if e.get("sonido") == "efectos" else "solo voz")
    tr = e.get("tramosMusica") or []
    if tr and e.get("sonido") == "musica":
        musica = ", ".join(f"{x.get('pista')} (desde {x.get('desde', 0)})" for x in tr)
    titulo, firma = Path.cwd().name, []
    c = Path("trabajo/concepto.md")
    if c.is_file():
        tc = c.read_text(encoding="utf-8")
        mt = re.search(r"^#\s*Concepto:\s*(.+)$", tc, re.M)
        if mt and "<" not in mt.group(1):
            titulo = mt.group(1).strip()
        mf = re.search(r"^##\s*Pieza\(s\) firma.*?\n(.*?)(?=^##|\Z)", tc, re.M | re.S)
        if mf:
            firma = [re.sub(r"^[-*]\s*", "", l).strip() for l in mf.group(1).splitlines() if l.strip().startswith(("-", "*")) and "<" not in l]
    return {"fecha": datetime.date.today().isoformat(), "titulo": titulo, "proyecto": str(Path.cwd()), "modo": e.get("modo", "?"),
            "fondo": fondo, "acabado": e.get("acabado", "cristal"), "tipo": e.get("tipo", "outfit"), "acento": e.get("acento", "?"),
            "musica": musica, "transicion": ", ".join(trans), "piezas": piezas, "firma": firma or propias}


def comparar(a, b):
    """qué repite «a» del vídeo «b»: ranuras iguales y proporción de piezas compartidas"""
    norm = lambda v: re.sub(r"\s*\(.*\)", "", str(v)).strip().lower()
    iguales = [k for k in RANURAS if norm(a.get(k)) and norm(a.get(k)) == norm(b.get(k))]
    pa, pb = set(a.get("piezas", [])) - {"Subtitulos", "videoFicha"}, set(b.get("piezas", [])) - {"Subtitulos", "videoFicha"}
    comp = sorted(pa & pb)
    return iguales, comp, (len(comp) / len(pa) if pa else 0)


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--anotar", action="store_true")
    ap.add_argument("--comprobar", action="store_true")
    ap.add_argument("--titulo", default="")
    ap.add_argument("--n", type=int, default=8)
    a = ap.parse_args()
    h = cargar()
    if a.comprobar or a.anotar:
        if not Path("index.html").is_file():
            sys.exit("Ejecútalo desde la carpeta del proyecto.")
        act = detectar()
        if a.titulo:
            act["titulo"] = a.titulo
        previos = [x for x in h if x.get("proyecto") != act["proyecto"]]
        print("Este proyecto: " + resumen(act))
        aviso = False
        for prev in previos[-2:][::-1]:
            iguales, comp, frac = comparar(act, prev)
            print(f"\nFrente a «{prev.get('titulo')}» ({prev.get('fecha')}):")
            print(f"  ranuras iguales: {', '.join(iguales) if iguales else 'ninguna'}")
            print(f"  piezas compartidas: {len(comp)} ({frac:.0%}): {', '.join(comp) if comp else '—'}")
            if prev is previos[-1] and (len(iguales) > 3 or frac > .5):
                aviso = True
        if not act["firma"]:
            print("\nAVISO: no hay pieza firma (una pieza inventada para este vídeo). Apúntala en trabajo/concepto.md.")
            aviso = True
        if aviso:
            print("\nAVISO: se parece demasiado al último vídeo. Cambia al menos 3 de {" + ", ".join(RANURAS) + "} y no reutilices más de la mitad "
                  "de sus piezas (references/direccion.md § 4).")
        else:
            print("\nBien: es distinto de los anteriores.")
        if a.anotar:
            h = [x for x in h if x.get("proyecto") != act["proyecto"]] + [act]
            guardar(h)
            print(f"\nApuntado en {RUTA}")
        return
    print(f"Historial ({RUTA}): {len(h)} vídeos\n")
    for x in h[-a.n:]:
        print(f"- {x.get('fecha')} · {x.get('titulo')} [{x.get('modo')}]")
        print(f"    {resumen(x)}")
        if x.get("nota"):
            print(f"    nota: {x['nota']}")


if __name__ == "__main__":
    main()
