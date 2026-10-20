"""Entrada única de la skill animaciones-horizontal-cara: una grabación a cámara sin pausas, alternando planos de
la cara con animaciones a pantalla completa (HTML -> MP4), con la voz continua de principio a fin.

Uso (desde la carpeta del proyecto, salvo entorno y nuevo), en el orden del flujo:
    python anim.py entorno [--instalar]              comprueba (e instala) ffmpeg, Node, Chromium, Whisper, torchaudio, OpenCV
    python anim.py nuevo <carpeta> --video toma.mp4  crea el proyecto desde la plantilla con la grabación
    python anim.py transcribir [--nombres "A, B"]    texto de la grabación con Whisper -> edicion/guion.txt (corrígelo)
    python anim.py alinear --toma                    tiempos exactos por palabra en la grabación -> edicion/tiempos.json
    python anim.py cortar [--fin 76.95]              quita las pausas -> voz cortada, cortes, proxy, encuadre de la cara
    python anim.py alinear                           tiempos exactos por palabra en la voz cortada -> trabajo/tiempos.json
    python anim.py planos [--hoja out/x.mp4]         palabras con su fotograma + revisión de edicion/montaje.json
    python anim.py montar [--res 1080]               monta cara + animaciones -> out/<proyecto>_<alto>p<fps>.mp4
Herramientas:
    python anim.py envolvente <palabra|índice> ...   energía de la voz alrededor de esas palabras (comprobar)
    python anim.py logos "Claude" "OpenAI" ...       logos listos para fondo oscuro -> assets/logos
    python anim.py recursos [muse metalockup]        logos ya preparados de la skill (recursos/logos) -> assets/logos
    python anim.py ver-logos                         hoja con los logos sobre el fondo -> trabajo/revision/logos.png
    python anim.py logo-trazo icono.png              logo de un trazo para escribirlo a mano -> assets/logos/*_trazo.json
    python anim.py mapa --marcar USA,ESP             mapa del mundo en puntos -> assets/mapa_puntos.json
    python anim.py iconos gamepad-2 sunrise ...      añade iconos de Lucide (lucide.dev) al mapa ICON del index.html
    python anim.py revisar t1 t2 ... [--hoja nombre] fotogramas + hoja de contactos -> trabajo/revision/
    python anim.py render [--from=a --to=b] [--out=...]   render suelto de la animación (montar ya lo hace por planos)
    python anim.py comprobar [archivo.mp4] [--palabras]   pistas, arranque, hoja del MP4 y (--palabras) un
                                                     fotograma del MP4 en cada tiempo de T
"""
import urllib.request
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
SCRIPTS = SKILL / "scripts"
PLANTILLA = SKILL / "plantilla"
RECURSOS = SKILL / "recursos"
PY = sys.executable
WIN = os.name == "nt"


def utf8():
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass


def run(cmd, **kw):
    """Lanza un comando mostrando su salida; devuelve el código de salida."""
    return subprocess.call(cmd, shell=WIN and cmd[0] in ("npm", "npx"), **kw)


def es_proyecto(p=Path.cwd()):
    return (p / "index.html").is_file() and (p / "render.mjs").is_file()


def exigir_proyecto():
    if not es_proyecto():
        sys.exit("Ejecuta este comando desde la carpeta del proyecto (la que tiene index.html y render.mjs).\n"
                 "Para crear uno: python anim.py nuevo <carpeta> --video <grabación.mp4>")


def sonda_video(video):
    """Tamaño, fps (exactos) y fotogramas de una grabación."""
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,r_frame_rate,nb_frames:format=duration", "-of", "json", str(video)],
                         capture_output=True, text=True).stdout
    d = json.loads(out)
    st, dur = d["streams"][0], float(d["format"]["duration"])
    num, den = (int(v) for v in st["r_frame_rate"].split("/"))
    fps = num / den
    n = int(st.get("nb_frames") or 0) or int(round(dur * fps))
    return {"ancho": st["width"], "alto": st["height"], "fps": fps, "fps_txt": st["r_frame_rate"] if den != 1 else str(num),
            "fotogramas": n, "duracion": round(dur, 3)}


