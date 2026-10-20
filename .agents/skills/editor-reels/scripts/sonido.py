"""Auditoría de la mezcla de un reel "pro" sin tener que oírla: cada efecto frente a la voz que suena a la vez.

Uso (desde la carpeta del proyecto): python sonido.py <reel>

Lee editor/public/reels/<reel>/edl_pro.json y la voz del vídeo base. Para cada efecto imprime su nivel, el de la
voz en ese instante y la diferencia. Como referencia (mezclas ya aprobadas): los golpes van unos 8–14 dB por
debajo de la voz; los ticks, 12–20 dB por debajo. Avisa de los que tapan la voz o no se van a oír.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

P = Path.cwd()
SR = 48000


def leer(ruta):
    """Canal izquierdo a 48 kHz (la voz del vídeo base es estéreo con los dos canales iguales; mezclarlos sube 3 dB)."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(ruta), "-af", "pan=mono|c0=c0", "-f", "f32le", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def db(x):
    return 20 * np.log10(max(1e-9, float(x)))


def rms(x):
    return float(np.sqrt(np.mean(x ** 2) + 1e-12)) if len(x) else 0.0


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    reel = sys.argv[1]
    pub = P / "editor" / "public"
    edl = json.loads((pub / "reels" / reel / "edl_pro.json").read_text(encoding="utf-8"))
    voz = leer(pub / edl["video"])
    pista = np.zeros_like(voz)
    cache = {}
    filas = []
    for s in edl["sfx"]:
        if s["src"] not in cache:
            cache[s["src"]] = leer(pub / s["src"])
        x = cache[s["src"]] * s["vol"]
        if s.get("dur"):
            x = x[: int(s["dur"] * SR)]
        a = int(s["en"] * SR)
        b = min(len(pista), a + len(x))
        if b <= a:
            continue
        pista[a:b] += x[: b - a]
        pico_i = int(np.argmax(np.abs(x)))
        centro = a + pico_i
        v = voz[max(0, centro - int(0.12 * SR)): centro + int(0.25 * SR)]
        e = x[max(0, pico_i - int(0.02 * SR)): pico_i + int(0.12 * SR)]
        filas.append((centro / SR, Path(s["src"]).stem, db(np.max(np.abs(x))), db(rms(e)), db(rms(v))))
    print(" t (s)   efecto          pico   nivel   voz    efecto-voz")
    fuertes = 0
    for t, nombre, pico, nivel, v in filas:
        dif = nivel - v
        fuerte = dif > -3 and v > -40
        fuertes += fuerte
        aviso = "  << fuerte" if fuerte else ("  (apenas se oirá)" if dif < -26 else "")
        print(f"{t:6.2f}   {nombre:14s} {pico:6.1f}  {nivel:6.1f}  {v:6.1f}   {dif:+6.1f}{aviso}")
    mezcla = voz + pista
    print(f"\nVoz: pico {db(np.max(np.abs(voz))):.1f} dBFS · Efectos: pico {db(np.max(np.abs(pista))):.1f} dBFS, "
          f"nivel medio cuando suenan {db(rms(pista[np.abs(pista) > 1e-4])):.1f} dB · "
          f"Mezcla sin limitar: pico {db(np.max(np.abs(mezcla))):.1f} dBFS")
    print(f"Efectos: {len(filas)} en {len(voz) / SR:.1f} s"
          + (f" · {fuertes} marcados como fuertes: baja su volumen en el guion" if fuertes else ""))


if __name__ == "__main__":
    main()
