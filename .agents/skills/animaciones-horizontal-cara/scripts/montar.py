"""Monta una intro a cámara: planos de cara (la toma sin pausas) alternados con la animación a pantalla completa.

Uso (desde la carpeta del proyecto):
    python montar.py                    -> a la resolución de la grabación (4K si es 4K): out/<proyecto>_<alto>p<fps>.mp4
    python montar.py --res 1080         -> 1920x1080 (borrador rápido para revisar el ritmo, o versión ligera)
    python montar.py --reusar           -> no vuelve a renderizar las animaciones que ya tienen el tamaño y largo correctos
    python montar.py --nombre Muse_intro

Lee edicion/montaje.json (qué fotogramas son cara y cuáles animación) y edicion/cortes.json (de qué parte de la
toma sale cada fotograma del montaje). Solo se renderizan los planos de animación (render.mjs --from/--to, a
escala ancho/1920). Cada plano se codifica aparte con los mismos parámetros de x264 y se unen sin recodificar;
la voz es edicion/voz_cortada.wav entera, desde el fotograma 0: imagen y voz van clavadas por construcción.

Planos de cara: un trozo por cada tramo de la toma que cae dentro (entre saltos de corte), con el encuadre de
"zooms" (se recorre en ciclo: [1.0, 1.22] alterna plano completo y plano corto en cada salto). El plano corto se
centra en montaje.json -> "cerca" {cx, y0} (px de la toma; lo calcula cortar.py con un detector de caras).
"""
import argparse
import json
import subprocess
import sys
import time
from pathlib import Path