def cmd_nuevo(a):
    dest = Path(a.carpeta).resolve()
    ruta = a.video or a.grabacion
    if not ruta:
        sys.exit("Esta skill monta grabaciones a cámara: anim.py nuevo <carpeta> --video <grabación.mp4>\n"
                 "(para una voz en off sin grabación está la skill animaciones-horizontal-voz)")
    video = Path(ruta).resolve()
    if not video.is_file():
        sys.exit(f"No encuentro el vídeo {video}")
    try:
        info = sonda_video(video)
    except (IndexError, KeyError, ValueError):
        sys.exit(f"{video.name} no tiene pista de vídeo: hace falta la grabación a cámara (mp4, mov...)")
    if dest.exists() and any(dest.iterdir()) and not a.forzar:
        sys.exit(f"{dest} ya existe y no está vacía (usa --forzar para rellenar lo que falte sin borrar nada)")
    dest.mkdir(parents=True, exist_ok=True)
    for src in PLANTILLA.rglob("*"):
        rel = src.relative_to(PLANTILLA)
        if "node_modules" in rel.parts:
            continue
        dst = dest / rel
        if src.is_dir():
            dst.mkdir(parents=True, exist_ok=True)
        elif not dst.exists():
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
    for d in ("trabajo", "out", "assets/logos", "assets/audio", "edicion"):
        (dest / d).mkdir(parents=True, exist_ok=True)
    json.dump({"video": str(video), **info}, open(dest / "edicion" / "fuente.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le",
                    str(dest / "edicion" / "toma.wav")], check=True)
    print(f"Toma: {info['ancho']}x{info['alto']} · {info['fps']:.3f} fps · {info['duracion']} s -> edicion/fuente.json y edicion/toma.wav")
    dur, ruta_audio = info["duracion"], "assets/audio/voz.wav"     # cortar.py pone la voz cortada y su duración
    idx = dest / "index.html"
    html = idx.read_text(encoding="utf-8")
    html = re.sub(r"(const CONFIG = \{ dur: )[\d.]+(, audio: ')[^']*(')",
                  lambda m: f"{m.group(1)}{dur}{m.group(2)}{ruta_audio}{m.group(3)}", html, count=1)
    html = html.replace("montaje: false", "montaje: true", 1)   # la plantilla lee edicion/montaje.json
    idx.write_text(html, encoding="utf-8")
    print(f"Proyecto creado en {dest}\n  la voz saldrá de la toma sin pausas (anim.py cortar)")
    if not (dest / "node_modules" / "playwright-core").is_dir():
        print("Instalando playwright-core (npm)...")
        if run(["npm", "install", "--no-audit", "--no-fund", "--silent"], cwd=dest) != 0:
            print("AVISO: npm install falló; ejecútalo a mano en la carpeta del proyecto.")
    print("\nSiguiente (desde la carpeta del proyecto): anim.py transcribir --nombres \"...\", corrige "
          "edicion/guion.txt, anim.py alinear --toma y anim.py cortar (references/montaje.md)")


def cmd_transcribir(a):
    """La grabación original (edicion/toma.wav) -> edicion/guion.txt. La voz cortada no se transcribe: dice lo mismo
    (cortar deja trabajo/guion.txt sin las tomas descartadas)."""
    exigir_proyecto()
    audio = "edicion/toma.wav"
    if not Path(audio).is_file():
        sys.exit("No hay edicion/toma.wav: crea el proyecto con 'anim.py nuevo <carpeta> --video <grabación>'")
    args = [PY, str(SCRIPTS / "transcribir.py"), audio, "--salida", "edicion"]
    if a.nombres:
        args += ["--nombres", a.nombres]
    if a.modelo:
        args += ["--modelo", a.modelo]
    if a.cpu:
        args.append("--cpu")
    sys.exit(run(args))


def cmd_alinear(a):
    exigir_proyecto()
    if a.toma:
        sys.exit(run([PY, str(SCRIPTS / "alinear.py"), "edicion/toma.wav", "edicion/guion.txt", "--salida", "edicion/tiempos.json"]))
    audio = a.audio or next((str(p) for p in sorted(Path("assets/audio").glob("voz.*"))), None)
    if not audio:
        sys.exit("Aún no hay voz cortada (assets/audio/voz.wav): antes, 'anim.py alinear --toma' y 'anim.py cortar'")
    sys.exit(run([PY, str(SCRIPTS / "alinear.py"), audio, a.guion, "--salida", a.salida]))


