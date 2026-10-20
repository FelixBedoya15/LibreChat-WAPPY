"""Vectoriza un logo de un solo trazo (una firma, una "m" como la de Muse, un garabato) para que se escriba a mano.

Uso:
    python logo_trazo.py <imagen.png|webp> [--salida assets/logos/<nombre>_trazo.json] [--alfa] [--previa trabajo/revision/trazo.png]

Del icono oficial en PNG/WebP (cuanto más grande, mejor; 512 px basta) saca:
    outline   contorno exacto del trazo (subpíxel), para rellenarlo con su degradado
    eje       el recorrido del trazo (esqueleto suavizado), para dibujarlo: una máscara con un trazo ancho que
              avanza por el eje va descubriendo el relleno, como un rotulador
    sw        grosor del trazo; A, B, ca, cb: degradado lineal ajustado a los colores reales del logo
y además <salida>.svg (el logo estático, vectorial). La tinta es lo que no es blanco ni transparente
(--alfa: usa solo la transparencia, para logos claros sobre fondo transparente).

En la animación: copia museSVG()/museDibujo()/museFicha() de ejemplos/muse-intro.html y cambia MUSE por estos
datos. museDibujo(el, p) con p de 0 a 1 escribe el logo (≈0,6 s con E.ioSine queda natural).
Revisa la previa: contorno verde sobre el original y eje rojo de principio (punto verde) a fin.
Solo vale para logos de UN trazo continuo sin cruces; si el eje sale raro, usa el logo normal.
"""
import argparse
import json
import sys
from collections import deque
from pathlib import Path

