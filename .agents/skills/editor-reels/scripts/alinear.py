"""Alineación forzada del guion (texto ya corregido) sobre la voz: inicio y fin exactos de cada palabra.

Uso:
    python alinear.py <audio> trabajo/<reel>/alineacion/guion.txt --salida trabajo/<reel>/alineacion/tiempos.json
                      [--whisper trabajo/<reel>/transcripcion_base.json]

Usa torchaudio MMS_FA (modelo multilingüe de 1,2 GB que se descarga la primera vez). A diferencia de Whisper,
no adivina el texto: lo conoce y solo busca dónde suena cada letra, así que los tiempos caen donde empieza
de verdad la palabra (Whisper suele ir 0,2–0,45 s adelantado). Es lo que permite que cada animación entre en
la sílaba que toca.

guion.txt: una frase por línea, tal como debe verse en pantalla ("Opus 5.5", "GPT-6", "OpenAI").
    - Las cifras se pronuncian solas en español: "5.5" -> "cinco punto cinco", "40%" -> "cuarenta por ciento".
    - Si algo se pronuncia distinto de como se escribe, pon la pronunciación entre llaves pegada a la palabra:
          GPT-6{yi pi ti six}   OpenAI{open ei ai}   n8n{ene ocho ene}   Claude{clod}
      o crea pronunciacion.json junto al guion con {"GPT-6": "yi pi ti six", ...} (vale para todas sus apariciones).
    - Un nombre mal pronunciado solo baja su puntuación: las palabras de alrededor lo anclan igual.

Salida: lista de {"i", "w", "s", "e", "score", "frase"} y una tabla por consola (? = puntuación baja).
El número "i" de cada palabra es el que se usa en el guion para partir subtítulos o destacar una palabra.

Sin PyTorch (torch y torchaudio) no hay alineación exacta: con --whisper se reparten los tiempos de Whisper sobre
las palabras del guion. Sirve para salir del paso (±0,1–0,3 s), pero las animaciones no caerán en la sílaba.
"""
import argparse
import difflib
import json
import re
import statistics
import subprocess
import sys
import unicodedata
from pathlib import Path

SR = 16000
ADELANTO_WHISPER = 0.15  # segundos que se retrasan los tiempos de Whisper en el modo aproximado
UNI = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece",
       "catorce", "quince", "dieciseis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidos",
       "veintitres", "veinticuatro", "veinticinco", "veintiseis", "veintisiete", "veintiocho", "veintinueve"]
DEC = {3: "treinta", 4: "cuarenta", 5: "cincuenta", 6: "sesenta", 7: "setenta", 8: "ochenta", 9: "noventa"}
CEN = {1: "ciento", 2: "doscientos", 3: "trescientos", 4: "cuatrocientos", 5: "quinientos", 6: "seiscientos",
       7: "setecientos", 8: "ochocientos", 9: "novecientos"}


def num_es(n: int) -> str:
    """Entero a palabras en español (hasta millones)."""
    if n < 30:
        return UNI[n]
    if n < 100:
        d, u = divmod(n, 10)
        return DEC[d] + ("" if u == 0 else " y " + UNI[u])
    if n < 1000:
        c, r = divmod(n, 100)
        if n == 100:
            return "cien"
        return CEN[c] + ("" if r == 0 else " " + num_es(r))
    if n < 1_000_000:
        m, r = divmod(n, 1000)
        return ("mil" if m == 1 else num_es(m) + " mil") + ("" if r == 0 else " " + num_es(r))
    m, r = divmod(n, 1_000_000)
    return ("un millon" if m == 1 else num_es(m) + " millones") + ("" if r == 0 else " " + num_es(r))


