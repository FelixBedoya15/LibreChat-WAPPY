"""Entrada única de la skill animaciones-horizontal-combinadas.

Uso (desde la carpeta del proyecto, salvo entorno y nuevo):
    python anim.py entorno [--instalar]              comprueba (e instala) ffmpeg, Node, Chromium, Whisper, torchaudio
    python anim.py nuevo <carpeta> <audio>           crea el proyecto desde la plantilla con la voz dentro
    python anim.py nuevo <carpeta> --dur 41          ... o sin audio (solo animación), con esa duración
    python anim.py nuevo <carpeta> --video toma.mp4  ... o una intro grabada a cámara (cara <-> animación)
         [--modo audio|cara|capas|combinado] [--tema oscuro|profundidad] [--acento '#3E6EF2']
         [--fondo cortina|aurora|malla|constelacion|liso|puntos] [--acabado cristal|solido|contorno]
         [--tipo outfit|grotesk|editorial]        dirección de arte de ESTE vídeo (references/direccion.md)
         [--sonido voz|efectos|musica] [--musica intro-tambores] [--densidad sobria|media|espectaculo]
         [--subtitulos] [--camara-en-mano]        estilo del proyecto (references/estilos.md)
         [--vertical]                             reel vertical 1080x1920 (Instagram, TikTok, Shorts)
    python anim.py estilo [--sonido musica ...]      muestra o cambia el estilo del proyecto (ESTILO en index.html)
    python anim.py estimar <transcripción.txt>       sin audio: tiempos estimados desde las marcas mm:ss
    python anim.py transcribir [--nombres "A, B"]    texto de la voz con Whisper -> trabajo/guion.txt
                               [--toma]              ... de la grabación original -> edicion/guion.txt
    python anim.py alinear [--toma]                  tiempos exactos por palabra -> trabajo/tiempos.json (o edicion/)
    python anim.py cortar [--fin 76.95]              intro a cámara: quita las pausas -> voz cortada, cortes, proxy
    python anim.py planos [--hoja out/x.mp4]         palabras con su fotograma + revisión de edicion/montaje.json
    python anim.py recortar [--alto 720,2160]        modos capas/combinado: fotogramas + silueta de la persona -> edicion/capas/
    python anim.py montar [--res 1080]               monta cara + animaciones -> out/<proyecto>_<alto>p<fps>.mp4
    python anim.py sonido [--lista]                  efectos (sfx) + música + voz -> assets/audio/mezcla.wav a -14 LUFS
    python anim.py lectura                          lo que hace distinto a este vídeo (voz, guion, colores, historial) -> trabajo/lectura.md
    python anim.py historial [--comprobar|--anotar]  vídeos anteriores y qué no repetir; al entregar, --anotar
    python anim.py golpe --en 12.06 [--tambien efectos titulos]   música: desde qué segundo del tema empezar para que
                                                     un golpe fuerte caiga en ese instante (ESTILO.tramosMusica)
    python anim.py mapa --marcar USA,ESP             mapa del mundo en puntos -> assets/mapa_puntos.json
    python anim.py logo-trazo icono.png              logo de un trazo para escribirlo a mano -> assets/logos/*_trazo.json
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


ESTILO_DEF = {"modo": "audio", "tema": "oscuro", "fondo": "cortina", "acabado": "cristal", "tipo": "outfit", "acento": "#3E6EF2",
              "sonido": "voz", "musica": "intro-tambores",
              "densidad": "media", "subtitulos": False, "camaraEnMano": False}
RE_ESTILO = re.compile(r"^const ESTILO = (\{.*\});", re.M)
RE_CONFIG = re.compile(r"^const CONFIG = \{(.*?)\};", re.M)


def leer_estilo(html=None):
    html = html if html is not None else Path("index.html").read_text(encoding="utf-8")
    m = RE_ESTILO.search(html)
    return {**ESTILO_DEF, **(json.loads(m.group(1)) if m else {})}


def escribir_estilo(estilo, idx=Path("index.html")):
    html = idx.read_text(encoding="utf-8")
    linea = "const ESTILO = " + json.dumps(estilo, ensure_ascii=False) + ";"
    if not RE_ESTILO.search(html):
        sys.exit("index.html no tiene la línea 'const ESTILO = {...};' (proyecto de una plantilla anterior: cópiala de la plantilla)")
    idx.write_text(RE_ESTILO.sub(lambda m: linea, html, count=1), encoding="utf-8")


def leer_config():
    m = RE_CONFIG.search(Path("index.html").read_text(encoding="utf-8"))
    txt = m.group(1) if m else ""
    audio = re.search(r"audio:\s*'([^']*)'", txt)
    return {"capas": re.search(r"capas:\s*true", txt) is not None, "audio": audio.group(1) if audio else ""}


def mezclar():
    """efectos + música + voz -> assets/audio/mezcla.wav (si el estilo lleva sonido); devuelve la ruta o ''"""
    if leer_estilo().get("sonido", "voz") == "voz":
        return ""
    if not Path("tools/sonidos.mjs").is_file():
        shutil.copy2(PLANTILLA / "tools" / "sonidos.mjs", "tools/sonidos.mjs")
    if run(["node", "tools/sonidos.mjs"]) != 0 or run([PY, str(SCRIPTS / "sonido.py")]) != 0:
        sys.exit("Falló la mezcla de sonido")
    return "assets/audio/mezcla.wav"


def duracion(audio):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(audio)],
                         capture_output=True, text=True).stdout.strip()
    return float(out)


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
    video = Path(a.video).resolve() if a.video else None
    if video and not video.is_file():
        sys.exit(f"No encuentro el vídeo {video}")
    sin_audio = not a.audio and not video
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
    if video:
        info = sonda_video(video)
        (dest / "edicion").mkdir(exist_ok=True)
        json.dump({"video": str(video), **info}, open(dest / "edicion" / "fuente.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le",
                        str(dest / "edicion" / "toma.wav")], check=True)
        dur, ruta_audio = info["duracion"], "assets/audio/voz.wav"     # cortar.py pone la voz cortada y su duración
        print(f"Toma: {info['ancho']}x{info['alto']} · {info['fps']:.3f} fps · {info['duracion']} s -> edicion/fuente.json y edicion/toma.wav")
    elif sin_audio:
        dur, ruta_audio = round(a.dur, 2), ""
    else:
        voz = dest / "assets" / "audio" / ("voz" + audio.suffix.lower())
        shutil.copy2(audio, voz)
        dur, ruta_audio = round(duracion(voz), 2), f"assets/audio/{voz.name}"
    idx = dest / "index.html"
    html = idx.read_text(encoding="utf-8")
    html = re.sub(r"(const CONFIG = \{ dur: )[\d.]+(, audio: ')[^']*(')",
                  lambda m: f"{m.group(1)}{dur}{m.group(2)}{ruta_audio}{m.group(3)}", html, count=1)
    if video:
        html = html.replace("montaje: false", "montaje: true", 1)   # la plantilla lee edicion/montaje.json
    if a.vertical:
        html = html.replace("ancho: 1920, alto: 1080", "ancho: 1080, alto: 1920", 1)   # reel: la grabación se encuadra en vertical
    modo = a.modo or ("cara" if video else "audio")
    capas = modo in ("capas", "combinado")
    if capas:
        if not video:
            sys.exit(f"El modo {modo} necesita la grabación: anim.py nuevo <carpeta> --video <toma.mp4> --modo {modo}")
        html = html.replace("capas: false", "capas: true", 1)       # la grabación se pinta como capas (motor/capas.js)
    idx.write_text(html, encoding="utf-8")
    estilo = {**ESTILO_DEF, "modo": modo, "tema": a.tema or ("profundidad" if capas else "oscuro"),
              "fondo": a.fondo or ESTILO_DEF["fondo"], "acabado": a.acabado or ESTILO_DEF["acabado"], "tipo": a.tipo or ESTILO_DEF["tipo"],
              "acento": a.acento or ESTILO_DEF["acento"], "sonido": a.sonido or ("musica" if capas else "voz"),
              "musica": a.musica or ESTILO_DEF["musica"], "densidad": a.densidad or ("espectaculo" if capas else "media"),
              "subtitulos": bool(a.subtitulos), "camaraEnMano": bool(a.camara_en_mano)}
    escribir_estilo(estilo, idx)
    print("Estilo: " + " · ".join(f"{k} {v}" for k, v in estilo.items()))
    print(f"Proyecto creado en {dest}\n  " + ("intro a cámara: la voz saldrá de la toma sin pausas" if video else f"voz: {Path(ruta_audio).name} ({dur} s)" if ruta_audio else
          f"SIN AUDIO: {dur} s (el render sale sin pista de sonido; tiempos con 'anim.py estimar <transcripción>')"))
    if not (dest / "node_modules" / "playwright-core").is_dir():
        print("Instalando playwright-core (npm)...")
        if run(["npm", "install", "--no-audit", "--no-fund", "--silent"], cwd=dest) != 0:
            print("AVISO: npm install falló; ejecútalo a mano en la carpeta del proyecto.")
    if video:
        print("\nSiguiente (desde la carpeta del proyecto): anim.py transcribir --toma --nombres \"...\", corrige "
              "edicion/guion.txt, anim.py alinear --toma y anim.py cortar (references/intro-con-cara.md)"
              + ("; después anim.py recortar (references/capas-sobre-video.md)" if capas else ""))
    elif sin_audio:
        print("\nSiguiente: guarda la transcripción con marcas en trabajo/transcripcion_marcas.txt y ejecuta "
              "'anim.py estimar trabajo/transcripcion_marcas.txt'")
    else:
        print("\nSiguiente: cd a la carpeta y 'python <skill>/scripts/anim.py transcribir --nombres \"...\"'")


def cmd_transcribir(a):
    exigir_proyecto()
    if a.toma:
        audio, salida = "edicion/toma.wav", "edicion"
        if not Path(audio).is_file():
            sys.exit("No hay edicion/toma.wav: crea el proyecto con 'anim.py nuevo <carpeta> --video <grabación>'")
    else:
        audio, salida = a.audio or next((str(p) for p in sorted(Path("assets/audio").glob("voz.*"))), None), "trabajo"
    if not audio:
        sys.exit("No hay voz en assets/audio/ (voz.mp3/wav)")
    args = [PY, str(SCRIPTS / "transcribir.py"), audio, "--salida", salida]
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
    if a.toma:
        sys.exit(run([PY, str(SCRIPTS / "alinear.py"), "edicion/toma.wav", "edicion/guion.txt", "--salida", "edicion/tiempos.json"]))
    audio = a.audio or next((str(p) for p in sorted(Path("assets/audio").glob("voz.*"))), None)
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
    if leer_config()["capas"] and not any(x.startswith("--capas") for x in extra):
        esc = next((float(x.split("=")[1]) for x in extra if x.startswith("--scale=")), 1.0)
        alto = int(round(1080 * esc))
        info = Path("edicion/capas/capas.json")
        if not info.is_file() or alto not in json.load(open(info, encoding="utf-8")).get("altos", []):
            print(f"Falta el juego de capas de {alto} px: anim.py recortar --alto {alto}")
            if run([PY, str(SCRIPTS / "recortar.py"), "--alto", str(alto)]) != 0:
                sys.exit("Falló el recorte")
        extra = [*extra, f"--capas={alto}"]
    if "--noaudio" not in extra and not any(x.startswith("--audio") for x in extra):
        mez = mezclar()
        if mez:
            extra = [*extra, f"--audio={mez}"]
    sys.exit(run(["node", "render.mjs", *extra]))


def cmd_estilo(a):
    """muestra el estilo del proyecto o cambia lo que se pase"""
    exigir_proyecto()
    e = leer_estilo()
    cambios = {k: v for k, v in (("modo", a.modo), ("tema", a.tema), ("fondo", a.fondo), ("acabado", a.acabado), ("tipo", a.tipo),
                                 ("acento", a.acento), ("sonido", a.sonido), ("musica", a.musica), ("densidad", a.densidad)) if v}
    if a.subtitulos is not None:
        cambios["subtitulos"] = a.subtitulos == "si"
    if a.camara_en_mano is not None:
        cambios["camaraEnMano"] = a.camara_en_mano == "si"
    if cambios:
        e.update(cambios)
        escribir_estilo(e)
        if "modo" in cambios:
            html = Path("index.html").read_text(encoding="utf-8")
            capas = e["modo"] in ("capas", "combinado")
            html = re.sub(r"capas: (true|false)", f"capas: {'true' if capas else 'false'}", html, count=1)
            Path("index.html").write_text(html, encoding="utf-8")
    print("Estilo: " + " · ".join(f"{k} {v}" for k, v in e.items()))


def cmd_sonido(a, extra):
    exigir_proyecto()
    if "--lista" in extra:
        sys.exit(run([PY, str(SCRIPTS / "sonido.py"), "--lista"]))
    if leer_estilo().get("sonido", "voz") == "voz":
        sys.exit("El estilo es 'solo voz': cámbialo con 'anim.py estilo --sonido efectos' (o musica)")
    print(mezclar())


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
    s.add_argument("--video", default="", help="intro grabada a cámara: se quitan las pausas y se alternan cara y animación")
    s.add_argument("--forzar", action="store_true")
    s.add_argument("--modo", choices=["audio", "cara", "capas", "combinado"], default="")
    s.add_argument("--tema", choices=["oscuro", "profundidad"], default="")
    s.add_argument("--fondo", choices=["cortina", "aurora", "malla", "constelacion", "liso", "puntos", "espacio"], default="")
    s.add_argument("--acabado", choices=["cristal", "solido", "contorno"], default="")
    s.add_argument("--tipo", choices=["outfit", "grotesk", "editorial"], default="")
    s.add_argument("--acento", default="")
    s.add_argument("--sonido", choices=["voz", "efectos", "musica"], default="")
    s.add_argument("--musica", default="")
    s.add_argument("--densidad", choices=["sobria", "media", "espectaculo"], default="")
    s.add_argument("--subtitulos", action="store_true")
    s.add_argument("--camara-en-mano", action="store_true")
    s.add_argument("--vertical", action="store_true", help="reel vertical 1080x1920")
    s = sub.add_parser("estilo")
    s.add_argument("--modo", choices=["audio", "cara", "capas", "combinado"], default="")
    s.add_argument("--tema", choices=["oscuro", "profundidad"], default="")
    s.add_argument("--fondo", choices=["cortina", "aurora", "malla", "constelacion", "liso", "puntos", "espacio"], default="")
    s.add_argument("--acabado", choices=["cristal", "solido", "contorno"], default="")
    s.add_argument("--tipo", choices=["outfit", "grotesk", "editorial"], default="")
    s.add_argument("--acento", default="")
    s.add_argument("--sonido", choices=["voz", "efectos", "musica"], default="")
    s.add_argument("--musica", default="")
    s.add_argument("--densidad", choices=["sobria", "media", "espectaculo"], default="")
    s.add_argument("--subtitulos", choices=["si", "no"], default=None)
    s.add_argument("--camara-en-mano", choices=["si", "no"], default=None)
    s = sub.add_parser("estimar"); s.add_argument("transcripcion"); s.add_argument("--dur", type=float, default=0)
    s.add_argument("--ritmo", type=float, default=0); s.add_argument("--salida", default="trabajo/tiempos.json")
    s = sub.add_parser("transcribir"); s.add_argument("--nombres", default=""); s.add_argument("--modelo", default="")
    s.add_argument("--cpu", action="store_true"); s.add_argument("--audio", default="")
    s.add_argument("--toma", action="store_true", help="la grabación original (edicion/toma.wav) -> edicion/guion.txt")
    s = sub.add_parser("alinear"); s.add_argument("--guion", default="trabajo/guion.txt"); s.add_argument("--audio", default="")
    s.add_argument("--toma", action="store_true", help="edicion/guion.txt sobre la grabación original -> edicion/tiempos.json")
    s.add_argument("--salida", default="trabajo/tiempos.json", help="otro archivo para probar pronunciaciones sin pisar tiempos.json")
    s = sub.add_parser("envolvente"); s.add_argument("palabras", nargs="+")
    sub.add_parser("logos", add_help=False)
    sub.add_parser("ver-logos")
    s = sub.add_parser("iconos"); s.add_argument("nombres", nargs="+")
    s = sub.add_parser("revisar"); s.add_argument("tiempos", nargs="+"); s.add_argument("--hoja", default="")
    sub.add_parser("render", add_help=False)
    for nombre in ("cortar", "planos", "montar", "mapa", "logo-trazo", "recortar", "sonido", "golpe", "lectura", "historial"):
        sub.add_parser(nombre, add_help=False)
    s = sub.add_parser("comprobar"); s.add_argument("archivo", nargs="?"); s.add_argument("--palabras", action="store_true")
    a, extra = p.parse_known_args()
    if a.cmd == "logos":
        return cmd_logos(a, extra)
    if a.cmd == "render":
        return cmd_render(a, extra)
    if a.cmd == "sonido":
        return cmd_sonido(a, extra)
    if a.cmd == "cortar" and not any(x.startswith("--zoom") for x in extra) and es_proyecto() \
            and leer_estilo().get("modo") in ("capas", "combinado"):
        extra = [*extra, "--zoom", "1.08"]        # con capas, el punch-in de cada salto es suave (≤ 9 %)
    scripts = {"cortar": "cortar.py", "planos": "planos.py", "montar": "montar.py", "mapa": "mapa_puntos.py",
               "logo-trazo": "logo_trazo.py", "recortar": "recortar.py", "golpe": "golpes.py",
               "lectura": "lectura.py", "historial": "historial.py"}
    if a.cmd in scripts:
        return cmd_script(scripts[a.cmd], extra)
    if extra:
        p.error("argumentos no reconocidos: " + " ".join(extra))
    {"entorno": cmd_entorno, "nuevo": cmd_nuevo, "transcribir": cmd_transcribir, "alinear": cmd_alinear, "estimar": cmd_estimar,
     "envolvente": cmd_envolvente, "revisar": cmd_revisar, "comprobar": cmd_comprobar,
     "iconos": cmd_iconos, "ver-logos": cmd_ver_logos, "estilo": cmd_estilo}[a.cmd](a)


if __name__ == "__main__":
    main()
