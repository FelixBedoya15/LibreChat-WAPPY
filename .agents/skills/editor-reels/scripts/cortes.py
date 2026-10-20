"""Afina los puntos de corte con la energía del audio para no comerse sílabas.

Uso:
    python herramientas/cortes.py trabajo/prueba/audio16k.wav trabajo/prueba/cortes.json \
        --tramos "1.71-5.62,9.26-13.04,..." [--fps 30]

Cada tramo es una zona aproximada a conservar (en segundos del vídeo original), normalmente
sacada de la transcripción y de las zonas de voz. El script busca dónde empieza y acaba de
verdad la voz alrededor de cada borde, añade un margen mínimo y redondea a fotogramas.

Ritmo: un reel no lleva pausas. Los márgenes son de 0,05 s por lado (--pre, --post), así que entre el final de
una frase y el principio de la siguiente queda una décima de segundo. La voz «acaba» cuando baja 24 dB respecto
a su nivel normal: en una sala silenciosa, seguir la cola hasta el suelo de ruido dejaba otras dos décimas.

Un borde con "=" delante ("78.16-=83.74,=84.04-87.67") se respeta tal cual (solo se redondea al
fotograma). Sirve para quitar una respiración dentro de una frase: el ajuste automático la
contaría como voz y la volvería a meter.
"""
import argparse
import json
import wave

import numpy as np

PRE = 0.05   # margen antes de la primera sílaba
POST = 0.05  # margen después de la última
HOP = 0.01   # resolución del análisis (10 ms)


def energia_db(path):
    with wave.open(path, "rb") as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    hop = int(sr * HOP)
    n = len(x) // hop
    frames = x[: n * hop].reshape(n, hop)
    rms = np.sqrt(np.mean(frames ** 2, axis=1) + 1e-12)
    return 20 * np.log10(rms + 1e-9)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("salida")
    ap.add_argument("--tramos", required=True)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--pre", type=float, default=PRE, help="segundos de margen antes de la primera sílaba")
    ap.add_argument("--post", type=float, default=POST, help="segundos de margen después de la última")
    args = ap.parse_args()

    db = energia_db(args.audio)
    t = np.arange(len(db)) * HOP
    suelo = float(np.percentile(db, 10))
    voz = float(np.percentile(db, 95))
    # Voz clara ~27 dB sobre el suelo: así no cuenta como voz la respiración previa (unos 15-25 dB sobre el suelo).
    # Y nunca más de 24 dB por debajo del nivel de la voz: si la sala es muy silenciosa, la cola de la última
    # sílaba tarda dos décimas en llegar al suelo y esa cola se oye como una pausa.
    umbral_inicio = max(suelo + 27, voz - 24)
    umbral_fin = max(suelo + 21, voz - 24)

    tramos = []
    for p in args.tramos.split(","):
        a, b = p.strip().split("-")
        tramos.append((float(a.lstrip("=")), float(b.lstrip("=")), a.startswith("="), b.startswith("=")))
    resultado, fin_anterior = [], 0.0
    for a, b, a_fijo, b_fijo in tramos:
        # Inicio: primera trama con voz clara en [a-0.25, a+0.25]
        zona = (t >= a - 0.25) & (t <= a + 0.25)
        idx = np.where(zona & (db > umbral_inicio))[0]
        inicio = a if a_fijo else (t[idx[0]] if len(idx) else a) - args.pre
        # Fin: última trama con voz en [b-0.30, b+0.30]
        zona = (t >= b - 0.30) & (t <= b + 0.30)
        idx = np.where(zona & (db > umbral_fin))[0]
        fin = b if b_fijo else (t[idx[-1]] + HOP if len(idx) else b) + args.post
        inicio = max(inicio, fin_anterior, 0.0)
        # Redondear a la rejilla de fotogramas para que audio y vídeo no se desfasen
        inicio = round(inicio * args.fps) / args.fps
        fin = round(fin * args.fps) / args.fps
        resultado.append({"inicio": round(inicio, 4), "fin": round(fin, 4),
                          "aprox": [a, b], "ajuste": [round(inicio - a, 3), round(fin - b, 3)]})
        fin_anterior = fin

    salida = 0.0
    for r in resultado:
        r["offset"] = round(salida, 4)
        salida += r["fin"] - r["inicio"]
    out = {"fps": args.fps, "suelo_db": round(suelo, 1), "duracion": round(salida, 4), "tramos": resultado}
    with open(args.salida, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    for r in resultado:
        print(f"{r['inicio']:8.3f} -> {r['fin']:8.3f}  (aprox {r['aprox'][0]:.2f}-{r['aprox'][1]:.2f}, "
              f"ajuste {r['ajuste'][0]:+.2f}/{r['ajuste'][1]:+.2f})  en salida @ {r['offset']:.2f}s")
    print(f"Suelo de ruido {suelo:.1f} dB · duración final {salida:.2f}s")


if __name__ == "__main__":
    main()