def sh(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        sys.exit(f"Falló: {' '.join(map(str, cmd))}\n{r.stderr[-2000:]}")
    return r.stdout


def sonda(f):
    out = sh(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets",
              "-show_entries", "stream=width,height,nb_read_packets", "-of", "csv=p=0", str(f)])
    w, h, n = (int(v) for v in out.strip().split(","))
    return w, h, n


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--res", type=int, default=0, choices=[0, 720, 1080, 1440, 2160], help="alto de salida (0 = el de la toma)")
    ap.add_argument("--reusar", action="store_true")
    ap.add_argument("--crf", type=int, default=0)
    ap.add_argument("--nombre", default="")
    a = ap.parse_args()

    montaje = json.load(open("edicion/montaje.json", encoding="utf-8"))
    cortes = json.load(open("edicion/cortes.json", encoding="utf-8"))
    fuente = json.load(open("edicion/fuente.json", encoding="utf-8"))
    SW, SH, fps = fuente["ancho"], fuente["alto"], cortes["fps"]
    H = a.res or SH
    W = int(round(H * SW / SH / 2)) * 2
    escala = W / 1920                                    # la animación se diseña a 1920x1080
    crf = a.crf or (16 if H > 1080 else 18)
    fps_ff = fuente.get("fps_txt") or f"{fps:.10g}"          # exacto para ffmpeg ("60", "60000/1001")
    fps_nombre = f"{round(fps, 2):g}"
    ts = "60000" if abs(fps * 1.001 - round(fps * 1.001)) < 1e-3 and fps % 1 else "90000"   # base de tiempos común a todas las piezas
    enc = ["-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-pix_fmt", "yuv420p", "-profile:v", "high",
           "-g", str(int(round(fps * 2))), "-r", fps_ff, "-video_track_timescale", ts,
           "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", "-an"]
    cerca = montaje.get("cerca", {"cx": SW // 2, "y0": 0})
    tramos = cortes["tramos"]
    planos = montaje["planos"]
    total = cortes["fotogramas"]
    if planos[0]["f0"] != 0 or planos[-1]["f1"] != total or any(p["f0"] != q["f1"] for q, p in zip(planos, planos[1:])):
        sys.exit("edicion/montaje.json: los planos tienen que ir seguidos de f0=0 a f1=" + str(total) + " (revisa con 'anim.py planos')")
    nombre = a.nombre or Path.cwd().name
    dir_p = Path("out") / "planos" / str(H)
    dir_p.mkdir(parents=True, exist_ok=True)
    piezas, t0 = [], time.time()

    for k, pl in enumerate(planos):
        f0, f1 = pl["f0"], pl["f1"]
        if pl["tipo"] == "anim":
            bruto = dir_p / f"anim_{pl['id']}_bruto.mp4"
            if not (a.reusar and bruto.exists() and sonda(bruto) == (W, H, f1 - f0)):
                print(f"[{k}] animación '{pl['id']}' f{f0}-{f1} ({(f1 - f0) / fps:.2f} s) · render {W}x{H}...", flush=True)
                r = subprocess.run(["node", "render.mjs", f"--from={f0 / fps:.6f}", f"--to={f1 / fps:.6f}", "--noaudio",
                                    f"--scale={escala:g}", f"--fps={fps!r}", "--crf=8", "--preset=fast", f"--out={bruto}"])
                if r.returncode != 0:
                    sys.exit("Falló el render de la animación")
            w, h, n = sonda(bruto)
            if (w, h, n) != (W, H, f1 - f0):
                sys.exit(f"La animación '{pl['id']}' salió a {w}x{h} con {n} fotogramas; debería ser {W}x{H} con {f1 - f0}")
            pieza = dir_p / f"p{k:02d}_anim_{pl['id']}.mp4"
            sh(["ffmpeg", "-v", "error", "-y", "-i", str(bruto), "-frames:v", str(f1 - f0), *enc, str(pieza)])
            piezas.append(pieza)
            continue
        sub = 0
        zooms = pl.get("zooms") or [1.0]
        for tr in tramos:
            e0, e1 = tr["edit_f0"], tr["edit_f0"] + (tr["src_f1"] - tr["src_f0"])
            c0, c1 = max(f0, e0), min(f1, e1)
            if c1 <= c0:
                continue
            z = zooms[sub % len(zooms)]
            s0 = tr["src_f0"] + (c0 - e0)
            vf = []
            if z != 1:
                wc, hc = int(round(SW / z / 2)) * 2, int(round(SH / z / 2)) * 2
                x0 = int(min(max(cerca["cx"] - wc / 2, 0), SW - wc)) // 2 * 2
                y0 = int(min(max(cerca["y0"], 0), SH - hc)) // 2 * 2
                vf.append(f"crop={wc}:{hc}:{x0}:{y0}")
            if z != 1 or (W, H) != (SW, SH):
                vf.append(f"scale={W}:{H}:flags=lanczos")
            pieza = dir_p / f"p{k:02d}_cara_{sub}.mp4"
            print(f"[{k}] cara f{c0}-{c1} ({(c1 - c0) / fps:.2f} s) · toma f{s0}-{s0 + c1 - c0} · zoom {z}", flush=True)
            sh(["ffmpeg", "-v", "error", "-y", "-ss", f"{(s0 - .4) / fps:.6f}", "-i", fuente["video"], "-frames:v", str(c1 - c0),
                *(["-vf", ",".join(vf)] if vf else []), *enc, str(pieza)])
            if sonda(pieza) != (W, H, c1 - c0):
                sys.exit(f"{pieza.name}: tamaño o número de fotogramas incorrecto")
            piezas.append(pieza)
            sub += 1

    lista = dir_p / "lista.txt"
    lista.write_text("".join(f"file '{p.resolve().as_posix()}'\n" for p in piezas), encoding="utf-8")
    video = dir_p / "video.mp4"
    sh(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lista), "-c", "copy", str(video)])
    n = sonda(video)[2]
    if n != total:
        sys.exit(f"El montaje tiene {n} fotogramas y la voz {total}")
    final = Path("out") / f"{nombre}_{H}p{fps_nombre}.mp4"
    sh(["ffmpeg", "-v", "error", "-y", "-i", str(video), "-i", "edicion/voz_cortada.wav",
        "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-ac", "2",
        "-movflags", "+faststart", str(final)])
    print(f"\nListo en {time.time() - t0:.0f} s -> {final} ({n} fotogramas, {n / fps:.2f} s, {final.stat().st_size / 1e6:.1f} MB)")
    print("Revisa los cortes: 'anim.py planos --hoja " + final.as_posix() + "' y la sincronía: 'anim.py comprobar "
          + final.as_posix() + " --palabras'")


if __name__ == "__main__":
    main()
