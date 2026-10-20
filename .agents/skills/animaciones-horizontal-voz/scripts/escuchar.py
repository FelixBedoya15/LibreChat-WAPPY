"""Escucha CÓMO se dice (no solo qué): ritmo, pausas, énfasis y energía de la locución.

Uso:
    python escuchar.py trabajo/tiempos.json [--audio assets/audio/voz.mp3] [--salida trabajo/escucha]

Necesita los tiempos por palabra (alinear.py o estimar.py). Con el audio mide además la fuerza de cada palabra.
Escribe:
    <salida>.md    frases con su ritmo y la pausa que dejan, pausas (candidatas a cambio de escena), palabras con
                   énfasis (candidatas a acento visual), energía por frase y lo que sugiere para el montaje
    <salida>.png   mapa de la voz: energía en el tiempo, frases, pausas y énfasis marcados (si hay matplotlib)

Cómo decide el énfasis: una palabra con contenido (no "de", "la", "que"...) se marca si suena ≥ 2,5 dB por encima
de la mediana de su frase, o si se alarga ≥ 1,4 veces lo esperable por sus sílabas sin bajar de volumen. También
cuenta como arranque fuerte la primera palabra tras una pausa larga. Son candidatas: el guion decide.
"""
import argparse
import json
import math
import statistics
import subprocess
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from estimar import silabas   # noqa: E402

SR = 16000
HOP = 0.01
VACIAS = set("""de la el los las un una unos unas y o u a e en que se lo le les me te mi mis tu tus su sus es son
por para con sin del al como más mas muy ya no si sí pero este esta esto estos estas ese esa eso esos esas hay ha he
han hemos habéis era ser estar está están estoy tan también luego entre sobre cuando donde qué cómo nos os vamos va van
voy fue sea porque pues bueno vale aquí ahí allí todo toda todos todas otro otra cada ni sea tiene tengo tienen""".split())


def rms_db(audio):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(audio), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    y = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    hop = int(HOP * SR)
    n = len(y) // hop
    db = 20 * np.log10(np.sqrt((y[: n * hop].reshape(n, hop) ** 2).mean(axis=1)) + 1e-9)
    return db - np.percentile(db, 95)          # 0 dB = voz fuerte típica


def potencia_media(db, s, e):
    a, b = int(s / HOP), max(int(s / HOP) + 1, int(e / HOP))
    seg = db[a:b]
    if not len(seg):
        return None
    return 10 * math.log10(float(np.mean(10 ** (seg / 10))) + 1e-12)


