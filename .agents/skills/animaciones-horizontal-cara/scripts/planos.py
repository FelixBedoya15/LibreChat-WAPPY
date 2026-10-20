"""Ayuda a repartir una intro a cámara en planos de cara y de animación (edicion/montaje.json) y a revisarlos.

Uso (desde la carpeta del proyecto):
    python planos.py                     palabras de la voz cortada con su fotograma, saltos de la toma y
                                         revisión de edicion/montaje.json (duraciones, cortes dentro de palabras…)
    python planos.py --hoja out/x.mp4    hoja con el último fotograma antes y el primero después de cada cambio de
                                         plano -> trabajo/revision/cortes.png

Un corte cara -> animación se pone justo antes de la palabra que dispara la animación: fotograma
floor((inicio - 0,03) * fps), siempre en el hueco entre dos palabras; o en un salto de la toma (ya es silencio).
"""
import argparse
import json
import math
import subprocess
import sys
from pathlib import Path

FUENTE_TTF = "C:/Windows/Fonts/arial.ttf"


def tabla_palabras(palabras, fps, saltos):
    print(f"Palabras de la voz cortada: fotograma de inicio a {fps:g} fps (corte antes de la palabra = f - {math.ceil(.03 * fps)})")
    frase, linea, js = -1, [], sorted(saltos)
    for w in palabras:
        f = int(math.floor(w["s"] * fps))
        while js and js[0] <= f:
            if linea:
                print("   " + " · ".join(linea)); linea = []
            print(f"   ‖ salto de la toma en f{js.pop(0)}")
        if w["frase"] != frase and linea:
            print("   " + " · ".join(linea)); linea = []
        frase = w["frase"]
        linea.append(f"f{f} {w['w']}")
    if linea:
        print("   " + " · ".join(linea))


def revisar_montaje(m, palabras, fps, total, saltos):
    planos = m.get("planos", [])
    print("\nedicion/montaje.json")
    avisos = []
    if not planos:
        print("   (sin planos)")
        return
    if planos[0]["f0"] != 0:
        avisos.append(f"el primer plano empieza en f{planos[0]['f0']} (tiene que ser f0)")
    if planos[-1]["f1"] != total:
        avisos.append(f"el último plano acaba en f{planos[-1]['f1']} y el montaje tiene {total} fotogramas")
    for q, p in zip(planos, planos[1:]):
        if p["f0"] != q["f1"]:
            avisos.append(f"hueco o solape entre f{q['f1']} y f{p['f0']}")
    ids = [p.get("id") for p in planos if p["tipo"] == "anim"]
    if len(ids) != len(set(ids)) or None in ids:
        avisos.append("cada plano 'anim' necesita un id único")
    t_anim = 0
    for k, p in enumerate(planos):
        d = (p["f1"] - p["f0"]) / fps
        dentro = [w["w"] for w in palabras if p["f0"] <= w["s"] * fps < p["f1"]]
        voz = " ".join(dentro)
        voz = voz if len(voz) < 70 else voz[:67] + "…"
        extra = ""
        if p["tipo"] == "cara":
            n = sum(1 for j in saltos if p["f0"] < j < p["f1"]) + 1
            extra = f" · {n} tramo{'s' if n > 1 else ''} · zooms {p.get('zooms', [1.0])}"
            if d < 1.2:
                avisos.append(f"plano {k} (cara) dura {d:.2f} s: menos de 1,2 s se nota como un parpadeo")
        else:
            t_anim += d
            if d < 1.5:
                avisos.append(f"plano {k} ('{p.get('id')}') dura {d:.2f} s: poco para leer una animación nueva")
        print(f"   [{k}] {p['tipo']:<4} f{p['f0']:>5}-{p['f1']:<5} {d:5.2f} s  {p.get('id', ''):<12}{extra}\n        «{voz}»")
        if k:
            c = p["f0"]
            for w in palabras:
                if w["s"] * fps + 1 < c < w["e"] * fps - 1:
                    avisos.append(f"el corte en f{c} (plano {k}) cae dentro de «{w['w']}» (f{w['s'] * fps:.0f}-{w['e'] * fps:.0f})")
    print(f"   {len(planos)} planos · animación {t_anim:.1f} s de {total / fps:.1f} s ({100 * t_anim * fps / total:.0f} %) · "
          f"media {total / fps / len(planos):.1f} s por plano")
    for a in avisos:
        print("   AVISO: " + a)
    if not avisos:
        print("   Sin avisos.")


def hoja(video, m, fps, salida):
    from PIL import Image, ImageDraw, ImageFont
    cortes = [p["f0"] for p in m["planos"][1:]]
    tmp = Path("trabajo/revision/_cortes"); tmp.mkdir(parents=True, exist_ok=True)
    celdas = []
    for c in cortes:
        for f in (c - 1, c):
            png = tmp / f"f{f}.png"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{(f - .4) / fps:.6f}", "-i", str(video), "-frames:v", "1",
                            "-vf", "scale=480:-2", str(png)], check=True)
            celdas.append((f, png))
    try:
        fuente = ImageFont.truetype(FUENTE_TTF, 20)
    except OSError:
        fuente = ImageFont.load_default()
    w, h = Image.open(celdas[0][1]).size
    cols = 4
    filas = math.ceil(len(celdas) / cols)
    lienzo = Image.new("RGB", (cols * (w + 6) + 6, filas * (h + 6) + 6), (20, 20, 20))
    for i, (f, png) in enumerate(celdas):
        im = Image.open(png).convert("RGB")
        d = ImageDraw.Draw(im)
        txt = f"f{f}  {f / fps:.2f} s" + ("  (antes)" if i % 2 == 0 else "  (después)")
        d.rectangle([0, 0, 250, 28], fill=(0, 0, 0))
        d.text((6, 3), txt, fill=(255, 255, 255), font=fuente)
        lienzo.paste(im, (6 + (i % cols) * (w + 6), 6 + (i // cols) * (h + 6)))
    Path(salida).parent.mkdir(parents=True, exist_ok=True)
    lienzo.save(salida)
    for p in tmp.glob("*.png"):
        p.unlink()
    tmp.rmdir()
    print(f"hoja de cortes -> {salida} ({len(cortes)} cambios de plano; cada par: antes | después)")


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--hoja", default="")
    a = ap.parse_args()
    cortes = json.load(open("edicion/cortes.json", encoding="utf-8"))
    fps, total = cortes["fps"], cortes["fotogramas"]
    saltos = [t["edit_f0"] for t in cortes["tramos"][1:]]
    m = json.load(open("edicion/montaje.json", encoding="utf-8")) if Path("edicion/montaje.json").exists() else {"planos": []}
    if a.hoja:
        return hoja(a.hoja, m, fps, "trabajo/revision/cortes.png")
    tp = Path("trabajo/tiempos.json")
    if not tp.exists():
        sys.exit("Falta trabajo/tiempos.json: 'anim.py alinear' sobre la voz cortada")
    palabras = json.load(open(tp, encoding="utf-8"))
    tabla_palabras(palabras, fps, saltos)
    revisar_montaje(m, palabras, fps, total, saltos)


if __name__ == "__main__":
    main()
