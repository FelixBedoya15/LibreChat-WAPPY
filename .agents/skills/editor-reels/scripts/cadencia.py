"""Mide los fotogramas REALES por segundo de un vídeo (no los que dice el archivo).

Uso:
    python cadencia.py <video> [--voz trabajo/<reel>/transcripcion.json] [--json salida.json]

Muchas cámaras, capturadoras y programas guardan «a 60 fps» (o a 30) una imagen que en realidad va a 25 o a 24:
el archivo repite fotogramas para rellenar. Si el reel se monta a 30, uno de cada seis fotogramas sale repetido
y el movimiento da pequeños tirones (se nota en las manos y en la cabeza). La solución es montar el reel a los
fotogramas reales y quitar los repetidos.

Este script mira varias ventanas del vídeo en las que hay voz (y por tanto movimiento), cuenta los fotogramas
repetidos y devuelve:
    fps_archivo   los que declara el archivo
    fps_real      los que hay de verdad (25, 24, 30…)
    fps_reel      a cuántos tiene que ir el reel (25, 24 o 30)
    mitad         True si antes hay que quedarse con uno de cada dos fotogramas (60 → 30, 50 → 25)
    ciclo         N si después hay que quitar el repetido de cada N fotogramas (6: de 30 a 25; 5: de 30 a 24)
montar_base.py aplica «mitad» y «ciclo» antes de cortar.
"""
import argparse
import json
import subprocess
import sys

import numpy as np

LADO = 160      # los fotogramas se comparan reducidos a 160x160 en gris
VENTANA = 4.0   # segundos por ventana
ESTANDAR = (24, 25, 30, 50, 60)


def fps_archivo(video):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=avg_frame_rate",
                          "-of", "csv=p=0", str(video)], capture_output=True, text=True).stdout
    try:
        num, den = out.strip().split("/")
        return float(num) / float(den)
    except (ValueError, ZeroDivisionError):
        return 30.0


def duracion(video):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(video)],
                         capture_output=True, text=True).stdout
    try:
        return float(out)
    except ValueError:
        return 0.0


