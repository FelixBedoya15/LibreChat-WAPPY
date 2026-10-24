"""Lectura del vídeo: lo que hace distinto a ESTE vídeo, para diseñar su dirección de arte (references/direccion.md).

Uso (desde la carpeta del proyecto, después de transcribir; mejor aún después de alinear):
    python anim.py lectura

Mide la voz (ritmo, pausas, energía, palabras que remarca), lee el guion (cifras, nombres, estructura, tono), saca los
colores de su plano si hay grabación y cruza todo con el historial de vídeos anteriores (qué no repetir). Escribe
trabajo/lectura.md y lo imprime. No decide nada: da pistas para el concepto (trabajo/concepto.md).
"""
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import historial  # noqa: E402

SR = 16000
NUM = {"dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "quince",
       "veinte", "treinta", "cuarenta", "cincuenta", "cien", "ciento", "mil", "millón", "millones", "doble", "triple", "mitad",
       "euros", "dólares", "porcentaje", "%"}
ESTRUCTURA = [("enumera / lista", r"\b(primero|segundo|tercero|lo primero|por un lado|además|por último|varios|casos de uso|pasos?|paso a paso)\b"),
              ("contraste / problema", r"\b(pero|el problema|sin embargo|en cambio|aunque|no se trata|lo malo)\b"),
              ("comparación", r"\b(frente a|contra|vs|versus|compar\w*|mejor que|peor que|igual que)\b"),
              ("dinero / datos", r"(\d|%|\b(precio|cuesta|gratis|euros|dólares|coste|millones|récord|benchmark)\b)"),
              ("promesa / llamada", r"\b(te voy a|vamos a|te regalo|te regalaré|suscríbete|comenta|enlace|descarga)\b"),
              ("pregunta", r"\?|¿"),
              ("revelado / novedad", r"\b(acaba de|nuevo|nueva|lanza\w*|presenta\w*|por fin|anuncia\w*)\b")]
# temas → pistas de dirección (no son reglas: el concepto lo decides tú)
PISTAS = [(r"\b(agente\w*|automatiz\w*|n8n|make|zapier|integra\w*|conect\w*|flujo\w*|api|mcp|red|equipo)\b", "constelacion", "nodos y conexiones: agentes, automatizaciones, integraciones"),
          (r"\b(precio\w*|dato\w*|benchmark\w*|porcentaje|%|gráfic\w*|mercado|crec\w*|cifra\w*|estadística\w*|sonido\w*|audio|voz)\b", "malla", "relieve y ondas: datos, cifras, señal, sonido"),
          (r"\b(lanza\w*|nuevo|nueva|diseñ\w*|imagen\w*|vídeo\w*|creativ\w*|arte|producto|app)\b", "aurora", "cintas de color: producto nuevo, creatividad"),
          (r"\b(código|programa\w*|terminal|claude code|codex|cursor|desarroll\w*|técnic\w*|servidor)\b", "cortina", "hebras de luz (prueba diagonal u horizontal): técnico, código"),
          (r"\b(opini\w*|reflexi\w*|consejo\w*|historia|personal|aprend\w*|error\w*|verdad)\b", "liso", "liso con tipografía editorial: reflexión, opinión, historia personal")]


