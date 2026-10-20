"""Detecta la cara y calcula el encuadre vertical (1080x1920) del reel.

Uso:
    python encuadre.py <video> trabajo/<reel>/encuadre.json [--fps 1]

1. Saca fotogramas reducidos con ffmpeg y busca la cara con YuNet (OpenCV). El modelo (~230 KB)
   se descarga solo la primera vez en ~/.cache/editor-reels/.
2. Con la mediana de la cara calcula cómo colocar el vídeo para que:
   - lo alto de la cabeza quede en y≈CABEZA_Y (debajo de la etiqueta de capítulo),
   - la barbilla quede en y≈BARBILLA_Y (encima de la zona de gráficos).
   Así ni la etiqueta ni los gráficos tapan la cara. Si hace falta, el vídeo se reduce (plano más
   abierto) y el hueco se rellena en Remotion prolongando el fondo.
Salida: el recorte para montar_base.py y el "marco" (tamaño y posición del vídeo) para el EDL.

Grabaciones dobles (pantalla y cámara una al lado de la otra, p. ej. 3840x1080 desde OBS): se detectan
solas por la proporción (más de 3:1). La cara se busca solo en el panel de la cámara, el recorte no se
sale de él y encuadre.json guarda también "pantalla" (el otro panel), que montar_base.py corta igual
para las piezas "pantalla" del guion.
"""
import argparse
import json
import subprocess
import sys
import urllib.request
from pathlib import Path

import cv2
import numpy as np

MODELO_URL = ("https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/"
              "face_detection_yunet_2023mar.onnx")
MODELO = Path.home() / ".cache" / "editor-reels" / "face_detection_yunet_2023mar.onnx"

LIENZO_W, LIENZO_H = 1080, 1920
CABEZA_Y = 365     # lo alto de la cabeza (la etiqueta de capítulo ocupa y 236-328)
BARBILLA_Y = 891   # la barbilla (los gráficos empiezan en y≈925)
# La caja de YuNet va de la frente a la barbilla; el pelo sube por encima. Calibrado a ojo con un plano medio.
PELO = 0.25        # lo alto de la cabeza = arriba de la caja - PELO * alto de la caja (medido: 0,19 con pelo corto)
BARBILLA = 1.02    # la barbilla = arriba de la caja + BARBILLA * alto de la caja
ESCALA_MAX = 1.5   # no ampliar la imagen más de un 50 % (se vería blanda)
DOBLE_MIN = 3.0    # ancho/alto a partir del cual es una grabación doble (dos paneles 16:9 = 3,56)


def asegurar_modelo():
    if MODELO.exists():
        return
    MODELO.parent.mkdir(parents=True, exist_ok=True)
    print("Descargando el detector de caras YuNet (~230 KB)...", file=sys.stderr)
    urllib.request.urlretrieve(MODELO_URL, MODELO)


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height:stream_side_data=rotation:format=duration", "-of", "json", path],
                         capture_output=True, text=True, check=True).stdout
    j = json.loads(out)
    st = j["streams"][0]
    w, h = st["width"], st["height"]
    rot = 0
    for sd in st.get("side_data_list", []):
        rot = int(sd.get("rotation", 0) or 0)
    if abs(rot) in (90, 270):  # vídeo de móvil girado: ffmpeg lo endereza al decodificar
        w, h = h, w
    return w, h, float(j["format"]["duration"])


def detectar(video, W, H, fps):
    sw = 960 if W >= H else 540
    sh = int(round(H * sw / W / 2) * 2)
    escala = W / sw
    det = cv2.FaceDetectorYN.create(str(MODELO), "", (sw, sh), 0.7, 0.3, 5)
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", video, "-vf", f"fps={fps},scale={sw}:{sh}",
           "-f", "rawvideo", "-pix_fmt", "bgr24", "-"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    n = sw * sh * 3
    muestras, i = [], 0
    while True:
        buf = proc.stdout.read(n)
        if len(buf) < n:
            break
        img = np.frombuffer(buf, np.uint8).reshape(sh, sw, 3)
        _, caras = det.detect(img)
        t = round(i / fps, 2)
        if caras is not None and len(caras):
            x, y, w, h = max(caras, key=lambda c: c[2] * c[3])[:4]
            muestras.append({"t": t, "x": float(x * escala), "y": float(y * escala),
                             "w": float(w * escala), "h": float(h * escala)})
        i += 1
    proc.wait()
    return muestras, i


