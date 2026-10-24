"""Capas de la grabación para el modo «capas sobre el vídeo»: fotogramas de la toma ya sin pausas y la silueta de la
persona (máscara alfa) en cada uno, para que la animación pueda ir detrás o delante de ella.

Uso (desde la carpeta del proyecto, después de 'anim.py cortar'):
    python recortar.py                      -> 720 (previsualización y revisión) y la altura de la toma (render final)
    python recortar.py --alto 720,1080      -> solo esas alturas (1080 = borrador de montaje)
    python recortar.py --desde 600 --hasta 900   -> solo esos fotogramas del montaje (pruebas)
    python recortar.py --borrar 2160        -> borra el juego de 2160 (ocupa ~1,3 MB por fotograma)

Sale a edicion/capas/<alto>/v_000123.jpg (la imagen) y m_000123.png (la silueta en el canal alfa), numerados con el
fotograma del montaje (0 = primer fotograma del vídeo sin pausas), y edicion/capas/capas.json.

Recorte: Robust Video Matting (RVM, ResNet50, GPU). Es recurrente (usa los fotogramas anteriores): el estado se
reinicia en cada salto de corte y el primer fotograma de cada tramo se pasa varias veces para que arranque limpio.
La silueta se calcula una vez a la resolución de la toma y se reduce para cada altura: todas coinciden.
Modelo (GPL-3.0, se descarga la primera vez a ~/.cache/animaciones-con-voz/ (nombre antiguo de la skill: se mantiene para no volver a descargar), 108 MB):
https://github.com/PeterL1n/RobustVideoMatting
"""
import argparse
import json
import shutil
import subprocess
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np

CACHE = Path.home() / ".cache" / "animaciones-con-voz"
URL = "https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_{m}_fp32.torchscript"


