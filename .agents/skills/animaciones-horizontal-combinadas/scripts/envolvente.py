"""Comprueba a ojo dónde empieza de verdad una palabra: energía de la voz en tramos de 20 ms.

Uso:
    python envolvente.py <audio> trabajo/tiempos.json <palabra|índice> [...]

Para cada palabra pedida dibuja la energía desde 0,4 s antes hasta 0,6 s después de su inicio alineado
(un carácter = 20 ms, más denso = más voz) y marca con ^ dónde la sitúa la alineación. También lista las
pausas de más de 120 ms: el inicio de frase tras una pausa es el punto más fiable para comprobar sincronía.
Solo necesita ffmpeg y numpy.
"""
import json
import subprocess
import sys

import numpy as np

SR = 16000


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    audio, tiempos, pedidas = sys.argv[1], sys.argv[2], sys.argv[3:]
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", audio, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    y = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    hop = int(.02 * SR)
    n = len(y) // hop
    db = 20 * np.log10(np.sqrt((y[: n * hop].reshape(n, hop) ** 2).mean(axis=1)) + 1e-9)
    db -= db.max()
    try:
        words = json.load(open(tiempos, encoding="utf-8"))
    except FileNotFoundError:
        sys.exit(f"No existe {tiempos}: ejecuta antes 'anim.py alinear'.")

    # pausas
    sil = db < -40
    pausas, i = [], 0
    while i < n:
        if sil[i]:
            j = i
            while j < n and sil[j]:
                j += 1
            if (j - i) * .02 >= .12:
                pausas.append(f"{i * .02:.2f}-{j * .02:.2f}")
            i = j
        else:
            i += 1
    print("Pausas (>120 ms): " + (", ".join(pausas) if pausas else "ninguna (voz continua)"))
    voz = np.nonzero(db > np.percentile(db, 90) - 22)[0]    # 22 dB por debajo del nivel típico de la voz: fuera respiraciones y ruido
    if len(voz):
        print(f"La voz empieza en {voz[0] * .02:.2f} s (puede ser una respiración) y termina en {voz[-1] * .02 + .02:.2f} s "
              f"(audio de {n * .02:.2f} s): el final de la última palabra, mejor de aquí que de la alineación.")

    esc = " .:-=+*#%@"
    for p in pedidas:
        sel = [w for w in words if str(w["i"]) == p] if p.isdigit() else [w for w in words if w["w"].lower() == p.lower()]
        if not sel:
            print(f"\n{p}: no está en {tiempos}")
            continue
        for w in sel:
            a = max(0, int((w["s"] - .4) / .02)); b = min(n, int((w["s"] + .6) / .02))
            seg = db[a:b]
            barra = "".join(esc[int(np.clip((v + 45) / 45 * 9, 0, 9))] for v in seg)
            pos = int(round((w["s"] - a * .02) / .02))
            # subida de energía más fuerte cerca del inicio alineado (±0,2 s): ahí arranca la palabra
            c0, c1 = max(1, int((w["s"] - .2) / .02)), min(n - 1, int((w["s"] + .2) / .02))
            suave = np.convolve(db, np.ones(3) / 3, mode="same")
            subida = c0 + int(np.argmax(np.diff(suave[c0 - 1:c1 + 1])))
            ts = subida * .02
            print(f"\n[{w['i']}] {w['w']}  alineada en {w['s']:.2f} s · subida de energía en {ts:.2f} s "
                  f"(diferencia {ts - w['s']:+.2f} s)   ({a * .02:.2f} … {b * .02:.2f})")
            print("  |" + barra + "|")
            print("   " + " " * pos + "^")
    print("\nDiferencias de ±0,06 s o menos: bien. Más grandes en palabras tras una pausa: revisa el guion de esa frase.")


if __name__ == "__main__":
    main()