def plano(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    return s.lower()


def _decimal(m) -> str:
    ent, sep, frac = m.group(1), m.group(2), m.group(3)
    if sep == "." and len(frac) == 3:                       # 10.000 = diez mil
        return f" {num_es(int(ent + frac))} "
    dec = " ".join(num_es(int(c)) for c in frac) if frac.startswith("0") else num_es(int(frac))
    return f" {num_es(int(ent))} {'punto' if sep == '.' else 'coma'} {dec} "


def hablar(tok: str) -> str:
    """Forma hablada (solo a-z y espacios) de una palabra tal como se escribe."""
    t = re.sub(r"\$(\d+(?:[.,]\d+)?)", r"\1$", tok)       # "$10" se dice "diez dólares"
    t = t.replace("%", " por ciento ").replace("€", " euros ").replace("$", " dolares ").replace("&", " y ").replace("+", " mas ")
    t = re.sub(r"(\d+)([.,])(\d+)", _decimal, t)
    t = re.sub(r"\d+", lambda m: " " + num_es(int(m.group(0))) + " ", t)
    t = plano(t)
    t = re.sub(r"[^a-z' ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def leer_guion(ruta: Path, pron: dict):
    """-> lista de (texto_visible, forma_hablada, nº de frase)."""
    out = []
    for nf, linea in enumerate(ruta.read_text(encoding="utf-8").splitlines()):
        for m in re.finditer(r"(\S+?)\{([^}]*)\}|(\S+)", linea):
            vis = m.group(1) or m.group(3)
            limpio = vis.strip(".,;:!?¡¿\"'«»()[]…—-")
            forzada = m.group(2)
            if forzada is None:
                forzada = pron.get(limpio) or pron.get(vis)
            hab = plano(forzada) if forzada else hablar(limpio or vis)
            hab = re.sub(r"[^a-z' ]+", " ", hab).strip()
            if hab:
                out.append((limpio or vis, hab, nf))
            else:
                print(f"(sin sonido, se ignora: {vis!r})", file=sys.stderr)
    return out


def cargar_audio(audio):
    import numpy as np
    import torch
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(audio), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return torch.from_numpy(np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768).unsqueeze(0)


def emisiones(model, wav, dev):
    """Probabilidades por trama (20 ms). Audios largos: por trozos de 30 s con 1 s de contexto a cada lado."""
    import torch
    N = wav.shape[1]
    with torch.inference_mode():
        if N <= 60 * SR:
            em, _ = model(wav.to(dev))
            return em[0].cpu()
        chunk, ctx, outs, start = 30 * SR, SR, [], 0
        while start < N:
            a, b = max(0, start - ctx), min(N, start + chunk + ctx)
            em, _ = model(wav[:, a:b].to(dev))
            em = em[0].cpu()
            r = em.shape[0] / (b - a)
            outs.append(em[int(round((start - a) * r)):int(round((min(N, start + chunk) - a) * r))])
            start += chunk
        return torch.cat(outs)


def exacta(audio, items):
    """Alineación forzada con MMS_FA. Lanza ImportError si no hay torch o torchaudio."""
    import torch
    from torchaudio.pipelines import MMS_FA as bundle

    dev = "cuda" if torch.cuda.is_available() else "cpu"
    wav = cargar_audio(audio)
    model = bundle.get_model(with_star=False).to(dev).eval()
    tok, aligner = bundle.get_tokenizer(), bundle.get_aligner()
    em = emisiones(model, wav, dev)
    habladas = [w for _, h, _ in items for w in h.split()]
    dueno = [i for i, (_, h, _) in enumerate(items) for _ in h.split()]
    spans = aligner(em, tok(habladas))
    ratio = wav.shape[1] / em.shape[0] / SR
    out = []
    for i, (vis, hab, nf) in enumerate(items):
        ks = [k for k, o in enumerate(dueno) if o == i]
        s = spans[ks[0]][0].start * ratio
        e = spans[ks[-1]][-1].end * ratio
        sc = sum(x.score for k in ks for x in spans[k]) / sum(len(spans[k]) for k in ks)
        out.append({"i": i, "w": vis, "s": round(s, 3), "e": round(e, 3), "score": round(float(sc), 2), "frase": nf})
    return out, dev


def aproximada(items, whisper):
    """Sin PyTorch: los tiempos de Whisper repartidos sobre las palabras del guion (menos exacto)."""
    wh = [w for w in whisper if re.sub(r"\W", "", w["word"])]
    A = [plano(re.sub(r"\W", "", vis)) for vis, _, _ in items]
    B = [plano(re.sub(r"\W", "", w["word"])) for w in wh]
    tiempos = [None] * len(items)
    for blk in difflib.SequenceMatcher(None, A, B, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            tiempos[blk.a + k] = (wh[blk.b + k]["start"], wh[blk.b + k]["end"])
    fin_total = wh[-1]["end"] if wh else 0.0
    k = 0
    while k < len(items):  # las palabras que Whisper escribió distinto se reparten en el hueco, según su longitud
        if tiempos[k] is not None:
            k += 1
            continue
        j = k
        while j < len(items) and tiempos[j] is None:
            j += 1
        a = tiempos[k - 1][1] if k > 0 else 0.0
        b = tiempos[j][0] if j < len(items) else fin_total
        b = max(b, a + 0.08 * (j - k))
        pesos = [max(1, len(items[x][1])) for x in range(k, j)]
        t = a
        for x, p in zip(range(k, j), pesos):
            d = (b - a) * p / sum(pesos)
            tiempos[x] = (t, t + d)
            t += d
        k = j
    # Whisper marca el inicio de las palabras unos 0,2 s antes de que suenen (mediana medida): se compensa una parte
    return [{"i": i, "w": vis, "s": round(tiempos[i][0] + ADELANTO_WHISPER, 3), "e": round(tiempos[i][1] + ADELANTO_WHISPER, 3),
             "score": 0.0, "frase": nf, "aprox": True} for i, (vis, _, nf) in enumerate(items)]


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("guion")
    ap.add_argument("--salida", default=None)
    ap.add_argument("--whisper", default=None, help="transcripcion_base.json: para comparar y como respaldo sin PyTorch")
    a = ap.parse_args()

    guion = Path(a.guion)
    salida = Path(a.salida) if a.salida else guion.parent / "tiempos.json"
    pron_f = guion.parent / "pronunciacion.json"
    pron = json.loads(pron_f.read_text(encoding="utf-8")) if pron_f.exists() else {}
    items = leer_guion(guion, pron)
    if not items:
        sys.exit("El guion está vacío.")
    whisper = []
    if a.whisper and Path(a.whisper).exists():
        whisper = json.load(open(a.whisper, encoding="utf-8")).get("palabras", [])

    try:
        out, dev = exacta(a.audio, items)
    except ImportError as e:
        if not whisper:
            sys.exit(f"Falta PyTorch para la alineación exacta ({e}). Instálalo con: reel.py entorno --instalar")
        print(f"[aviso] sin PyTorch ({e.__class__.__name__}): uso los tiempos de Whisper, que son aproximados (±0,1–0,3 s). "
              "Para que cada animación entre en su sílaba: reel.py entorno --instalar", file=sys.stderr)
        out, dev = aproximada(items, whisper), "whisper (aproximado)"
    salida.parent.mkdir(parents=True, exist_ok=True)
    json.dump(out, open(salida, "w", encoding="utf-8"), ensure_ascii=False, indent=0)

    frase = -1
    for o in out:
        if o["frase"] != frase:
            frase = o["frase"]
            print(f"--- frase {frase + 1}")
        marca = " ?" if o["score"] < 0.3 and not o.get("aprox") else ""
        print(f"  [{o['i']:3d}] {o['s']:7.2f} {o['e']:7.2f}  {o['score']:.2f}  {o['w']}{marca}")
    print(f"\n{len(out)} palabras -> {salida}  ({dev})")
    print("'?' = puntuación baja: normal en cifras y nombres en inglés; si una palabra normal sale con '?', revisa el guion "
          "(falta o sobra una palabra, o hace falta su pronunciación entre llaves).")

    # comparación con Whisper (solo informativa)
    if whisper and not out[0].get("aprox"):
        A = [plano(re.sub(r"\W", "", o["w"])) for o in out]
        B = [plano(re.sub(r"\W", "", w["word"])) for w in whisper]
        difs = []
        for blk in difflib.SequenceMatcher(None, A, B, autojunk=False).get_matching_blocks():
            for k in range(blk.size):
                difs.append(whisper[blk.b + k]["start"] - out[blk.a + k]["s"])
        if len(difs) >= 5:
            med = statistics.median(difs)
            print(f"Whisper frente a la alineación: mediana {med:+.2f} s ({'adelantado' if med < 0 else 'retrasado'}) "
                  f"en {len(difs)} palabras comunes.")


if __name__ == "__main__":
    main()