def diferencias(video, t0, dur=VENTANA):
    """Diferencia media entre cada fotograma y el anterior en una ventana (0 = idénticos)."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{max(0.0, t0):.3f}", "-t", f"{dur:.3f}", "-i", str(video),
                          "-vf", f"scale={LADO}:{LADO},format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    n = len(raw) // (LADO * LADO)
    if n < 3:
        return np.zeros(0)
    a = np.frombuffer(raw[: n * LADO * LADO], np.uint8).reshape(n, LADO, LADO).astype(np.int16)
    return np.abs(a[1:] - a[:-1]).mean(axis=(1, 2))


def repetidos(d):
    """Fracción de fotogramas repetidos de una ventana, o None si no hay movimiento suficiente para saberlo.

    Los repetidos casi no cambian (solo el ruido de la compresión) y los reales sí: si hay repetidos, las
    diferencias forman dos grupos separados. Se parte en dos (Otsu sobre el logaritmo) y se exige un hueco claro.
    """
    if len(d) < 30 or np.percentile(d, 90) < 0.3:
        return None
    x = np.log10(np.clip(d, 1e-3, np.percentile(d, 98)))
    orden = np.sort(x)
    mejor, corte = -1.0, None
    for k in range(3, len(orden) - 3):
        a, b = orden[:k], orden[k:]
        var = len(a) * len(b) * (a.mean() - b.mean()) ** 2
        if var > mejor:
            mejor, corte = var, (orden[k - 1] + orden[k]) / 2
    bajos, altos = d[x <= corte], d[x > corte]
    if len(bajos) < 3 or len(altos) < 3:
        return 0.0
    if np.percentile(bajos, 95) * 2.5 >= np.percentile(altos, 5):  # sin hueco entre grupos: todo son fotogramas reales
        return 0.0
    return len(bajos) / len(d)


def ventanas(video, voz=None, cuantas=6):
    """Instantes donde medir: dentro de las zonas de voz (hay movimiento), repartidos por el vídeo."""
    if voz:
        largas = [v for v in voz if v["end"] - v["start"] >= 1.5]
        if largas:
            paso = max(1, len(largas) // cuantas)
            return [(v["start"] + 0.15, min(VENTANA, v["end"] - v["start"] - 0.2)) for v in largas[::paso][:cuantas]]
    dur = duracion(video)
    return [(dur * p, VENTANA) for p in (0.1, 0.25, 0.4, 0.55, 0.7, 0.85)] if dur > 8 else [(0.0, max(1.0, dur))]


def plan(fps_c, real):
    """Fotogramas del reel y cómo quitar los repetidos."""
    mitad = fps_c >= 47
    c2 = fps_c / 2 if mitad else fps_c  # fotogramas después de quedarse con la mitad
    if real >= 47:  # 50 o 60 reales: el reel va a la mitad
        return {"fps_reel": int(round(real / 2)), "mitad": True, "ciclo": None}
    if abs(real - c2) < 0.6:  # ya coincide (30 en 60, 25 en 50, 30 en 30…): no sobra nada más
        return {"fps_reel": int(round(c2)), "mitad": mitad, "ciclo": None}
    if abs(c2 - 30) < 0.6 and real in (24, 25):  # 25 o 24 reales dentro de 30: sobra uno de cada 6 o de cada 5
        return {"fps_reel": real, "mitad": mitad, "ciclo": int(round(30 / (30 - real)))}
    return None


def por_archivo(fps_c):
    """Sin medir: 25 para vídeos de 25 o 50 fps, 24 para 24 o 48 y 30 para el resto."""
    for base in (25, 24):
        if abs(fps_c - base) < 0.2 or abs(fps_c - 2 * base) < 0.4:
            return base
    return 30


def medir(video, voz=None):
    fps_c = fps_archivo(video)
    medidas = []
    for t0, dur in ventanas(video, voz):
        r = repetidos(diferencias(video, t0, dur))
        if r is not None:
            medidas.append(r)
    res = {"fps_archivo": round(fps_c, 3), "fps_real": None, "fps_reel": por_archivo(fps_c), "mitad": fps_c >= 47,
           "ciclo": None, "repetidos": None, "ventanas": len(medidas)}
    if not medidas:
        res["nota"] = "sin movimiento suficiente para medir: se usan los fotogramas del archivo"
        return res
    # Cada ventana vota por los fotogramas reales que le salen. Una ventana con poco movimiento cuenta repetidos
    # de más (y no cuadra con ningún estándar): solo vale lo que confirmen dos ventanas; si hay empate, lo más alto.
    candidatos = {}
    for r in medidas:
        unicos = fps_c * (1 - r)
        for e in ESTANDAR:
            if e <= fps_c + 0.6 and abs(unicos - e) / e < 0.035:
                candidatos.setdefault(e, []).append(r)
    fiables = [e for e, rs in candidatos.items() if len(rs) >= min(2, len(medidas))]
    if not fiables:
        res["nota"] = "los fotogramas repetidos no siguen un patrón estándar: se usan los fotogramas del archivo"
        return res
    real = max(fiables)
    res["fps_real"] = real
    res["repetidos"] = round(float(np.median(candidatos[real])), 3)
    p = plan(fps_c, real)
    if p is None:
        res["nota"] = f"{real} fotogramas reales en un archivo de {fps_c:.2f}: combinación no prevista; se monta sin quitar repetidos"
        return res
    res.update(p)
    return res


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--voz", default=None, help="transcripcion.json (para medir donde hay voz)")
    ap.add_argument("--json", default=None)
    a = ap.parse_args()
    voz = json.load(open(a.voz, encoding="utf-8")).get("voz") if a.voz else None
    res = medir(a.video, voz)
    if a.json:
        json.dump(res, open(a.json, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps(res, ensure_ascii=False))
    if res.get("fps_real") and abs(res["fps_real"] - res["fps_archivo"]) > 0.6:
        print(f"El archivo dice {res['fps_archivo']:.0f} fps pero la imagen va a {res['fps_real']}: el reel se monta a "
              f"{res['fps_reel']} fps y se quitan los fotogramas repetidos.")


if __name__ == "__main__":
    main()
