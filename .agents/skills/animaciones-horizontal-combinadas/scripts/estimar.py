"""Tiempos estimados por palabra cuando NO hay audio, a partir de una transcripción con marcas de tiempo.

Uso:
    python estimar.py trabajo/transcripcion_marcas.txt --salida trabajo/tiempos.json [--dur 41] [--ritmo 6.0]

Formato de entrada (el de YouTube o de cualquier transcriptor): una marca "mm:ss" (o "hh:mm:ss") en su propia
línea o al principio de la línea, seguida del texto que empieza ahí. El texto antes de la primera marca empieza
en 0:00. Ejemplo:
    He estado probando durante estos días Opus 5.5 y me tengo que comer mis palabras.
    00:05
    En vídeos anteriores decía que Opus no me parecía para tanto.

Cómo estima: cada frase empieza en su marca y sus palabras se reparten por sílabas a un ritmo de habla
(sílabas por segundo, 6 por defecto; si la frase no cabe antes de la siguiente marca, se acelera), con una pausa
corta tras cada coma. Precisión: ±0,3–0,5 s dentro de cada frase (las marcas de un transcriptor ya redondean al
segundo). Sirve para montar y revisar; si luego aparece el audio, alinea con alinear.py y cambia T.

Salida: la misma lista que alinear.py ({"i", "w", "s", "e", "score": null, "frase", "estimado": true}).
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from alinear import hablar   # noqa: E402  (forma hablada: cifras a palabras, sin símbolos)

MARCA = re.compile(r"^\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s*(.*)$")
VOCALES = re.compile(r"[aeiouy]+")


def silabas(palabra: str) -> int:
    """Aproximación en español: grupos de vocales de la forma hablada ("cinco punto cinco" -> 5)."""
    h = hablar(palabra)
    return max(1, sum(len(VOCALES.findall(w)) for w in h.split())) if h else 1


def leer(ruta: Path):
    """-> lista de (inicio, texto) por frase."""
    frases, t_actual, buf = [], 0.0, []

    def cerrar():
        if buf:
            frases.append((t_actual, " ".join(buf)))
            buf.clear()

    for linea in ruta.read_text(encoding="utf-8").splitlines():
        m = MARCA.match(linea)
        if m:
            cerrar()
            h, mm, ss, resto = m.group(1), int(m.group(2)), int(m.group(3)), m.group(4).strip()
            t_actual = (int(h) * 3600 if h else 0) + mm * 60 + ss
            if resto:
                buf.append(resto)
        elif linea.strip():
            buf.append(linea.strip())
    cerrar()
    return frases


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("transcripcion")
    ap.add_argument("--salida", default="trabajo/tiempos.json")
    ap.add_argument("--dur", type=float, default=0, help="duración total (para la última frase)")
    ap.add_argument("--ritmo", type=float, default=6.0, help="sílabas por segundo al hablar (Josema: ~6)")
    ap.add_argument("--retardo", type=float, default=0.15, help="la voz suele arrancar un poco después de la marca")
    a = ap.parse_args()

    frases = leer(Path(a.transcripcion))
    if not frases:
        sys.exit("No encuentro texto en la transcripción.")
    out, i = [], 0
    for nf, (t0, texto) in enumerate(frases):
        fin = frases[nf + 1][0] if nf + 1 < len(frases) else (a.dur or t0 + 6)
        palabras = texto.split()
        sil = [silabas(w) for w in palabras]
        pausas = [0.16 if re.search(r"[,;:]$", w) else 0.0 for w in palabras]
        disponible = max(0.5, fin - (t0 + a.retardo) - 0.25)      # deja un respiro antes de la siguiente frase
        ritmo = max(a.ritmo, sum(sil) / max(0.3, disponible - sum(pausas)))
        cur = t0 + a.retardo
        for w, s, pz in zip(palabras, sil, pausas):
            d = s / ritmo
            vis = w.strip(".,;:!?¡¿\"'«»()…")
            if vis:
                out.append({"i": i, "w": vis, "s": round(cur, 2), "e": round(cur + d, 2), "score": None, "frase": nf, "estimado": True})
                i += 1
            cur += d + pz
    Path(a.salida).parent.mkdir(parents=True, exist_ok=True)
    json.dump(out, open(a.salida, "w", encoding="utf-8"), ensure_ascii=False, indent=0)

    frase = -1
    for o in out:
        if o["frase"] != frase:
            frase = o["frase"]
            print(f"--- frase {frase + 1} (marca {frases[frase][0]:.0f} s)")
        print(f"  [{o['i']:3d}] {o['s']:7.2f} {o['e']:7.2f}  {o['w']}")
    print(f"\n{len(out)} palabras -> {a.salida}  (ESTIMADOS: ±0,3–0,5 s dentro de cada frase)")
    print("Pon los visuales importantes al principio de cada frase (la marca es lo más fiable) y deja margen en el resto.")


if __name__ == "__main__":
    main()