def paneles(video, W, H, dur):
    """Grabación doble: [(x0, x1) izquierda, (x0, x1) derecha]. Busca la franja negra que los separa."""
    if W / H < DOBLE_MIN:
        return None
    columnas = []
    for t in (dur * 0.25, dur * 0.5, dur * 0.75):
        raw = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", f"{t:.2f}", "-i", video,
                              "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                             capture_output=True).stdout
        if len(raw) == W * H:
            columnas.append(np.frombuffer(raw, np.uint8).reshape(H, W).mean(axis=0))
    mitad = W // 2
    if columnas:
        col = np.max(columnas, axis=0)  # negra en todos los fotogramas
        zona = np.arange(mitad - 48, mitad + 48)
        negras = zona[col[zona] < 4]
        if len(negras):
            return [(0, int(negras.min())), (int(negras.max()) + 1, W)]
    return [(0, mitad), (mitad, W)]


def calcular(W, H, cara, limites=None):
    x_min, x_max = limites or (0, W)
    cx = cara["x"] + cara["w"] / 2
    cabeza = cara["y"] - PELO * cara["h"]
    barbilla = cara["y"] + BARBILLA * cara["h"]
    s = min(ESCALA_MAX, (BARBILLA_Y - CABEZA_Y) / (barbilla - cabeza))
    # Recorte horizontal (px del original) que ocupa los 1080 px de ancho, centrado en la cara
    recorte_ancho = int(min(x_max - x_min, round(LIENZO_W / s / 2) * 2))
    x0 = int(min(max(x_min, cx - recorte_ancho / 2), x_max - recorte_ancho))
    marco_ancho = recorte_ancho * s
    izquierda = (LIENZO_W - marco_ancho) / 2
    arriba = CABEZA_Y - cabeza * s
    ancla_y = (arriba + (cara["y"] + cara["h"] / 2) * s) / LIENZO_H
    return {
        "recorte": {"x0": x0, "ancho": recorte_ancho, "alto": H},
        "escala": round(s, 4),
        "marco": {"ancho": round(marco_ancho, 1), "alto": round(H * s, 1), "arriba": round(arriba, 1),
                  "izquierda": round(izquierda, 1)},
        "anclaY": round(ancla_y, 4),
        "cara_en_lienzo": {"cabeza": round(arriba + cabeza * s), "barbilla": round(arriba + barbilla * s),
                           "centro_x": round(izquierda + (cx - x0) * s)},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("salida")
    ap.add_argument("--fps", type=float, default=1.0)
    args = ap.parse_args()

    asegurar_modelo()
    W, H, dur = probe(args.video)
    muestras, total = detectar(args.video, W, H, args.fps)
    if not muestras:
        print("No se ha detectado ninguna cara: usa un recorte centrado (montar_base.py sin --encuadre).",
              file=sys.stderr)
        sys.exit(1)
    doble = paneles(args.video, W, H, dur)
    camara = pantalla = None
    if doble:
        # La cámara es el panel donde está la cara casi siempre; lo que salga en la pantalla no cuenta
        izq = sum(1 for m in muestras if m["x"] + m["w"] / 2 < doble[0][1])
        camara, pantalla = (doble[0], doble[1]) if izq > len(muestras) / 2 else (doble[1], doble[0])
        muestras = [m for m in muestras if camara[0] <= m["x"] + m["w"] / 2 < camara[1]]
    med = {k: float(np.median([m[k] for m in muestras])) for k in ("x", "y", "w", "h")}
    cxs = np.array([m["x"] + m["w"] / 2 for m in muestras])
    res = {
        "fuente": {"ancho": W, "alto": H, "duracion": round(dur, 3)},
        "cara": {k: round(v, 1) for k, v in med.items()},
        "movimiento_x": {"p5": round(float(np.percentile(cxs, 5))), "p95": round(float(np.percentile(cxs, 95)))},
        "muestras": f"{len(muestras)}/{total} fotogramas con cara",
    }
    res.update(calcular(W, H, med, camara))
    if doble:
        res["camara"] = {"x0": camara[0], "ancho": camara[1] - camara[0]}
        res["pantalla"] = {"x0": pantalla[0], "y0": 0, "ancho": pantalla[1] - pantalla[0], "alto": H}
        # Dónde queda la cabeza dentro del vídeo base (para la burbuja de la cara de las piezas "pantalla")
        cabeza, barbilla = med["y"] - PELO * med["h"], med["y"] + BARBILLA * med["h"]
        res["cara_base"] = {"cx": round(med["x"] + med["w"] / 2 - res["recorte"]["x0"], 1),
                            "cy": round((cabeza + barbilla) / 2, 1), "lado": round(barbilla - cabeza, 1),
                            "ancho": res["recorte"]["ancho"], "alto": H}
    Path(args.salida).parent.mkdir(parents=True, exist_ok=True)
    with open(args.salida, "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=1)
    print(json.dumps({k: res[k] for k in ("fuente", "cara", "muestras", "escala", "marco", "cara_en_lienzo",
                                           "camara", "pantalla") if k in res}, ensure_ascii=False))


if __name__ == "__main__":
    main()
