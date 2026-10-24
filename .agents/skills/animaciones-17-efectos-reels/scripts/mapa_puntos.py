"""Mapa del mundo en puntos para las animaciones ("solo disponible en…", "llega a X países", "desde cualquier país").

Uso (desde la carpeta del proyecto):
    python mapa_puntos.py --marcar USA,ESP [--ancho 1520] [--centro 960,560] [--paso 13.5] [--lat -57,80]
                          [--salida assets/mapa_puntos.json] [--previa trabajo/revision/mapa.png]

Rasteriza los países de Natural Earth 1:110m (dominio público; se descarga una vez a ~/.cache) en una rejilla de
puntos sobre el lienzo 1920x1080, con proyección de Miller. Cada punto lleva el código ISO3 de su país.
--marcar: países de los que quieres el centro (para el alfiler y el origen de las ondas) y el color en la previa.

Salida JSON: {"paso", "centros": {"USA": [x, y]}, "pts": "x,y,ISO3;x,y,ISO3;..."}. Para pintarlo, copia
prepararMapa()/pintarMapa() de ejemplos/muse-intro.html (un <canvas> dentro de #world, a la resolución del
dispositivo): cada punto aparece, se enciende o se apaga con una función de t (p. ej. una onda desde un país:
retraso = distancia / velocidad).
"""
import argparse
import json
import math
import sys
import urllib.request
from pathlib import Path

URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
CACHE = Path.home() / ".cache" / "animaciones-con-voz" / "ne_110m_admin_0_countries.geojson"


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--marcar", default="", help="códigos ISO3 separados por comas: USA,ESP,MEX")
    ap.add_argument("--ancho", type=float, default=1520)
    ap.add_argument("--centro", default="960,560")
    ap.add_argument("--paso", type=float, default=13.5, help="separación entre puntos (px)")
    ap.add_argument("--lat", default="-57,80", help="latitudes mínima y máxima (sin la Antártida)")
    ap.add_argument("--salida", default="assets/mapa_puntos.json")
    ap.add_argument("--previa", default="trabajo/revision/mapa.png")
    a = ap.parse_args()
    import numpy as np
    from matplotlib.path import Path as Ruta

    if not CACHE.exists():
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        print("Descargando Natural Earth 1:110m (una sola vez)...")
        urllib.request.urlretrieve(URL, CACHE)
    geo = json.load(open(CACHE, encoding="utf-8"))
    cx, cy = (float(v) for v in a.centro.split(","))
    lat0, lat1 = (float(v) for v in a.lat.split(","))
    R = a.ancho / (2 * math.pi)
    miller = lambda la: 1.25 * R * math.log(math.tan(math.pi / 4 + .4 * math.radians(max(min(la, 84), -84))))
    ym = (miller(lat1) + miller(lat0)) / 2
    px = lambda lo, la: (cx + math.radians(lo) * R, cy - (miller(la) - ym))

    polis = []                                            # (ISO3, índice del polígono dentro del país, ruta)
    for f in geo["features"]:
        a3 = f["properties"]["ADM0_A3"]
        g = f["geometry"]
        partes = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
        for i, poly in enumerate(partes):
            polis.append((a3, i, Ruta([px(lo, la) for lo, la in poly[0]])))
    xs = np.arange(cx - a.ancho / 2 + a.paso / 2, cx + a.ancho / 2, a.paso)
    ys = np.arange(px(0, lat1)[1] + a.paso / 2, px(0, lat0)[1], a.paso)
    G = np.array([[x, y] for y in ys for x in xs])
    dueno = np.full(len(G), "", dtype=object)
    poli = np.full(len(G), -1)
    for a3, i, r in polis:
        dentro = r.contains_points(G) & (dueno == "")
        dueno[dentro] = a3
        poli[dentro] = i
    tierra = dueno != ""
    P, O, I = G[tierra], dueno[tierra], poli[tierra]

    centros = {}
    for a3 in [c.strip().upper() for c in a.marcar.split(",") if c.strip()]:
        sel = O == a3
        if not sel.any():
            print(f"AVISO: {a3} no tiene puntos (¿código ISO3 correcto? ¿país muy pequeño para este paso?)")
            continue
        grande = np.bincount(I[sel]).argmax()                # el polígono con más puntos (EE. UU. sin Alaska)
        q = P[sel & (I == grande)]
        centros[a3] = [round(float(q[:, 0].mean()), 1), round(float(q[:, 1].mean()), 1)]
    Path(a.salida).parent.mkdir(parents=True, exist_ok=True)
    json.dump({"paso": a.paso, "centros": centros, "pts": "".join(f"{int(round(x))},{int(round(y))},{c};" for (x, y), c in zip(P, O))},
              open(a.salida, "w", encoding="utf-8"))
    print(f"{len(P)} puntos (y {px(0, lat1)[1]:.0f}-{px(0, lat0)[1]:.0f}) -> {a.salida} · centros: {centros}")

    if a.previa:
        from PIL import Image, ImageDraw
        im = Image.new("RGB", (1920, 1080), (10, 12, 16))
        d = ImageDraw.Draw(im)
        marcados = set(centros)
        for (x, y), c in zip(P, O):
            d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(47, 134, 255) if c in marcados else (70, 80, 100))
        for x, y in centros.values():
            d.ellipse([x - 9, y - 9, x + 9, y + 9], outline=(255, 255, 255), width=2)
        Path(a.previa).parent.mkdir(parents=True, exist_ok=True)
        im.save(a.previa)
        print(f"previa -> {a.previa}")


if __name__ == "__main__":
    main()