def modelo(nombre, dispositivo):
    import torch
    f = CACHE / f"rvm_{nombre}_fp32.torchscript"
    if not f.is_file():
        CACHE.mkdir(parents=True, exist_ok=True)
        print(f"Descargando el modelo de recorte ({nombre}) -> {f} ...", flush=True)
        urllib.request.urlretrieve(URL.format(m=nombre), f)
    m = torch.jit.load(str(f), map_location=dispositivo).eval()
    return torch.jit.freeze(m)


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--alto", default="", help="alturas separadas por comas (por defecto 720 y la de la toma)")
    ap.add_argument("--modelo", default="resnet50", choices=["resnet50", "mobilenetv3"])
    ap.add_argument("--desde", type=int, default=0)
    ap.add_argument("--hasta", type=int, default=0)
    ap.add_argument("--calidad", type=int, default=92, help="calidad JPEG de la imagen")
    ap.add_argument("--reusar", action="store_true", help="salta los fotogramas que ya existen en todas las alturas")
    ap.add_argument("--borrar", type=int, default=0, help="borra el juego de esa altura y sale")
    ap.add_argument("--cpu", action="store_true")
    a = ap.parse_args()

    ed = Path("edicion")
    if a.borrar:
        d = ed / "capas" / str(a.borrar)
        if d.is_dir():
            shutil.rmtree(d)
            print(f"Borrado {d}")
        info = ed / "capas" / "capas.json"
        if info.is_file():
            c = json.load(open(info, encoding="utf-8"))
            c["altos"] = [h for h in c.get("altos", []) if h != a.borrar]
            json.dump(c, open(info, "w", encoding="utf-8"), indent=1)
        return
    if not (ed / "cortes.json").is_file() or not (ed / "fuente.json").is_file():
        sys.exit("Faltan edicion/cortes.json o edicion/fuente.json: crea el proyecto con 'anim.py nuevo --video' y ejecuta 'anim.py cortar'")
    import cv2
    import torch
    cortes = json.load(open(ed / "cortes.json", encoding="utf-8"))
    fuente = json.load(open(ed / "fuente.json", encoding="utf-8"))
    SW, SH, fps = fuente["ancho"], fuente["alto"], cortes["fps"]
    total = cortes["fotogramas"]
    altos = sorted({int(x) for x in a.alto.split(",") if x.strip()} or {720, SH})
    altos = [h for h in altos if h <= SH] or [SH]
    tam = {h: (int(round(h * SW / SH / 2)) * 2, h) for h in altos}
    f_ini, f_fin = a.desde, a.hasta or total
    dev = "cpu" if a.cpu or not torch.cuda.is_available() else "cuda"
    if dev == "cpu":
        print("AVISO: sin GPU el recorte va lento (~1-2 fotogramas/s en 4K); prueba --modelo mobilenetv3")
    m = modelo(a.modelo, dev)
    dr = min(1.0, 540 / SH)              # resolución interna ~540 px de alto: bordes limpios de pelo y manos
    for h in altos:
        (ed / "capas" / str(h)).mkdir(parents=True, exist_ok=True)

    libres = shutil.disk_usage(ed).free / 1e9
    necesita = (f_fin - f_ini) * sum((w * h) / (3840 * 2160) * 1.35 for w, h in tam.values()) / 1000
    print(f"Toma {SW}x{SH} · montaje f{f_ini}-{f_fin} ({(f_fin - f_ini) / fps:.1f} s) · alturas {altos} · {dev} · "
          f"~{necesita:.1f} GB (libres {libres:.0f} GB)", flush=True)
    if necesita > libres * .8:
        sys.exit("No hay espacio suficiente en disco: usa --alto con menos alturas o libera espacio")

    def existe(f):
        return all((ed / "capas" / str(h) / f"m_{f:06d}.png").is_file() and (ed / "capas" / str(h) / f"v_{f:06d}.jpg").is_file()
                   for h in altos)

    def guardar(f, rgb, alfa):
        bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        for h in altos:
            w, hh = tam[h]
            d = ed / "capas" / str(h)
            if (w, hh) == (SW, SH):
                img, al = bgr, alfa
            else:
                img = cv2.resize(bgr, (w, hh), interpolation=cv2.INTER_AREA)
                al = cv2.resize(alfa, (w, hh), interpolation=cv2.INTER_AREA)
            cv2.imwrite(str(d / f"v_{f:06d}.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, a.calidad])
            bgra = np.zeros((hh, w, 4), np.uint8)
            bgra[..., 3] = al
            cv2.imwrite(str(d / f"m_{f:06d}.png"), bgra, [cv2.IMWRITE_PNG_COMPRESSION, 1])

    t0, hechos = time.time(), 0
    pool = ThreadPoolExecutor(max_workers=6)
    pend = []
    for tr in cortes["tramos"]:
        e0 = tr["edit_f0"]
        n_tr = tr["src_f1"] - tr["src_f0"]
        c0, c1 = max(f_ini, e0), min(f_fin, e0 + n_tr)
        if c1 <= c0:
            continue
        if a.reusar and all(existe(f) for f in range(c0, c1)):
            continue
        s0 = tr["src_f0"] + (c0 - e0)
        n = c1 - c0
        proc = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{(s0 - .4) / fps:.6f}", "-i", fuente["video"],
                                 "-frames:v", str(n), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        rec = [None] * 4
        with torch.no_grad():
            for k in range(n):
                raw = proc.stdout.read(SW * SH * 3)
                if len(raw) < SW * SH * 3:
                    sys.exit(f"La toma se acabó antes de tiempo en el tramo que empieza en f{e0}")
                rgb = np.frombuffer(raw, np.uint8).reshape(SH, SW, 3)
                x = torch.from_numpy(rgb.copy()).to(dev).permute(2, 0, 1)[None].float().div_(255)
                if k == 0:                       # arranque limpio del estado recurrente en cada tramo
                    for _ in range(4):
                        _, _, *rec = m(x, *rec, dr)
                _, pha, *rec = m(x, *rec, dr)
                al = pha[0, 0].clamp_(0, 1)
                al = ((al - .04) / .92).clamp_(0, 1)          # quita el velo casi transparente del fondo
                alfa = (al * 255 + .5).byte().cpu().numpy()
                f = c0 + k
                pend.append(pool.submit(guardar, f, rgb, alfa))
                if len(pend) > 24:
                    pend.pop(0).result()
                hechos += 1
                if hechos % 60 == 0:
                    s = time.time() - t0
                    print(f"\r  {hechos}/{f_fin - f_ini} fotogramas · {hechos / s:.1f} f/s · {s:.0f} s   ", end="", flush=True)
        proc.stdout.close()
        proc.wait()
    for p in pend:
        p.result()
    pool.shutdown()

    info = ed / "capas" / "capas.json"
    prev = json.load(open(info, encoding="utf-8")) if info.is_file() else {}
    json.dump({"fps": fps, "fotogramas": total, "fuente": [SW, SH], "modelo": f"rvm_{a.modelo}",
               "altos": sorted(set(prev.get("altos", [])) | set(altos)),
               "tam": {**prev.get("tam", {}), **{str(h): list(tam[h]) for h in altos}}},
              open(info, "w", encoding="utf-8"), indent=1)
    print(f"\nListo en {time.time() - t0:.0f} s -> edicion/capas/<alto>/ (v_*.jpg imagen, m_*.png silueta)")


if __name__ == "__main__":
    main()
