"""Entrada única de la skill animaciones-horizontal-voz.

Uso (desde la carpeta del proyecto, salvo entorno y nuevo):
    python anim.py entorno [--instalar]              comprueba (e instala) ffmpeg, Node, Chromium, Whisper, torchaudio
    python anim.py nuevo <carpeta> <audio>           crea el proyecto desde la plantilla con la voz dentro
    python anim.py nuevo <carpeta> --dur 41          ... o sin audio (solo animación), con esa duración
    python anim.py estimar <transcripción.txt>       sin audio: tiempos estimados desde las marcas mm:ss
    python anim.py transcribir [--nombres "A, B"]    texto de la voz con Whisper -> trabajo/guion.txt
    python anim.py alinear                           tiempos exactos por palabra -> trabajo/tiempos.json
    python anim.py escuchar                          cómo suena: ritmo, pausas, énfasis y energía -> trabajo/escucha.md/.png
    python anim.py envolvente <palabra|índice> ...   energía de la voz alrededor de esas palabras (comprobar)
    python anim.py logos "Claude" "OpenAI" ...       logos listos para fondo oscuro -> assets/logos
    python anim.py ver-logos                         hoja con los logos sobre el fondo -> trabajo/revision/logos.png
    python anim.py iconos gamepad-2 sunrise ...      añade iconos de Lucide (lucide.dev) al mapa ICON del index.html
    python anim.py revisar t1 t2 ... [--hoja nombre] fotogramas + hoja de contactos -> trabajo/revision/
    python anim.py render [--noaudio] [--from=a --to=b] [--out=...]
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
                 "Para crear uno: python anim.py nuevo <carpeta> <audio>")


def duracion(audio):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(audio)],
                         capture_output=True, text=True).stdout.strip()
    return float(out)


def cmd_nuevo(a):
    dest = Path(a.carpeta).resolve()
    sin_audio = not a.audio
    if sin_audio and not a.dur:
        sys.exit("Sin audio hace falta la duración: anim.py nuevo <carpeta> --dur 41")
    audio = Path(a.audio).resolve() if a.audio else None
    if audio and not audio.is_file():
        sys.exit(f"No encuentro el audio {audio}")
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
    for d in ("trabajo", "out", "assets/logos", "assets/audio"):
        (dest / d).mkdir(parents=True, exist_ok=True)
    if sin_audio:
        dur, ruta_audio = round(a.dur, 2), ""
    else:
        voz = dest / "assets" / "audio" / ("voz" + audio.suffix.lower())
        shutil.copy2(audio, voz)
        dur, ruta_audio = round(duracion(voz), 2), f"assets/audio/{voz.name}"
    idx = dest / "index.html"
    html = idx.read_text(encoding="utf-8")
    html = re.sub(r"(const CONFIG = \{ dur: )[\d.]+(, audio: ')[^']*(')",
                  lambda m: f"{m.group(1)}{dur}{m.group(2)}{ruta_audio}{m.group(3)}", html, count=1)
    idx.write_text(html, encoding="utf-8")
    print(f"Proyecto creado en {dest}\n  " + (f"voz: {Path(ruta_audio).name} ({dur} s)" if ruta_audio else
          f"SIN AUDIO: {dur} s (el render sale sin pista de sonido; tiempos con 'anim.py estimar <transcripción>')"))
    if not (dest / "node_modules" / "playwright-core").is_dir():
        print("Instalando playwright-core (npm)...")
        if run(["npm", "install", "--no-audit", "--no-fund", "--silent"], cwd=dest) != 0:
            print("AVISO: npm install falló; ejecútalo a mano en la carpeta del proyecto.")
    if sin_audio:
        print("\nSiguiente: guarda la transcripción con marcas en trabajo/transcripcion_marcas.txt, ejecuta "
              "'anim.py estimar trabajo/transcripcion_marcas.txt' y después 'anim.py escuchar'")
    else:
        print("\nSiguiente (desde la carpeta del proyecto): anim.py transcribir --nombres \"...\" -> corrige "
              "trabajo/guion.txt -> anim.py alinear -> anim.py escuchar")


def cmd_transcribir(a):
    exigir_proyecto()
    audio = a.audio or next((str(p) for p in sorted(Path("assets/audio").glob("voz.*"))), None)
    if not audio:
        sys.exit("No hay voz en assets/audio/ (voz.mp3/wav)")
    args = [PY, str(SCRIPTS / "transcribir.py"), audio, "--salida", "trabajo"]
    if a.nombres:
        args += ["--nombres", a.nombres]
    if a.modelo:
        args += ["--modelo", a.modelo]
    if a.cpu:
        args.append("--cpu")
    sys.exit(run(args))


def cmd_estimar(a):
    """Sin audio: tiempos por palabra estimados desde una transcripción con marcas mm:ss."""
    exigir_proyecto()
    dur = a.dur
    if not dur:
        m = re.search(r"const CONFIG = \{ dur: ([\d.]+)", Path("index.html").read_text(encoding="utf-8"))
        dur = float(m.group(1)) if m else 0
    args = [PY, str(SCRIPTS / "estimar.py"), a.transcripcion, "--salida", a.salida, "--dur", str(dur)]
    if a.ritmo:
        args += ["--ritmo", str(a.ritmo)]
    sys.exit(run(args))


def cmd_alinear(a):
    exigir_proyecto()
    audio = a.audio or next((str(p) for p in sorted(Path("assets/audio").glob("voz.*"))), None)
    sys.exit(run([PY, str(SCRIPTS / "alinear.py"), audio, a.guion, "--salida", a.salida]))


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


def cmd_escuchar(a):
    """Ritmo, pausas, énfasis y energía de la voz (con tiempos.json; sin audio solo ritmo y pausas entre frases)."""
    exigir_proyecto()
    if not Path("trabajo/tiempos.json").is_file():
        sys.exit("Falta trabajo/tiempos.json: ejecuta antes 'anim.py alinear' (o 'anim.py estimar' sin audio)")
    audio = next((str(p) for p in sorted(Path("assets/audio").glob("voz.*"))), "")
    sys.exit(run([PY, str(SCRIPTS / "escuchar.py"), "trabajo/tiempos.json", "--salida", "trabajo/escucha",
                  *(["--audio", audio] if audio else [])]))


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
    p = argparse.ArgumentParser(description="Animaciones sincronizadas con una locución (HTML -> MP4).")
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("entorno"); s.add_argument("--instalar", action="store_true")
    s = sub.add_parser("nuevo"); s.add_argument("carpeta"); s.add_argument("audio", nargs="?", default="")
    s.add_argument("--dur", type=float, default=0, help="sin audio: duración de la animación en segundos")
    s.add_argument("--forzar", action="store_true")
    s = sub.add_parser("estimar"); s.add_argument("transcripcion"); s.add_argument("--dur", type=float, default=0)
    s.add_argument("--ritmo", type=float, default=0); s.add_argument("--salida", default="trabajo/tiempos.json")
    s = sub.add_parser("transcribir"); s.add_argument("--nombres", default=""); s.add_argument("--modelo", default="")
    s.add_argument("--cpu", action="store_true"); s.add_argument("--audio", default="")
    s = sub.add_parser("alinear"); s.add_argument("--guion", default="trabajo/guion.txt"); s.add_argument("--audio", default="")
    s.add_argument("--salida", default="trabajo/tiempos.json", help="otro archivo para probar pronunciaciones sin pisar tiempos.json")
    sub.add_parser("escuchar")
    s = sub.add_parser("envolvente"); s.add_argument("palabras", nargs="+")
    sub.add_parser("logos", add_help=False)
    sub.add_parser("ver-logos")
    s = sub.add_parser("iconos"); s.add_argument("nombres", nargs="+")
    s = sub.add_parser("revisar"); s.add_argument("tiempos", nargs="+"); s.add_argument("--hoja", default="")
    sub.add_parser("render", add_help=False)
    s = sub.add_parser("comprobar"); s.add_argument("archivo", nargs="?"); s.add_argument("--palabras", action="store_true")
    a, extra = p.parse_known_args()
    if a.cmd == "logos":
        return cmd_logos(a, extra)
    if a.cmd == "render":
        return cmd_render(a, extra)
    if extra:
        p.error("argumentos no reconocidos: " + " ".join(extra))
    {"entorno": cmd_entorno, "nuevo": cmd_nuevo, "transcribir": cmd_transcribir, "alinear": cmd_alinear, "estimar": cmd_estimar,
     "escuchar": cmd_escuchar, "envolvente": cmd_envolvente, "revisar": cmd_revisar, "comprobar": cmd_comprobar,
     "iconos": cmd_iconos, "ver-logos": cmd_ver_logos}[a.cmd](a)


if __name__ == "__main__":
    main()