def barra(v, lo=-30, hi=0, ancho=24):
    k = int(round((min(hi, max(lo, v)) - lo) / (hi - lo) * ancho))
    return "█" * k + "·" * (ancho - k)


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("tiempos")
    ap.add_argument("--audio", default="")
    ap.add_argument("--salida", default="trabajo/escucha")
    a = ap.parse_args()

    words = json.load(open(a.tiempos, encoding="utf-8"))
    if not words:
        sys.exit("tiempos.json está vacío")
    estimado = any(w.get("estimado") for w in words)
    db = rms_db(a.audio) if a.audio and Path(a.audio).is_file() else None

    # frases
    frases = {}
    for w in words:
        frases.setdefault(w["frase"], []).append(w)
    F = []
    for nf in sorted(frases):
        ws = frases[nf]
        s, e = ws[0]["s"], ws[-1]["e"]
        sil = sum(silabas(w["w"]) for w in ws)
        ritmo = sil / max(.2, e - s)
        for w in ws:
            w["sil"] = silabas(w["w"])
            w["db"] = potencia_media(db, w["s"], w["e"]) if db is not None else None
        F.append({"n": nf, "s": s, "e": e, "ws": ws, "sil": sil, "ritmo": ritmo,
                  "texto": " ".join(w["w"] for w in ws)})
    for i, f in enumerate(F):
        f["pausa"] = (F[i + 1]["s"] - f["e"]) if i + 1 < len(F) else None
        vals = [w["db"] for w in f["ws"] if w["db"] is not None]
        f["db"] = statistics.median(vals) if vals else None

    # pausas entre palabras (en estimados solo son fiables las de entre frases)
    pausas = []
    for w0, w1 in zip(words, words[1:]):
        gap = w1["s"] - w0["e"]
        if gap >= .25 and (not estimado or w0["frase"] != w1["frase"]):
            pausas.append({"t": w0["e"], "dur": gap, "antes": w0["w"], "despues": w1["w"], "entre_frases": w0["frase"] != w1["frase"]})

    # énfasis: relativo a ESTA voz (las locuciones suelen venir comprimidas y el volumen varía poco)
    enf = []
    largas = {f"{p['despues']}@{p['t'] + p['dur']:.2f}" for p in pausas if p["dur"] >= .45}
    cand = []
    for f in F:
        for w in f["ws"]:
            clave = w["w"].lower().strip("¿?¡!.,;:«»\"'")
            if clave in VACIAS or not (len(clave) >= 3 or any(ch.isdigit() for ch in clave)):
                continue
            siglas = any(ch.isdigit() for ch in clave) or w["w"].isupper() or "-" in w["w"]   # su duración no es fiable
            esperado = w["sil"] / f["ritmo"] if f["ritmo"] else None
            estir = (w["e"] - w["s"]) / esperado if (esperado and not siglas) else 1.0
            a0, b0 = int(w["s"] / HOP), max(int(w["s"] / HOP) + 1, int(w["e"] / HOP))
            pico = float(db[a0:b0].max()) if db is not None and b0 <= len(db) else None
            rel = (w["db"] - f["db"]) if (w["db"] is not None and f["db"] is not None) else None
            cand.append({"w": w, "f": f, "estir": estir, "pico": pico, "rel": rel})

    def z(vals):
        v = [x for x in vals if x is not None]
        if len(v) < 3:
            return [0.0] * len(vals)
        m, sd = statistics.mean(v), statistics.pstdev(v) or 1.0
        return [((x - m) / sd if x is not None else 0.0) for x in vals]

    zp, zr = z([c["pico"] for c in cand]), z([c["rel"] for c in cand])
    for c, a1, b1 in zip(cand, zp, zr):
        c["score"] = .6 * a1 + .4 * b1 + .8 * min(1.0, max(0.0, c["estir"] - 1.15)) * (0 if estimado else 1)
    n_top = min(12, max(3, round(len(cand) * .15))) if (db is not None and not estimado) else 0
    top = set(id(c) for c in sorted(cand, key=lambda c: -c["score"])[:n_top])
    for c in cand:
        w, f = c["w"], c["f"]
        motivo = []
        if id(c) in top:
            partes = []
            if c["pico"] is not None:
                partes.append(f"pico {c['pico']:+.1f} dB")
            if c["rel"] is not None:
                partes.append(f"{c['rel']:+.1f} dB sobre su frase")
            if c["estir"] >= 1.25:
                partes.append(f"alargada ×{c['estir']:.1f}")
            motivo.append("destaca en la voz (" + ", ".join(partes) + ")")
        if f"{w['w']}@{w['s']:.2f}" in largas:
            motivo.append("arranca tras pausa")
        if motivo:
            enf.append({"t": w["s"], "w": w["w"], "i": w.get("i"), "frase": f["n"], "motivo": "; ".join(motivo),
                        "fuerza": c["score"] + (1 if "arranca tras pausa" in motivo else 0)})

    # resumen
    ini, fin = words[0]["s"], words[-1]["e"]
    habla = sum(f["e"] - f["s"] for f in F)
    sil_tot = sum(f["sil"] for f in F)
    ritmo_med = sil_tot / max(.5, habla)
    clase = "pausado" if ritmo_med < 5.2 else "medio" if ritmo_med < 6.6 else "rápido"
    cada = {"pausado": "4–6 s", "medio": "3–5 s", "rápido": "2–3,5 s"}[clase]
    largas_l = sorted([p for p in pausas if p["dur"] >= .45], key=lambda p: -p["dur"])
    top_enf = sorted(enf, key=lambda x: -x["fuerza"])[: max(4, len(F))]

    out = [f"# Cómo suena la voz\n",
           f"Voz de {ini:.2f} a {fin:.2f} s · {len(words)} palabras · {len(F)} frases · ritmo {ritmo_med:.1f} sílabas/s "
           f"(**{clase}**){' · TIEMPOS ESTIMADOS (sin audio): el énfasis no se puede medir' if estimado else ''}"
           f"{'' if db is not None or estimado else ' · sin audio: solo tiempos'}\n",
           "\n## Frases\n", "| # | inicio | fin | ritmo (síl/s) | pausa después | energía | texto |", "|---|---|---|---|---|---|---|"]
    for f in F:
        en = f"{f['db']:+.1f} dB" if f["db"] is not None else "—"
        pa = f"{f['pausa']:.2f} s" if f["pausa"] is not None else "fin"
        tx = f["texto"] if len(f["texto"]) <= 70 else f["texto"][:67] + "…"
        out.append(f"| {f['n'] + 1} | {f['s']:.2f} | {f['e']:.2f} | {f['ritmo']:.1f} | {pa} | {en} | {tx} |")
    out += ["\n## Pausas (≥ 0,25 s): candidatas a cambio de escena o transición\n"]
    out += [f"- {p['t']:.2f} s · {p['dur']:.2f} s · «{p['antes']}» → «{p['despues']}»{' (entre frases)' if p['entre_frases'] else ''}"
            for p in pausas] or ["- ninguna: voz continua (enlaza escenas por transformación, sin huecos)"]
    out += ["\n## Palabras con énfasis: candidatas a acento visual\n"]
    out += [f"- {x['t']:.2f} s · **{x['w']}** (frase {x['frase'] + 1}) · {x['motivo']}" for x in sorted(enf, key=lambda x: x["t"])] or \
           ["- ninguna destacada (o sin audio para medirla)"]
    if db is not None:
        out += ["\n## Energía por frase (0 dB = voz fuerte)\n", "```"]
        out += [f"{f['n'] + 1:>3} {barra(f['db'])} {f['db']:+5.1f} dB  {f['texto'][:48]}" for f in F if f["db"] is not None]
        out += ["```"]
    out += ["\n## Qué sugiere para el montaje\n",
            f"- Ritmo {clase}: un cambio visual cada {cada} de media (ajústalo a la densidad del contenido).",
            "- Cambios de escena grandes en las pausas más largas: " +
            (", ".join(f"{p['t'] + p['dur']:.2f} s (antes de «{p['despues']}»)" for p in largas_l[:5]) if largas_l else "no hay pausas largas; transforma sin cortar."),
            "- Acentos (golpe, anillo, destello, golpe de cámara) en las palabras con más énfasis: " +
            (", ".join(f"«{x['w']}» {x['t']:.2f} s" for x in sorted(top_enf, key=lambda x: x["t"])) if top_enf else "elígelos por significado."),
            "- Frases rápidas: entradas cortas (0,3–0,4 s) y pocas piezas; frases lentas: construye con más detalle.",
            "- Frases con más energía que la media: el clímax visual; las más bajas: tono confesional o de transición."]
    Path(a.salida).parent.mkdir(parents=True, exist_ok=True)
    Path(a.salida + ".md").write_text("\n".join(out) + "\n", encoding="utf-8")
    print("\n".join(out))

    # mapa de la voz (png)
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except Exception:
        print("\n(sin matplotlib: no hago el mapa de la voz en PNG)")
        return
    dur_total = fin + .6
    fila = 15.0
    nfil = max(1, math.ceil(dur_total / fila))
    fig, axs = plt.subplots(nfil, 1, figsize=(22, 3.1 * nfil), squeeze=False, facecolor="#0a0c10")
    enf_t = {round(x["t"], 2) for x in enf}
    for r in range(nfil):
        ax = axs[r][0]
        t0, t1 = r * fila, min(dur_total, (r + 1) * fila)
        ax.set_facecolor("#0a0c10")
        ax.set_xlim(t0, t0 + fila)
        ax.set_ylim(-42, 14)
        for f in F:
            if f["e"] >= t0 and f["s"] <= t1:
                ax.axvspan(f["s"], f["e"], color="#1c2233" if f["n"] % 2 == 0 else "#22283a", lw=0)
        for p in pausas:
            if t0 <= p["t"] <= t1:
                ax.axvspan(p["t"], p["t"] + p["dur"], color="#3e6ef2", alpha=.35 if p["dur"] >= .45 else .18, lw=0)
        if db is not None:
            tt = np.arange(len(db)) * HOP
            m = (tt >= t0) & (tt <= t0 + fila)
            ax.fill_between(tt[m], -42, np.maximum(db[m], -42), color="#8d97ab", alpha=.55, lw=0)
        for w in words:
            if t0 <= w["s"] <= t1:
                es = round(w["s"], 2) in enf_t
                ax.text(w["s"], 4 if es else 1, w["w"], rotation=58, fontsize=10 if es else 8, ha="left", va="bottom",
                        color="#E8906F" if es else "#d5dae4", fontweight="bold" if es else "normal")
                ax.plot([w["s"], w["s"]], [-42, 0], color="#E8906F" if es else "#3a4152", lw=1.3 if es else .5)
        ax.tick_params(colors="#8d97ab", labelsize=9)
        for sp in ax.spines.values():
            sp.set_color("#2a2f3a")
        ax.set_yticks([])
        ax.set_xticks(np.arange(math.floor(t0), math.ceil(t0 + fila) + 1, 1))
    axs[0][0].set_title("Mapa de la voz · energía (gris), frases (bandas), pausas (azul), énfasis (coral)", color="#eef1f7", fontsize=12, loc="left")
    fig.tight_layout()
    fig.savefig(a.salida + ".png", dpi=80, facecolor="#0a0c10")
    print(f"\nMapa de la voz: {a.salida}.png")


if __name__ == "__main__":
    main()