def cmd_script(nombre, extra):
    """Subcomandos que pasan sus argumentos tal cual a un script de la skill (cortar, planos, montar, mapa, logo-trazo)."""
    exigir_proyecto()
    sys.exit(run([PY, str(SCRIPTS / nombre), *extra]))


def cmd_iconos(a):
    """Descarga iconos de Lucide y los añade al mapa ICON del index.html (clave en camelCase: gamepad-2 -> gamepad2)."""
    exigir_proyecto()
    idx = Path("index.html")
    html = idx.read_text(encoding="utf-8")
    m = re.search(r"const ICON = \{\n", html)
    if not m:
        sys.exit("No encuentro 'const ICON = {' en index.html")
    nuevos = []
    for nombre in a.nombres:
        nombre = nombre.strip().lower()
        clave = re.sub(r"-(\w)", lambda g: g.group(1).upper(), nombre)
        if re.search(rf"^\s+{re.escape(clave)}: '", html, flags=re.M):
            print(f"{nombre}: ya estaba ({clave})")
            continue
        url = f"https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/{nombre}.svg"
        try:
            svg = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=15).read().decode("utf-8")
        except Exception as e:
            print(f"{nombre}: NO ENCONTRADO ({e}). Busca el nombre exacto en https://lucide.dev/icons")
            continue
        inner = re.sub(r"<!--.*?-->", "", svg, flags=re.S)
        inner = re.sub(r"^.*?<svg[^>]*>", "", inner, flags=re.S)
        inner = re.sub(r"</svg>.*$", "", inner, flags=re.S)
        inner = re.sub(r"\s+", " ", inner).replace(" />", "/>").replace("> <", "><").strip().replace("'", "\\'")
        nuevos.append(f"  {clave}: '{inner}',\n")
        print(f"{nombre}: añadido como icon('{clave}', tamaño)")
    if nuevos:
        html = html[:m.end()] + "".join(nuevos) + html[m.end():]
        idx.write_text(html, encoding="utf-8")


def cmd_ver_logos(a):
    exigir_proyecto()
    if not Path("tools/logos.mjs").is_file():
        shutil.copy2(PLANTILLA / "tools" / "logos.mjs", "tools/logos.mjs")   # proyectos creados con una plantilla anterior
    sys.exit(run(["node", "tools/logos.mjs"]))