def sin_tildes(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def silabas(p):
    return max(1, len(re.findall(r"[aeiouáéíóúü]+", p.lower())))


def cargar_palabras():
    for f, kind in (("trabajo/tiempos.json", "alineado"), ("edicion/tiempos.json", "alineado (toma)"),
                    ("trabajo/transcripcion.json", "whisper"), ("edicion/transcripcion.json", "whisper (toma)")):
        p = Path(f)
        if not p.is_file():
            continue
        d = json.load(open(p, encoding="utf-8"))
        ws = d.get("palabras", d) if isinstance(d, dict) else d
        out = [{"w": str(w.get("w") or w.get("word") or "").replace("{", " ").split(" ")[0], "s": float(w["s"]), "e": float(w["e"])} for w in ws if (w.get("w") or w.get("word"))]
        if out:
            return out, f, kind
    sys.exit("No hay palabras: ejecuta antes 'anim.py transcribir' (y mejor 'anim.py alinear').")


def cargar_audio(fuente_palabras):
    cand = ["edicion/toma.wav"] if "edicion" in fuente_palabras else []
    cand += ["assets/audio/voz.wav", "assets/audio/voz.mp3", "assets/audio/voz.m4a", "edicion/toma.wav"]
    for f in cand:
        if Path(f).is_file():
            raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
            a = np.frombuffer(raw, np.float32)
            if len(a):
                return a, f
    return None, None


def colores_plano():
    f = Path("edicion/fuente.json")
    if not f.is_file():
        return []
    info = json.load(open(f, encoding="utf-8"))
    video = Path("edicion/cara_proxy.mp4") if Path("edicion/cara_proxy.mp4").is_file() else Path(info["video"])
    dur = info.get("duracion", 10)
    px = []
    for k in (.25, .5, .75):
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{dur * k if video.name != 'cara_proxy.mp4' else 1 + k:.2f}", "-i", str(video), "-frames:v", "1",
                              "-vf", "scale=96:54", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
        if raw:
            px.append(np.frombuffer(raw, np.uint8).reshape(-1, 3).astype(float))
    if not px:
        return []
    X = np.concatenate(px)
    rng = np.random.default_rng(7)
    C = X[rng.choice(len(X), 5, replace=False)]
    for _ in range(12):                                   # k-medias sencillo
        lab = np.argmin(((X[:, None] - C[None]) ** 2).sum(2), 1)
        C = np.array([X[lab == i].mean(0) if np.any(lab == i) else C[i] for i in range(5)])
    peso = np.bincount(lab, minlength=5) / len(X)
    orden = np.argsort(-peso)
    return [("#%02x%02x%02x" % tuple(int(v) for v in C[i]), round(float(peso[i]) * 100)) for i in orden]


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ws, fuente, kind = cargar_palabras()
    guion_f = next((f for f in ("trabajo/guion.txt", "edicion/guion.txt") if Path(f).is_file()), None)
    lineas = [l.strip() for l in open(guion_f, encoding="utf-8")] if guion_f else []
    lineas = [l for l in lineas if l and not l.startswith("~")]
    texto = " ".join(lineas) if lineas else " ".join(w["w"] for w in ws)
    texto_l = texto.lower()
    t0, t1 = ws[0]["s"], ws[-1]["e"]
    dur = max(.1, t1 - t0)
    n = len(ws)
    wpm = n / dur * 60
    sps = sum(silabas(w["w"]) for w in ws) / dur
    gaps = [(ws[i + 1]["s"] - ws[i]["e"], ws[i]["e"]) for i in range(n - 1)]
    pausas = [g for g in gaps if g[0] > .35]
    out = []
    P = out.append
    P(f"# Lectura del vídeo ({Path.cwd().name})\n")
    P(f"Palabras de {fuente} ({kind}).\n")
    P("## Voz")
    P(f"- Duración hablada: {dur:.1f} s · {n} palabras · **{wpm:.0f} palabras/min** · {sps:.1f} sílabas/s")
    P(f"- Pausas de más de 0,35 s: {len(pausas)}" + (f" (la más larga, {max(pausas)[0]:.1f} s en {max(pausas)[1]:.1f} s)" if pausas else ""))
    audio, audio_f = cargar_audio(fuente)
    enf = []
    if audio is not None:
        db = []
        for w in ws:
            seg = audio[int(w["s"] * SR):max(int(w["s"] * SR) + 1, int(w["e"] * SR))]
            db.append(20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9) if len(seg) else -90)
        db = np.array(db)
        vivo = db[db > -60]
        rango = float(np.percentile(vivo, 90) - np.percentile(vivo, 10)) if len(vivo) > 5 else 0
        P(f"- Dinámica de la voz (p90 − p10 por palabra): **{rango:.1f} dB** ({'muy expresiva' if rango > 9 else 'expresiva' if rango > 5.5 else 'constante'}) · audio: {audio_f}")
        # énfasis: más energía que las palabras de alrededor y/o sílabas más largas de lo normal en esa frase
        spsil = np.array([(w["e"] - w["s"]) / silabas(w["w"]) for w in ws])
        dev_e = np.array([db[i] - np.median(db[max(0, i - 6):i + 7]) for i in range(n)])
        dev_d = np.array([spsil[i] / (np.median(spsil[max(0, i - 6):i + 7]) + 1e-6) for i in range(n)])
        z = lambda v: (v - v.mean()) / (v.std() + 1e-9)
        punt = z(dev_e) + .7 * z(np.log(dev_d + 1e-6))
        for i in np.argsort(-punt):
            w = ws[i]
            if len(re.sub(r"\W", "", w["w"])) >= 4 and punt[i] > .8 and len(enf) < 10:
                enf.append((punt[i], w))
        if enf:
            P("- Palabras que remarca (más energía que las de alrededor): " + ", ".join(f"«{w['w']}» {w['s']:.2f}" for _, w in sorted(enf[:10], key=lambda x: x[1]["s"])))
    ritmo = "rápido" if wpm > 175 else "pausado" if wpm < 135 else "medio"
    sug = ('espectáculo (golpes cada 1,5–3 s)' + (' — intro corta' if dur < 45 and ritmo != 'rápido' else '')) if ritmo == 'rápido' or dur < 45 else         'media (cada 3–5 s)' if ritmo == 'medio' else 'media o sobria (cada 4–8 s), movimientos más lentos'
    P(f"- Ritmo: **{ritmo}**. Sugerencia de densidad: {sug}.")

    P("\n## Guion")
    cifras = sorted({w for w in re.findall(r"[\w%.,$€]+", texto) if re.search(r"\d", w) or sin_tildes(w.lower()) in {sin_tildes(x) for x in NUM}})
    P("- Cifras y cantidades: " + (", ".join(cifras) if cifras else "ninguna (anima conceptos, no números)"))
    nombres = []
    for l in lineas or [texto]:
        toks = re.findall(r"[\wÁÉÍÓÚÑáéíóúñ][\w.\-]*", l)
        for j, tk in enumerate(toks):
            if j > 0 and tk[0].isupper() and tk not in nombres:
                nombres.append(tk)
    P("- Nombres propios (posibles protagonistas y logos): " + (", ".join(nombres) if nombres else "ninguno"))
    P("- Estructura que se oye:")
    for nombre, pat in ESTRUCTURA:
        hits = [l for l in lineas if re.search(pat, l.lower())]
        if hits:
            P(f"  - {nombre}: {len(hits)} frase(s) · p. ej. «{hits[0][:90]}»")
    P(f"- Frases: {len(lineas)} · la más larga: {max((len(l.split()) for l in lineas), default=0)} palabras")

    P("\n## Pistas para la dirección de arte (el concepto lo decides tú)")
    for pat, fondo, por in PISTAS:
        k = len(re.findall(pat, sin_tildes(texto_l)))
        if k:
            P(f"- {k} menciones → fondo «{fondo}»: {por}")
    col = colores_plano()
    if col:
        P("- Colores de su plano (para que la paleta case o contraste con la sala): " + ", ".join(f"{c} {p} %" for c, p in col))

    P("\n## No repetir (historial de vídeos anteriores)")
    ult = historial.cargar()[-3:]
    if not ult:
        P("- Sin historial todavía.")
    for h in reversed(ult):
        P(f"- {h.get('fecha', '?')} · {h.get('titulo', '?')}: " + historial.resumen(h))
    P("\nRegla: cambia al menos 3 de {fondo, acabado, tipo, acento, música, transición principal} respecto al último vídeo,"
      " no reutilices más de la mitad de sus piezas e inventa al menos una pieza firma para este vídeo.")
    txt = "\n".join(out) + "\n"
    Path("trabajo").mkdir(exist_ok=True)
    Path("trabajo/lectura.md").write_text(txt, encoding="utf-8")
    print(txt)
    print("-> trabajo/lectura.md · siguiente: rellena trabajo/concepto.md (references/direccion.md)")


if __name__ == "__main__":
    main()
