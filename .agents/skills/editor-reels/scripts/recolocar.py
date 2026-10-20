"""Mueve los tiempos de un guion ya escrito cuando cambian los cortes del vídeo.

Uso (desde la carpeta del proyecto): python recolocar.py <reel> [--desde trabajo/<reel>/cortes_guion.json]

Los tiempos del guion van en segundos del vídeo base. Si después de escribirlo se vuelve a cortar (un tramo
distinto, otros fotogramas por segundo), todo lo que va detrás del cambio se desplaza. Este script lleva cada
tiempo del guion al mismo instante de la grabación en el vídeo nuevo:
    tiempo viejo → instante de la grabación original (con los cortes viejos) → tiempo nuevo (con los cortes nuevos)
`reel.py cortar` guarda los cortes con los que se escribió el guion en cortes_guion.json. Aquí se leen, se
recolocan guion_pro.json y guion.json (si existen; se deja una copia .antes.json) y se borra cortes_guion.json.
Después: reel.py alinear <reel> (los tiempos de cada palabra también cambian) y reel.py edl <reel>.
"""
import argparse
import json
import sys
from pathlib import Path

P = Path.cwd()
# Campos que son un instante del vídeo (no duraciones ni tamaños)
INSTANTES = {"i", "f", "en", "golpe", "marcaEn", "lineaEn", "cambioEn", "blancoEn", "cierraEn", "escribirEn", "aparece",
             "seUne", "scrollEn", "desde", "hasta", "acoplar", "unir", "appEn", "totalEn", "logoDesde", "pausasEn", "juntarEn", "subEn"}
LISTAS = {"entradas", "partir_subtitulos_en", "barrido"}          # listas de instantes
RANGOS = {"sin", "grande"}                                         # listas de [desde, hasta]


def mapear(viejos, nuevos):
    tv, tn = viejos["tramos"], nuevos["tramos"]

    def f(t):
        if not isinstance(t, (int, float)) or isinstance(t, bool) or t >= 900:
            return t
        # instante de la grabación original
        k = max((n for n, tr in enumerate(tv) if t >= tr["offset"] - 1e-6), default=0)
        fuente = tv[k]["inicio"] + (t - tv[k]["offset"])
        if k + 1 < len(tv) and fuente > tv[k]["fin"]:
            fuente = tv[k]["fin"]
        # y de ahí al vídeo nuevo: el tramo que lo contiene o, si cae en algo que ya no está, el borde más cercano
        dentro = [tr for tr in tn if tr["inicio"] - 1e-6 <= fuente <= tr["fin"] + 1e-6]
        if dentro:
            tr = dentro[-1] if abs(t - tv[k]["offset"]) < 1e-6 else dentro[0]  # un borde exacto es el inicio del tramo
            return round(tr["offset"] + fuente - tr["inicio"], 3)
        if fuente > tn[-1]["fin"]:  # más allá del final (una pieza que acaba después del vídeo)
            return round(tn[-1]["offset"] + fuente - tn[-1]["inicio"], 3)
        cerca = min(tn, key=lambda tr: min(abs(fuente - tr["inicio"]), abs(fuente - tr["fin"])))
        borde = cerca["inicio"] if abs(fuente - cerca["inicio"]) < abs(fuente - cerca["fin"]) else cerca["fin"]
        return round(cerca["offset"] + borde - cerca["inicio"], 3)

    return f


def recolocar(o, f, cambios):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == "zooms":
                continue
            if k in INSTANTES and isinstance(v, (int, float)) and not isinstance(v, bool):
                o[k] = f(v)
                cambios.append(abs(o[k] - v))
            elif k in LISTAS and isinstance(v, list):
                o[k] = [f(x) for x in v]
            elif k in RANGOS and isinstance(v, list):
                o[k] = [[f(x) for x in r] for r in v]
            elif k == "sonidos" and isinstance(v, list):       # [nombre, instante, volumen, (duración)]
                o[k] = [[s[0], f(s[1]), *s[2:]] for s in v]
            elif k == "destacar" and isinstance(v, list):      # clásico: [palabra, desde, hasta]
                o[k] = [[d[0], *[f(x) for x in d[1:]]] if isinstance(d, list) else d for d in v]
            elif k == "portada" and isinstance(v, dict) and "t" in v:  # pro: el fotograma de la portada
                v["t"] = f(v["t"])
            else:
                recolocar(v, f, cambios)
    elif isinstance(o, list):
        for v in o:
            recolocar(v, f, cambios)


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("reel")
    ap.add_argument("--desde", default=None, help="cortes con los que se escribió el guion (por defecto, cortes_guion.json)")
    a = ap.parse_args()
    w = P / "trabajo" / a.reel
    viejo = Path(a.desde) if a.desde else w / "cortes_guion.json"
    if not viejo.exists():
        sys.exit("No hay cortes anteriores guardados (cortes_guion.json): el guion ya va con los cortes actuales.")
    viejos = json.loads(viejo.read_text(encoding="utf-8"))
    nuevos = json.loads((w / "cortes.json").read_text(encoding="utf-8"))
    f = mapear(viejos, nuevos)
    hechos = 0
    for nombre in ("guion_pro.json", "guion.json"):
        ruta = w / nombre
        if not ruta.exists():
            continue
        guion = json.loads(ruta.read_text(encoding="utf-8"))
        if not (guion.get("piezas") or guion.get("elementos")):
            continue
        copia = ruta.with_suffix(".antes.json")
        copia.write_text(json.dumps(guion, ensure_ascii=False, indent=1), encoding="utf-8")
        cambios = []
        recolocar(guion, f, cambios)
        ruta.write_text(json.dumps(guion, ensure_ascii=False, indent=1), encoding="utf-8")
        hechos += 1
        print(f"{nombre}: {len(cambios)} tiempos recolocados (el que más, {max(cambios, default=0):.3f} s). Copia: {copia.name}")
    if not hechos:
        print("No hay ningún guion con piezas que recolocar.")
    if not a.desde:
        viejo.unlink()
    print(f"Duración: {viejos['duracion']:.2f} s → {nuevos['duracion']:.2f} s. Ahora: reel.py alinear {a.reel} y "
          f"reel.py edl {a.reel} (y repasa la tabla de sincronía).")


if __name__ == "__main__":
    main()