def cmd_recursos(a):
    """Logos que costó preparar a mano (el icono de Muse vectorizado, el logotipo completo de Meta): se copian de
    <skill>/recursos/logos a assets/logos y se apuntan en assets/logos/logos.json. Sin argumentos, los lista."""
    exigir_proyecto()
    src = RECURSOS / "logos"
    disp = json.load(open(src / "logos.json", encoding="utf-8"))
    if not a.slugs:
        for k, v in disp.items():
            print(f"{k:<12} {v['name']} · {v['source']}")
        return
    dst = Path("assets/logos")
    dst.mkdir(parents=True, exist_ok=True)
    regf = dst / "logos.json"
    reg = json.load(open(regf, encoding="utf-8")) if regf.is_file() else {}
    for slug in a.slugs:
        if slug not in disp:
            print(f"{slug}: no está en recursos/logos (hay: {', '.join(disp)})")
            continue
        e = disp[slug]
        shutil.copy2(src / Path(e["file"]).name, dst / Path(e["file"]).name)
        reg[slug] = e
        print(f"{slug}: {e['file']} -> logo('{slug}', tamaño)")
    regf.write_text(json.dumps(reg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def cmd_envolvente(a):
    exigir_proyecto()
    audio = next((str(p) for p in sorted(Path("assets/audio").glob("voz.*"))), None)
    sys.exit(run([PY, str(SCRIPTS / "envolvente.py"), audio, "trabajo/tiempos.json", *a.palabras]))


def cmd_logos(a, extra):
    exigir_proyecto()
    sys.exit(run([PY, str(SCRIPTS / "logos.py"), *extra, "--out", "assets/logos"]))


def cmd_revisar(a):
    exigir_proyecto()
    rev = Path("trabajo/revision")
    rev.mkdir(parents=True, exist_ok=True)
    hoja = a.hoja
    if not hoja:
        n = 1
        while (rev / f"hoja_{n}.png").exists():
            n += 1
        hoja = f"hoja_{n}"
    sys.exit(run(["node", "tools/stills.mjs", str(rev), f"--sheet={hoja}", *a.tiempos]))


def cmd_render(a, extra):
    exigir_proyecto()
    sys.exit(run(["node", "render.mjs", *extra]))


def cmd_comprobar(a):
    exigir_proyecto()
    actual = Path("tools/comprobar.mjs")
    if a.palabras and (not actual.is_file() or "PALABRAS" not in actual.read_text(encoding="utf-8")):
        shutil.copy2(PLANTILLA / "tools" / "comprobar.mjs", actual)   # proyecto con una plantilla anterior
        print("(tools/comprobar.mjs actualizado; si la hoja por palabras sale vacía, añade 'window.__T = T;' en index.html)")
    sys.exit(run(["node", "tools/comprobar.mjs", *([a.archivo] if a.archivo else []), *(["--palabras"] if a.palabras else [])]))


def cmd_entorno(a):
    args = [PY, str(SCRIPTS / "entorno.py")]
    if a.instalar:
        args.append("--instalar")
    sys.exit(run(args))


def main():
    utf8()
    p = argparse.ArgumentParser(description="Grabación a cámara sin pausas, alternando la cara con animaciones (HTML -> MP4).")
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("entorno"); s.add_argument("--instalar", action="store_true")
    s = sub.add_parser("nuevo"); s.add_argument("carpeta"); s.add_argument("grabacion", nargs="?", default="")
    s.add_argument("--video", default="", help="la grabación a cámara (mp4): se quitan las pausas y se alternan cara y animación")
    s.add_argument("--forzar", action="store_true")
    s = sub.add_parser("transcribir"); s.add_argument("--nombres", default=""); s.add_argument("--modelo", default="")
    s.add_argument("--cpu", action="store_true")
    s.add_argument("--toma", action="store_true", help="(por defecto: siempre se transcribe la grabación original)")
    s = sub.add_parser("alinear"); s.add_argument("--guion", default="trabajo/guion.txt"); s.add_argument("--audio", default="")
    s.add_argument("--toma", action="store_true", help="edicion/guion.txt sobre la grabación original -> edicion/tiempos.json")
    s.add_argument("--salida", default="trabajo/tiempos.json", help="otro archivo para probar pronunciaciones sin pisar tiempos.json")
    s = sub.add_parser("envolvente"); s.add_argument("palabras", nargs="+")
    sub.add_parser("logos", add_help=False)
    s = sub.add_parser("recursos"); s.add_argument("slugs", nargs="*")
    sub.add_parser("ver-logos")
    s = sub.add_parser("iconos"); s.add_argument("nombres", nargs="+")
    s = sub.add_parser("revisar"); s.add_argument("tiempos", nargs="+"); s.add_argument("--hoja", default="")
    sub.add_parser("render", add_help=False)
    for nombre in ("cortar", "planos", "montar", "mapa", "logo-trazo"):
        sub.add_parser(nombre, add_help=False)
    s = sub.add_parser("comprobar"); s.add_argument("archivo", nargs="?"); s.add_argument("--palabras", action="store_true")
    a, extra = p.parse_known_args()
    if a.cmd == "logos":
        return cmd_logos(a, extra)
    if a.cmd == "render":
        return cmd_render(a, extra)
    scripts = {"cortar": "cortar.py", "planos": "planos.py", "montar": "montar.py", "mapa": "mapa_puntos.py", "logo-trazo": "logo_trazo.py"}
    if a.cmd in scripts:
        return cmd_script(scripts[a.cmd], extra)
    if extra:
        p.error("argumentos no reconocidos: " + " ".join(extra))
    {"entorno": cmd_entorno, "nuevo": cmd_nuevo, "transcribir": cmd_transcribir, "alinear": cmd_alinear,
     "envolvente": cmd_envolvente, "revisar": cmd_revisar, "comprobar": cmd_comprobar, "recursos": cmd_recursos,
     "iconos": cmd_iconos, "ver-logos": cmd_ver_logos}[a.cmd](a)


if __name__ == "__main__":
    main()