import numpy as np


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("imagen")
    ap.add_argument("--salida", default="")
    ap.add_argument("--alfa", action="store_true")
    ap.add_argument("--previa", default="trabajo/revision/trazo.png")
    a = ap.parse_args()
    from PIL import Image, ImageDraw
    from scipy import ndimage
    from scipy.ndimage import gaussian_filter1d
    from scipy.signal import savgol_filter
    from skimage import measure
    from skimage.morphology import skeletonize

    src = Image.open(a.imagen).convert("RGBA")
    rgba = np.array(src).astype(float)
    alfa = rgba[..., 3] / 255
    if a.alfa:
        campo = alfa
    else:
        blanco = rgba[..., :3] * alfa[..., None] + 255 * (1 - alfa[..., None])   # sobre blanco
        campo = 1 - blanco.min(axis=2) / 255                                     # oscuro o saturado = tinta
        campo = campo / max(campo.max(), 1e-6)
    tinta = campo > .5
    if tinta.sum() < 50:
        sys.exit("No encuentro el trazo (prueba con --alfa)")

    # contorno exacto (subpíxel), suavizado muy ligero y pasado a curvas
    cs = sorted(measure.find_contours(campo, .5), key=len, reverse=True)
    cs = [c for c in cs if len(c) > .1 * len(cs[0])]
    trozos = []
    for c in cs:
        c = c[:, ::-1]
        c = c[:-1] if np.allclose(c[0], c[-1]) else c
        sx, sy = gaussian_filter1d(c[:, 0], 1.2, mode="wrap"), gaussian_filter1d(c[:, 1], 1.2, mode="wrap")
        Q = np.c_[sx, sy][::2]
        n = len(Q)
        seg = [f"M{Q[0][0]:.2f} {Q[0][1]:.2f}"]
        for i in range(n):
            p0, p1, p2, p3 = Q[(i - 1) % n], Q[i], Q[(i + 1) % n], Q[(i + 2) % n]
            c1, c2 = p1 + (p2 - p0) / 6, p2 - (p3 - p1) / 6
            seg.append(f"C{c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {p2[0]:.2f} {p2[1]:.2f}")
        trozos.append("".join(seg) + "Z")
    outline = "".join(trozos)
    todos = np.vstack([c[:, ::-1] for c in cs])

    # eje: esqueleto -> camino más largo (dos BFS) -> suavizado -> prolongado medio grosor por cada punta
    sk = skeletonize(tinta)
    pts = set(zip(*np.nonzero(sk.T)))
    vec = lambda p: [(p[0] + dx, p[1] + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy) and (p[0] + dx, p[1] + dy) in pts]
    def bfs(s):
        prev, q, ult = {s: None}, deque([s]), s
        while q:
            u = q.popleft(); ult = u
            for v in vec(u):
                if v not in prev:
                    prev[v] = u; q.append(v)
        return prev, ult
    puntas = [p for p in pts if len(vec(p)) == 1] or list(pts)
    _, lejos = bfs(min(puntas))
    prev, otro = bfs(lejos)
    cam, u = [], otro
    while u is not None:
        cam.append(u); u = prev[u]
    cam = np.array(cam, float)
    if cam[0][0] > cam[-1][0]:
        cam = cam[::-1]                                   # se escribe de izquierda a derecha
    dist = ndimage.distance_transform_edt(tinta)
    sw = 2 * float(np.median([dist[int(y), int(x)] for x, y in cam])) * 1.1
    ven = min(9, len(cam) // 2 * 2 - 1)
    if ven >= 5:
        cam = np.c_[savgol_filter(cam[:, 0], ven, 2), savgol_filter(cam[:, 1], ven, 2)]
    def prolonga(p, q, L):
        v = p - q; return p + v / (np.linalg.norm(v) + 1e-9) * L
    k = min(3, len(cam) - 1)
    cam = np.vstack([prolonga(cam[0], cam[k], sw * .4), cam, prolonga(cam[-1], cam[-1 - k], sw * .4)])
    Q = cam[::3] if len(cam) > 12 else cam
    if (Q[-1] != cam[-1]).any():
        Q = np.vstack([Q, cam[-1]])
    seg = [f"M{Q[0][0]:.1f} {Q[0][1]:.1f}"]
    for i in range(len(Q) - 1):
        p0, p1, p2, p3 = Q[max(i - 1, 0)], Q[i], Q[i + 1], Q[min(i + 2, len(Q) - 1)]
        c1, c2 = p1 + (p2 - p0) / 6, p2 - (p3 - p1) / 6
        seg.append(f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}")
    eje = "".join(seg)

    # degradado: regresión lineal del color en el núcleo del trazo
    ys, xs = np.nonzero(campo > .8)
    X = np.c_[xs, ys, np.ones_like(xs)]
    rgb = rgba[..., :3]
    coef = [np.linalg.lstsq(X, rgb[ys, xs, c], rcond=None)[0] for c in range(3)]
    g = np.array([sum(coef[c][0] for c in range(3)), sum(coef[c][1] for c in range(3))])
    g = g / (np.linalg.norm(g) + 1e-9)
    proy = xs * g[0] + ys * g[1]
    cen = np.array([xs.mean(), ys.mean()])
    A, B = cen + g * (np.percentile(proy, 1) - cen @ g), cen + g * (np.percentile(proy, 99) - cen @ g)
    col = lambda p: "#%02X%02X%02X" % tuple(int(np.clip(coef[c][0] * p[0] + coef[c][1] * p[1] + coef[c][2], 0, 255)) for c in range(3))
    x0, y0 = todos[:, 0].min() - 3, todos[:, 1].min() - 3
    vb = [round(float(x0), 1), round(float(y0), 1), round(float(todos[:, 0].max() + 3 - x0), 1), round(float(todos[:, 1].max() + 3 - y0), 1)]
    datos = {"viewBox": vb, "outline": outline, "eje": eje, "sw": round(sw, 1), "A": [round(float(v), 1) for v in A],
             "B": [round(float(v), 1) for v in B], "ca": col(A), "cb": col(B)}
    salida = Path(a.salida or f"assets/logos/{Path(a.imagen).stem}_trazo.json")
    salida.parent.mkdir(parents=True, exist_ok=True)
    json.dump(datos, open(salida, "w", encoding="utf-8"))
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{" ".join(map(str, vb))}"><defs><linearGradient id="g" '
           f'gradientUnits="userSpaceOnUse" x1="{datos["A"][0]}" y1="{datos["A"][1]}" x2="{datos["B"][0]}" y2="{datos["B"][1]}">'
           f'<stop offset="0" stop-color="{datos["ca"]}"/><stop offset="1" stop-color="{datos["cb"]}"/></linearGradient></defs>'
           f'<path d="{outline}" fill="url(#g)"/></svg>')
    salida.with_suffix(".svg").write_text(svg, encoding="utf-8")
    print(f"trazo -> {salida} y {salida.with_suffix('.svg')} · grosor {sw:.1f} px · degradado {datos['ca']} → {datos['cb']} · "
          f"{len(cs)} contorno(s)")

    if a.previa:
        s = 2
        fondo = Image.new("RGBA", src.size, (255, 255, 255, 255))
        fondo.alpha_composite(src)
        im = fondo.convert("RGB").resize((src.width * s, src.height * s))
        d = ImageDraw.Draw(im)
        for c in cs:
            d.line([(x * s, y * s) for y, x in c], fill=(0, 190, 90), width=2)
        d.line([(x * s, y * s) for x, y in cam], fill=(230, 30, 30), width=3)
        d.ellipse([cam[0][0] * s - 8, cam[0][1] * s - 8, cam[0][0] * s + 8, cam[0][1] * s + 8], fill=(0, 200, 0))
        Path(a.previa).parent.mkdir(parents=True, exist_ok=True)
        im.save(a.previa)
        print(f"previa -> {a.previa}")


if __name__ == "__main__":
    main()
