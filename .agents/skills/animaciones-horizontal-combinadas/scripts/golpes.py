"""Cuadra la música con el montaje: busca los golpes fuertes del tema y propone desde qué segundo empezarlo para que
uno de ellos caiga en el momento clave del vídeo (el revelado, el nombre del producto).

Uso (desde la carpeta del proyecto):
    python anim.py golpe --en 12.06 [--pista intro-tambores] [--tambien efectos titulos 22.35] [--n 8]

--en        segundo del vídeo donde tiene que caer el golpe (p. ej. T.claude - .03)
--pista     clave de musica/musica.json (por defecto la de ESTILO.musica del proyecto)
--tambien   otros instantes (números o nombres del objeto T del index.html) donde conviene que la música marque algo:
            cuenta cuántos coinciden (±80 ms) con un golpe del tema en cada propuesta
Ordena por la fuerza del golpe, el redoble que lo prepara (golpes en el 1,2 s anterior: lo que lo hace épico) y las
coincidencias. Imprime las propuestas y la línea para ESTILO.tramosMusica. Nació en «editado por IA» (29/09/2026): el
redoble de Epical Drums 01 terminando justo en «Claude» (desde 22,665 s).
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

SKILL = Path(__file__).resolve().parent.parent
MUS = SKILL / "musica"
SR = 22050


def leer(f):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(f), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32)


def golpes(a):
    """instantes (s) y fuerza de los golpes: flujo espectral en agudos (platos, redobles) + graves (bombo)"""
    fr, hop = 1024, 256
    fps = SR / hop
    fr_ = np.lib.stride_tricks.sliding_window_view(a, fr)[::hop]
    S = np.abs(np.fft.rfft(fr_ * np.hanning(fr), axis=1))
    f = np.fft.rfftfreq(fr, 1 / SR)
    d = np.maximum(0, np.diff(np.log1p(S), axis=0))
    hi, lo = d[:, f > 3000].sum(1), d[:, f < 200].sum(1)
    fuerza = hi / (hi.mean() + 1e-9) + lo / (lo.mean() + 1e-9)
    picos = [i for i in range(1, len(fuerza) - 1) if fuerza[i] >= fuerza[i - 1] and fuerza[i] > fuerza[i + 1]]
    picos.sort(key=lambda i: -fuerza[i])
    sel = []
    for i in picos:                                   # separados ≥ 0,25 s
        if all(abs(i - j) > .25 * fps for j in sel):
            sel.append(i)
    return np.array([i / fps for i in sel]), np.array([fuerza[i] for i in sel])


def leer_T():
    try:
        html = Path("index.html").read_text(encoding="utf-8")
    except OSError:
        return {}, None
    m = re.search(r"^const T = \{(.*?)^\};", html, re.S | re.M)
    T = {k: float(v) for k, v in re.findall(r"(\w+):\s*(-?\d*\.?\d+)", m.group(1))} if m else {}
    e = re.search(r"^const ESTILO = (\{.*\});", html, re.M)
    c = re.search(r"dur:\s*([\d.]+)", html)
    estilo = json.loads(e.group(1)) if e else {}
    return T, (estilo, float(c.group(1)) if c else None)


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--en", type=float, required=True, help="segundo del vídeo donde cae el golpe")
    ap.add_argument("--pista", default="")
    ap.add_argument("--tambien", nargs="*", default=[])
    ap.add_argument("--dur", type=float, default=0, help="duración del vídeo (por defecto CONFIG.dur del proyecto)")
    ap.add_argument("--n", type=int, default=8)
    a = ap.parse_args()
    man = json.load(open(MUS / "musica.json", encoding="utf-8"))
    T, extra = leer_T()
    estilo, dur = extra if extra else ({}, None)
    pista = a.pista or estilo.get("musica") or "intro-tambores"
    if pista not in man:
        sys.exit(f"No hay '{pista}' en musica/musica.json. Temas: {', '.join(man)}")
    dur = a.dur or dur or 40.0
    tambien = []
    for x in a.tambien:
        try:
            tambien.append((x, float(x)))
        except ValueError:
            if x not in T:
                sys.exit(f"'{x}' no está en el objeto T del index.html")
            tambien.append((x, T[x]))
    x = leer(MUS / man[pista]["archivo"])
    dur_tema = len(x) / SR
    ts, fz = golpes(x)
    fuertes = ts[fz >= np.percentile(fz, 85)]
    rms = lambda t0, t1: 20 * np.log10(np.sqrt(np.mean(x[int(t0 * SR):int(t1 * SR)] ** 2)) + 1e-9)
    props = []
    for t, f in zip(ts, fz):
        desde = t - a.en
        if desde < 0 or desde + dur > dur_tema + .01:
            continue
        coinc = [n for n, tt in tambien if np.min(np.abs(fuertes - (desde + tt))) <= .08]
        antes, despues = rms(max(0, t - 1.5), t), rms(t, t + 1.5)
        red = fz[(ts > t - 1.2) & (ts < t - .05) & (fz >= np.percentile(fz, 60))].sum()   # redoble que prepara el golpe
        props.append((f, t, desde, coinc, antes, despues, red))
    if not props:
        sys.exit(f"Ningún golpe del tema deja sitio para {dur:.1f} s de vídeo con el golpe en {a.en} s (el tema dura {dur_tema:.1f} s)")
    rmax = max(p[6] for p in props) or 1
    props.sort(key=lambda p: -(p[0] + 8 * p[6] / rmax + 1.5 * len(p[3])))
    print(f"{man[pista]['titulo']} ({pista}) · {dur_tema:.1f} s · vídeo de {dur:.1f} s · golpe en {a.en:.2f} s del vídeo\n")
    print("  fuerza  redoble  golpe(tema)  desde    subida     coinciden con")
    for f, t, desde, coinc, antes, despues, red in props[:a.n]:
        sub = "↑ entra" if despues - antes > 3 else ("= sigue" if despues - antes > -3 else "↓ baja")
        print(f"  {f:6.1f}  {red / rmax * 100:5.0f} %  {t:9.3f} s  {desde:7.3f}  {sub:9s}  {', '.join(coinc) if coinc else '—'}")
    f, t, desde, *_ = props[0]
    nivel = man[pista].get("nivel_db", -18)
    print("\nPara usar la primera, pega esto en ESTILO (index.html; anim.py estilo no lo toca) o elige otra fila:")
    print(f'  "tramosMusica": [{{"pista": "{pista}", "t0": 0, "desde": {desde:.3f}, "nivel_db": {nivel}, "entrada": 0.35}}]')
    print("Después: anim.py sonido y escucha el golpe (trabajo/pistas/musica.wav). «↑ entra» = la música crece en el golpe.")


if __name__ == "__main__":
    main()
