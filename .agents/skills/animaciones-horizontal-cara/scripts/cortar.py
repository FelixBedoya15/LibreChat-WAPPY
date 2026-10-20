"""Quita las pausas de una grabación a cámara (formato intro: planos de cara alternados con animaciones).

Uso (desde la carpeta del proyecto, creada con 'anim.py nuevo <carpeta> --video <grabación>'):
    python cortar.py [--pre .09] [--post .13] [--min-pausa .55] [--cola .35 | --fin 76.95] [--zoom 1.22] [--sin-proxy]

Necesita edicion/fuente.json (lo escribe 'nuevo --video') y edicion/tiempos.json: la alineación forzada de la
toma original ('anim.py transcribir --toma', corregir edicion/guion.txt, 'anim.py alinear --toma').

Frases repetidas o fallidas: déjalas en edicion/guion.txt (se dicen y el alineador necesita el texto real) con
"~" al principio de la línea que sobra: se alinea, pero no entra en el montaje.

Cada frase de edicion/guion.txt es un bloque de voz. Sus bordes se afinan con la energía real del audio (la voz
clara empieza ~27 dB sobre el ruido de fondo; la cola de la frase se sigue hasta ~21 dB) y se deja un margen para
no comerse sílabas (--pre/--post). Las pausas más cortas que --min-pausa se respetan (ritmo natural al hablar).
Los cortes caen en fotogramas enteros y la voz se corta en la muestra equivalente, con 8 ms de fundido en cada
unión (en silencio: inaudible). El final es la última palabra + --cola, o el instante --fin de la toma (úsalo
si justo después Josema se gira o alarga la mano: míralo en fotogramas antes de decidir).

Escribe:
    edicion/cortes.json       tramos conservados: fotogramas de la toma -> fotogramas del montaje
    edicion/voz_cortada.wav   voz sin pausas (48 kHz estéreo), copiada a assets/audio/voz.wav (CONFIG.audio)
    edicion/cara_proxy.mp4    la toma sin pausas a 720p (previsualización y revisión)
    edicion/montaje.json      si no existe: todo cara, con el encuadre del plano corto ("cerca") ya calculado
y pone la duración nueva en CONFIG.dur del index.html. Si trabajo/guion.txt no existe, copia edicion/guion.txt
(la voz cortada dice lo mismo): el siguiente paso es 'anim.py alinear' sobre la voz cortada.
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np

SR = 48000
FUNDIDO = 0.008
YUNET_URL = ("https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/"
             "face_detection_yunet_2023mar.onnx")


def audio_estereo(video):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(video), "-vn", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def energia(y, hop=0.01):
    m = y.mean(axis=1)
    h = int(SR * hop)
    n = len(m) // h
    rms = np.sqrt((m[: n * h].reshape(n, h) ** 2).mean(axis=1) + 1e-12)
    return 20 * np.log10(rms + 1e-9)


def muestra(f, fps):
    """Muestra de audio que corresponde al fotograma f (exacta a 24/25/30/50/60 fps; redondeada si el fps es fraccional)."""
    return int(round(f * SR / fps))


def modelo_cara():
    """Detector de caras YuNet (OpenCV Zoo, 230 kB). Reutiliza el de editor-reels si ya está descargado."""
    propio = Path.home() / ".cache" / "animaciones-con-voz" / "face_detection_yunet_2023mar.onnx"
    if propio.exists():
        return propio
    ajeno = Path.home() / ".cache" / "editor-reels" / "face_detection_yunet_2023mar.onnx"
    propio.parent.mkdir(parents=True, exist_ok=True)
    if ajeno.exists():
        shutil.copyfile(ajeno, propio)
    else:
        urllib.request.urlretrieve(YUNET_URL, propio)
    return propio


def encuadre_cerca(video, fuente, tramos, zoom):
    """Centro de la cara y borde superior del plano corto: los ojos a ~38 % de la altura del recorte."""
    try:
        import cv2
    except ImportError:
        print("AVISO: sin OpenCV no puedo buscar la cara; plano corto centrado (pip install opencv-python)")
        return {"cx": fuente["ancho"] // 2, "y0": 0, "zoom": zoom, "caras": 0}
    W, H, fps = fuente["ancho"], fuente["alto"], fuente["fps"]
    det = cv2.FaceDetectorYN.create(str(modelo_cara()), "", (960, int(round(960 * H / W))), 0.7, 0.3, 5)
    k = 960 / W
    cuadros = [f for tr in tramos for f in np.linspace(tr["src_f0"] + 5, tr["src_f1"] - 5, 3).astype(int)]
    cx, ojos = [], []
    for f in cuadros:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{f / fps:.4f}", "-i", str(video), "-frames:v", "1",
                              "-vf", f"scale=960:{int(round(960 * H / W))}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
                             capture_output=True).stdout
        if not raw:
            continue
        im = np.frombuffer(raw, np.uint8).reshape(-1, 960, 3).copy()
        _, caras = det.detect(im)
        if caras is None or not len(caras):
            continue
        c = max(caras, key=lambda r: r[2] * r[3])
        cx.append((c[0] + c[2] / 2) / k)
        ojos.append(((c[5] + c[7]) / 2) / k)                  # puntos 0 y 1 de YuNet: ojo derecho e izquierdo
    if not cx:
        print("AVISO: no encuentro ninguna cara; plano corto centrado")
        return {"cx": W // 2, "y0": 0, "zoom": zoom, "caras": 0}
    hc = H / zoom
    y0 = int(min(max(np.median(ojos) - .38 * hc, 0), H - hc))
    return {"cx": int(np.median(cx)), "y0": y0 // 2 * 2, "zoom": zoom, "caras": len(cx)}


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--pre", type=float, default=.09, help="margen antes de la primera sílaba de cada bloque (s)")
    ap.add_argument("--post", type=float, default=.13, help="margen tras la última sílaba (s)")
    ap.add_argument("--min-pausa", type=float, default=.55, help="pausas más cortas se respetan (s)")
    ap.add_argument("--inicio", type=float, default=.10, help="el vídeo arranca este tiempo antes de la primera palabra")
    ap.add_argument("--cola", type=float, default=.35, help="tiempo extra tras la última palabra")
    ap.add_argument("--fin", type=float, default=0, help="último instante útil de la toma (s); manda sobre --cola")
    ap.add_argument("--zoom", type=float, default=1.22, help="zoom del plano corto de cara")
    ap.add_argument("--sin-proxy", action="store_true")
    a = ap.parse_args()

    ed = Path("edicion")
    if not (ed / "fuente.json").is_file():
        sys.exit("Falta edicion/fuente.json: crea el proyecto con 'anim.py nuevo <carpeta> --video <grabación>'")
    if not (ed / "tiempos.json").is_file():
        sys.exit("Falta edicion/tiempos.json: 'anim.py transcribir --toma', corrige edicion/guion.txt y 'anim.py alinear --toma'")
    fuente = json.load(open(ed / "fuente.json", encoding="utf-8"))
    video, fps, total_src = fuente["video"], fuente["fps"], fuente["fotogramas"]
    palabras = json.load(open(ed / "tiempos.json", encoding="utf-8"))

    y = audio_estereo(video)
    db = energia(y)
    t = np.arange(len(db)) * 0.01
    suelo = float(np.percentile(db, 10))
    u_ini, u_fin = suelo + 27, suelo + 21

    lineas = (ed / "guion.txt").read_text(encoding="utf-8").splitlines() if (ed / "guion.txt").is_file() else []
    fuera = {i for i, l in enumerate(lineas) if l.lstrip().startswith("~")}      # tomas descartadas
    frases = {}
    for w in palabras:
        if w["frase"] not in fuera:
            frases.setdefault(w["frase"], []).append(w)
    if fuera:
        print(f"Descartadas ({len(fuera)}): " + " | ".join(lineas[i].strip()[:60] for i in sorted(fuera)))
    bloques = []
    for k in sorted(frases):
        ws = frases[k]
        s, e = ws[0]["s"], ws[-1]["e"]
        idx = np.where((t >= s - .25) & (t <= s + .15) & (db > u_ini))[0]
        ini = (t[idx[0]] if len(idx) else s) - a.pre
        idx = np.where((t >= e - .30) & (t <= e + .35) & (db > u_fin))[0]
        fin = (t[idx[-1]] + .01 if len(idx) else e) + a.post
        bloques.append([ini, fin, f"{ws[0]['w']} … {ws[-1]['w']}"])
    bloques[0][0] -= a.inicio
    bloques[-1][1] = a.fin if a.fin else bloques[-1][1] + a.cola

    tramos = []
    for ini, fin, txt in bloques:
        if tramos and ini - tramos[-1][1] < a.min_pausa:
            tramos[-1][1] = max(tramos[-1][1], fin)
            tramos[-1][2] += " / " + txt
        else:
            tramos.append([ini, fin, txt])

    out, edf = [], 0
    for ini, fin, txt in tramos:
        f0 = max(0, int(round(ini * fps)))
        f1 = min(total_src, int(round(fin * fps)))
        if f1 <= f0:
            continue
        out.append({"src_f0": f0, "src_f1": f1, "edit_f0": edf, "src_s": round(f0 / fps, 4), "src_e": round(f1 / fps, 4),
                    "edit_s": round(edf / fps, 4), "texto": txt})
        edf += f1 - f0
    dur = edf / fps

    # voz cortada, muestra a muestra, con fundidos mínimos en las uniones
    nf = int(FUNDIDO * SR)
    rampa = np.linspace(0, 1, nf, dtype=np.float32)[:, None]
    piezas = []
    for tr in out:
        p = y[muestra(tr["src_f0"], fps): muestra(tr["src_f1"], fps)].copy()
        p[:nf] *= rampa
        p[-nf:] *= rampa[::-1]
        piezas.append(p)
    voz = np.concatenate(piezas)
    objetivo = muestra(edf, fps)
    voz = np.pad(voz, ((0, max(0, objetivo - len(voz))), (0, 0)))[:objetivo]   # mismo largo que la imagen, al 1/48000 s
    pcm = (np.clip(voz, -1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-", str(ed / "voz_cortada.wav")],
                   input=pcm, check=True)
    Path("assets/audio").mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ed / "voz_cortada.wav", "assets/audio/voz.wav")

    json.dump({"fps": fps, "fuente": video, "suelo_db": round(suelo, 1), "fotogramas": edf, "duracion": round(dur, 4),
               "ajustes": {"pre": a.pre, "post": a.post, "min_pausa": a.min_pausa, "inicio": a.inicio, "cola": a.cola, "fin": a.fin},
               "tramos": out}, open(ed / "cortes.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # duración y audio de la animación = los de la voz cortada
    idx = Path("index.html")
    if idx.is_file():
        html = idx.read_text(encoding="utf-8")
        html = re.sub(r"(const CONFIG = \{ dur: )[\d.]+(, audio: ')[^']*(')",
                      lambda m: f"{m.group(1)}{round(dur, 4)}{m.group(2)}assets/audio/voz.wav{m.group(3)}", html, count=1)
        idx.write_text(html, encoding="utf-8")
    if lineas and not Path("trabajo/guion.txt").exists():                   # la voz cortada dice lo mismo, sin descartes
        Path("trabajo").mkdir(exist_ok=True)
        limpio = [l for i, l in enumerate(lineas) if i not in fuera]
        Path("trabajo/guion.txt").write_text("\n".join(limpio) + "\n", encoding="utf-8")

    for tr in out:
        print(f"  toma {tr['src_s']:7.2f}-{tr['src_e']:7.2f}  ->  montaje f{tr['edit_f0']:<5d} @ {tr['edit_s']:6.2f} s   {tr['texto']}")
    print(f"Ruido de fondo {suelo:.1f} dB · {len(out)} tramos · {edf} fotogramas = {dur:.2f} s (la toma dura {len(y) / SR:.2f} s)")
    print(f"Voz cortada -> edicion/voz_cortada.wav y assets/audio/voz.wav · CONFIG.dur = {dur:.2f}")

    cerca = encuadre_cerca(video, fuente, out, a.zoom)
    print(f"Plano corto (zoom {a.zoom}): centro de la cara x={cerca['cx']}, recorte desde y={cerca['y0']} "
          f"({cerca['caras']} fotogramas con cara)")
    mj = ed / "montaje.json"
    if mj.exists():
        m = json.load(open(mj, encoding="utf-8"))
        if m.get("planos") and m["planos"][-1]["f1"] != edf:
            print(f"AVISO: edicion/montaje.json acaba en f{m['planos'][-1]['f1']} y el montaje tiene {edf} fotogramas: revísalo")
        print("(edicion/montaje.json ya existía: no lo toco)")
    else:
        json.dump({"fps": fps, "cerca": {"cx": cerca["cx"], "y0": cerca["y0"]},
                   "planos": [{"tipo": "cara", "f0": 0, "f1": edf, "zooms": [1.0, a.zoom]}]},
                  open(mj, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print("Esqueleto -> edicion/montaje.json (todo cara): reparte los planos con 'anim.py planos'")

    if not a.sin_proxy:
        sel = "+".join(f"between(n,{tr['src_f0']},{tr['src_f1'] - 1})" for tr in out)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-i", str(ed / "voz_cortada.wav"),
                        "-vf", f"select='{sel}',setpts=N/({fps})/TB,scale=1280:-2", "-map", "0:v", "-map", "1:a",
                        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-r", str(fps), "-c:a", "aac", "-b:a", "160k",
                        str(ed / "cara_proxy.mp4")], check=True)
        print("Proxy 720p -> edicion/cara_proxy.mp4")


if __name__ == "__main__":
    main()
