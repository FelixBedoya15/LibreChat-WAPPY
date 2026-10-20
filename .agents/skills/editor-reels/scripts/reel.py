"""Director de la skill editor-reels. Se ejecuta SIEMPRE desde la carpeta del proyecto de reels.

    python <skill>/scripts/reel.py entorno [--instalar] [--gpu]      comprobar / instalar dependencias
    python <skill>/scripts/reel.py preparar                          crear o actualizar el proyecto aquí
    python <skill>/scripts/reel.py analizar <video> <reel> [--nombres "Claude, n8n"] [--idioma es]
    python <skill>/scripts/reel.py cortar <reel> --tramos "1.71-5.62,9.26-13.04,..." [--fps 25] [--congelar-inicio 2] [--clasico]
    python <skill>/scripts/reel.py alinear <reel>                      tiempos exactos de cada palabra (modo pro)
    python <skill>/scripts/reel.py logos "Herramienta 1" "Herramienta 2" [--domain Nombre=dominio.com]
    python <skill>/scripts/reel.py captura <reel> <url> [--nombre fuente]   la web de la fuente, para una escena
    python <skill>/scripts/reel.py edl <reel>
    python <skill>/scripts/reel.py revisar <reel> [auto | 0.5 6.2 12.8 ...] [--zonas] [--nombre hoja]
    python <skill>/scripts/reel.py sonido <reel>                       cada efecto frente a la voz (modo pro)
    python <skill>/scripts/reel.py render <reel> [--nombre v1]
    python <skill>/scripts/reel.py portada <reel> [1.0]                imagen para la portada de Instagram
    python <skill>/scripts/reel.py tira <video> <desde> <hasta>        fotogramas seguidos de un vídeo ya renderizado
    python <skill>/scripts/reel.py recolocar <reel>                    mover los tiempos del guion tras cambiar los cortes

Dos modos. El modo pro (guion_pro.json) es el normal para una persona hablando a cámara: cara con una pieza sobre
el pecho, escenas a pantalla completa y primer plano, todo sincronizado con la voz. El modo clásico (guion.json,
con `cortar --clasico`) queda para clips de móvil a pantalla completa y grabaciones dobles de pantalla y cámara.
edl, revisar, render y portada usan el modo pro si existe guion_pro.json (--clasico fuerza el otro).

Carpetas del proyecto: brutos/ (originales), trabajo/<reel>/ (audio, transcripciones, cortes, encuadre,
alineación y guion), editor/ (Remotion), salida/ (reels terminados) y marca.json (colores y logo de la marca).
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
SCRIPTS = SKILL / "scripts"
PLANTILLA = SKILL / "plantilla"
P = Path.cwd()
EDITOR = P / "editor"
SFX_REMOTION = ["whoosh", "whip", "switch", "mouse-click", "ding"]  # sonidos libres de @remotion/sfx

sys.path.insert(0, str(SCRIPTS))
from entorno import asegurar_path  # noqa: E402

asegurar_path()
# En Windows, sin terminal UTF-8, imprimir "→" o tildes rompe los scripts (cp1252): UTF-8 aquí y en los hijos
os.environ.setdefault("PYTHONIOENCODING", "utf-8")
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError, OSError):
        pass


def run(cmd, cwd=None, check=True, env=None):
    cmd = [str(c) for c in cmd]
    shell = os.name == "nt" and cmd[0].lower().endswith((".cmd", ".bat"))
    print("→", " ".join(Path(c).name if i == 0 else c for i, c in enumerate(cmd)), flush=True)
    r = subprocess.run(cmd, cwd=cwd, shell=shell, env=env)
    if check and r.returncode != 0:
        sys.exit(f"Ha fallado: {' '.join(cmd[:3])}...")
    return r.returncode


def limpiar_temporales():
    """Borra carpetas temporales nuestras (editor-reels-*) que hayan quedado de una ejecución interrumpida."""
    import time
    for d in Path(tempfile.gettempdir()).glob("editor-reels-*"):
        try:
            if d.is_dir() and time.time() - d.stat().st_mtime > 1800:
                shutil.rmtree(d, ignore_errors=True)
        except OSError:
            pass


def run_remotion(cmd, cwd=None):
    """Un comando de Remotion con su propia carpeta temporal, que se borra al acabar.
    Remotion deja en la carpeta temporal del sistema una copia del proyecto y del vídeo base por ejecución
    (cientos de MB) y en Windows no siempre las borra: sin esto, en unas pocas sesiones llenan el disco."""
    limpiar_temporales()
    privado = tempfile.mkdtemp(prefix="editor-reels-")
    try:
        return run(cmd, cwd=cwd, env=dict(os.environ, TEMP=privado, TMP=privado, TMPDIR=privado))
    finally:
        shutil.rmtree(privado, ignore_errors=True)


def py(script, *args):
    return run([sys.executable, SCRIPTS / script, *args])


def exe(nombre):
    ruta = shutil.which(nombre)
    if not ruta:
        sys.exit(f"No encuentro {nombre}. Ejecuta: python {SCRIPTS / 'reel.py'} entorno --instalar")
    return ruta


def trabajo(reel):
    d = P / "trabajo" / reel
    d.mkdir(parents=True, exist_ok=True)
    return d


def leer(ruta, defecto=None):
    return json.loads(Path(ruta).read_text(encoding="utf-8")) if Path(ruta).exists() else defecto


def guardar(ruta, datos):
    Path(ruta).write_text(json.dumps(datos, ensure_ascii=False, indent=1), encoding="utf-8")


def es_pro(reel, a=None):
    """Modo del reel: pro si tiene guion_pro.json (salvo --clasico)."""
    if a is not None and getattr(a, "clasico", False):
        return False
    return (P / "trabajo" / reel / "guion_pro.json").exists()


# ------------------------------------------------------------------------------------------------
def cmd_entorno(a):
    extra = (["--instalar"] if a.instalar else []) + (["--gpu"] if a.gpu else [])
    sys.exit(run([sys.executable, SCRIPTS / "entorno.py", *extra], check=False))


def cmd_preparar(a):
    # En Windows las rutas de más de 260 caracteres fallan (el navegador de Remotion está muy anidado)
    if os.name == "nt" and len(str(P)) > 110:
        print(f"[aviso] La carpeta del proyecto tiene una ruta muy larga ({len(str(P))} caracteres). En Windows "
              "puede impedir que arranque el navegador de Remotion: mejor una ruta corta, p. ej. Documentos\\Reels")
    for d in ("brutos", "trabajo", "salida"):
        (P / d).mkdir(exist_ok=True)
    EDITOR.mkdir(exist_ok=True)
    # Plantilla -> editor/ (se sobrescribe para tener siempre la última versión de la skill)
    for sub in ("src", "scripts"):
        shutil.copytree(PLANTILLA / sub, EDITOR / sub, dirs_exist_ok=True)
    for f in ("package.json", "remotion.config.ts", "tsconfig.json"):
        shutil.copyfile(PLANTILLA / f, EDITOR / f)
    (EDITOR / "scripts" / "fotogramas_pro.mjs").unlink(missing_ok=True)  # de versiones anteriores: ahora es fotogramas.mjs --comp
    # Piezas propias del proyecto: se crea una vez y no se vuelve a tocar
    propias = EDITOR / "src" / "pro" / "propias.tsx"
    if not propias.exists():
        shutil.copyfile(PLANTILLA / "propias.tsx", propias)
    # Marca: marca.json en la raíz del proyecto manda (el usuario la edita ahí)
    marca = P / "marca.json"
    plantilla_marca = leer(PLANTILLA / "src" / "marca.json")
    if not marca.exists():
        shutil.copyfile(PLANTILLA / "src" / "marca.json", marca)
        print(f"Creada {marca.name} con la marca por defecto (DominIA). Edítala para usar tus colores y tu logo.")
    datos_marca = leer(marca)
    if "logo" not in datos_marca:
        if datos_marca.get("nombre") == plantilla_marca.get("nombre"):  # la marca por defecto, de antes de que hubiera logo
            datos_marca["logo"] = plantilla_marca["logo"]
            guardar(marca, datos_marca)
        else:
            print('[nota] marca.json no tiene "logo": añade "logo": "logos/mi-logo.png" (dentro de editor/public/) para '
                  "que salga arriba a la derecha en los reels del modo pro.")
    shutil.copyfile(marca, EDITOR / "src" / "marca.json")
    (EDITOR / "public" / "logos").mkdir(parents=True, exist_ok=True)
    for f in (PLANTILLA / "public" / "logos").glob("*"):  # el logo de la marca por defecto
        if not (EDITOR / "public" / "logos" / f.name).exists():
            shutil.copyfile(f, EDITOR / "public" / "logos" / f.name)
    # Dependencias de Node (solo si cambió package.json o faltan)
    huella = hashlib.sha1((EDITOR / "package.json").read_bytes()).hexdigest()
    marca_npm = EDITOR / "node_modules" / ".huella_plantilla"
    if not marca_npm.exists() or marca_npm.read_text() != huella:
        run([exe("npm"), "install", "--no-fund", "--no-audit"], cwd=EDITOR)
        marca_npm.write_text(huella)
    # Navegador que usa Remotion para dibujar (Chrome Headless Shell, ~110 MB, una vez por proyecto)
    run([exe("npx"), "remotion", "browser", "ensure"], cwd=EDITOR, check=False)
    # Sonidos del modo clásico: los propios se generan; los de Remotion (libres, sin atribución) se descargan una vez
    sfx = EDITOR / "public" / "sfx"
    sfx.mkdir(parents=True, exist_ok=True)
    for nombre in SFX_REMOTION:
        destino = sfx / f"{nombre}.wav"
        if destino.exists():
            continue
        try:
            req = urllib.request.Request(f"https://remotion.media/{nombre}.wav",
                                         headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                                                                "AppleWebKit/537.36 Chrome/128 Safari/537.36"})
            with urllib.request.urlopen(req, timeout=20) as r:
                destino.write_bytes(r.read())
        except Exception as e:
            print(f"[aviso] no he podido bajar {nombre}.wav ({e}); uso uno generado")
    py("sfx.py", sfx)  # genera los propios y rellena los que no se hayan podido bajar
    # Sonidos del modo pro: la biblioteca de la skill (sonidos/), con su ficha (sonidos.json)
    sfx2 = EDITOR / "public" / "sfx2"
    sfx2.mkdir(parents=True, exist_ok=True)
    for f in (SKILL / "sonidos").glob("*"):
        destino = sfx2 / f.name
        if not destino.exists() or destino.stat().st_size != f.stat().st_size or f.suffix == ".json":
            shutil.copyfile(f, destino)
    print(f"Proyecto listo en {P}")


def imprimir_palabras(t, pausa=0.6):
    linea, prev = [], None
    for w in t["palabras"]:
        if prev is not None and w["start"] - prev > pausa:
            print("  " + " ".join(linea))
            print(f"        ··· pausa {w['start'] - prev:.1f}s")
            linea = []
        dudosa = "?" if w["prob"] < 0.5 else ""
        linea.append(f"{w['word']}[{w['start']:.2f}-{w['end']:.2f}{dudosa}]")
        prev = w["end"]
    if linea:
        print("  " + " ".join(linea))


def medir_cadencia(video, voz=None):
    from cadencia import medir
    return medir(video, voz)


def decir_cadencia(c):
    if c.get("fps_real") and abs(c["fps_real"] - c["fps_archivo"]) > 0.6:
        print(f"Fotogramas: el archivo dice {c['fps_archivo']:.0f} por segundo, pero la imagen va a {c['fps_real']} "
              f"(repite fotogramas). El reel se montará a {c['fps_reel']} y sin repetidos.")
    else:
        print(f"Fotogramas: {c['fps_archivo']:.0f} por segundo en el archivo; el reel irá a {c['fps_reel']}."
              + (f" ({c['nota']})" if c.get("nota") else ""))


def cmd_analizar(a):
    video = Path(a.video).resolve()
    if not video.exists():
        sys.exit(f"No existe {video}")
    w = trabajo(a.reel)
    datos = {"video": str(video)}
    guardar(w / "reel.json", datos)
    run([exe("ffmpeg"), "-hide_banner", "-loglevel", "error", "-y", "-i", video, "-vn", "-ac", "1", "-ar", "16000",
         "-c:a", "pcm_s16le", w / "audio16k.wav"])
    extra = ["--idioma", a.idioma] + (["--nombres", a.nombres] if a.nombres else [])
    py("transcribir.py", w / "audio16k.wav", w / "transcripcion.json", *extra)
    if run([sys.executable, SCRIPTS / "encuadre.py", video, w / "encuadre.json"], check=False) != 0:
        print("[aviso] sin cara detectada: se usará un recorte centrado")
    t = leer(w / "transcripcion.json")
    datos["cadencia"] = medir_cadencia(video, t.get("voz"))
    guardar(w / "reel.json", datos)
    decir_cadencia(datos["cadencia"])
    print("\nTRANSCRIPCIÓN (palabra[inicio-fin], ? = dudosa). Ojo: Whisper adelanta la primera palabra de cada frase.")
    imprimir_palabras(t)
    print("\nZONAS DE VOZ (VAD, bordes fiables):", " ".join(f"{v['start']:.2f}-{v['end']:.2f}" for v in t["voz"]))
    tramos, actual = [], None
    for v in t["voz"]:
        if actual and v["start"] - actual[1] < 0.35:
            actual[1] = v["end"]
        else:
            if actual:
                tramos.append(actual)
            actual = [v["start"], v["end"]]
    if actual:
        tramos.append(actual)
    print("\nPROPUESTA DE TRAMOS (toda la voz, sin pausas). Quita las tomas repetidas y los fallos antes de cortar:")
    print('  --tramos "' + ",".join(f"{x:.2f}-{y:.2f}" for x, y in tramos) + '"')


def guion_escrito(w):
    """¿Hay ya un guion con piezas? (para avisar si cambian los cortes)"""
    return any(g and (g.get("piezas") or g.get("elementos")) for g in (leer(w / "guion_pro.json"), leer(w / "guion.json")))


def borrador_guion(t):
    """Una frase por línea, para repasarla y alinearla (reel.py alinear)."""
    lineas, actual = [], []
    for w in t["palabras"]:
        palabra = w["word"].strip()
        if not palabra:
            continue
        actual.append(palabra)
        if palabra[-1:] in ".?!":
            lineas.append(" ".join(actual))
            actual = []
    if actual:
        lineas.append(" ".join(actual))
    return "\n".join(lineas) + "\n"


def cmd_cortar(a):
    w = trabajo(a.reel)
    datos = leer(w / "reel.json")
    if not datos:
        sys.exit(f"Falta trabajo/{a.reel}/reel.json: ejecuta antes reel.py analizar")
    # Fotogramas reales de la grabación (no los que dice el archivo): a eso va el reel, sin repetidos
    cad = datos.get("cadencia")
    if not cad:
        cad = medir_cadencia(datos["video"], (leer(w / "transcripcion.json") or {}).get("voz"))
        datos["cadencia"] = cad
        guardar(w / "reel.json", datos)
    decir_cadencia(cad)
    fps = a.fps or cad["fps_reel"]
    extra_cad = []
    if fps == cad["fps_reel"]:
        extra_cad = (["--ciclo", str(cad["ciclo"])] if cad.get("ciclo") else []) + (["--mitad"] if cad.get("mitad") else [])
    elif a.fps:
        print(f"[aviso] --fps {a.fps} no coincide con los fotogramas reales ({cad['fps_reel']}): puede haber tirones")
    print(f"Reel a {fps} fps")
    # Si ya hay un guion escrito, se guardan los cortes con los que se escribió, para poder recolocar sus tiempos
    antes = leer(w / "cortes.json")
    if antes and guion_escrito(w) and not (w / "cortes_guion.json").exists():
        guardar(w / "cortes_guion.json", antes)
    py("cortes.py", w / "audio16k.wav", w / "cortes.json", "--tramos", a.tramos, "--fps", str(fps))
    cortes = leer(w / "cortes.json")
    cortes["cadencia"] = {k: cad.get(k) for k in ("fps_archivo", "fps_real", "mitad", "ciclo")} if extra_cad else None
    cortes["congelar_inicio"] = a.congelar_inicio
    guardar(w / "cortes.json", cortes)
    base = EDITOR / "public" / "reels" / a.reel / "base.mp4"
    extra = ["--encuadre", w / "encuadre.json"] if (w / "encuadre.json").exists() else []
    if a.congelar_inicio:
        extra += ["--congelar-inicio", str(a.congelar_inicio)]
    py("montar_base.py", datos["video"], w / "cortes.json", base, *extra, *extra_cad)
    run([exe("ffmpeg"), "-hide_banner", "-loglevel", "error", "-y", "-i", base, "-vn", "-ac", "1", "-ar", "16000",
         "-c:a", "pcm_s16le", w / "base16k.wav"])
    py("transcribir.py", w / "base16k.wav", w / "transcripcion_base.json")
    t = leer(w / "transcripcion_base.json")
    comprobacion = medir_cadencia(base, t.get("voz"))
    if comprobacion.get("fps_real") and comprobacion["fps_real"] < fps - 0.6:
        print(f"[aviso] el vídeo base sigue repitiendo fotogramas (van {comprobacion['fps_real']} reales en {fps}): "
              f"prueba con --fps {comprobacion['fps_real']}")
    # Borrador del texto para alinear (modo pro): se repasa a mano antes de reel.py alinear
    guion_txt = w / "alineacion" / "guion.txt"
    if not guion_txt.exists():
        guion_txt.parent.mkdir(parents=True, exist_ok=True)
        guion_txt.write_text(borrador_guion(t), encoding="utf-8")
        print(f"Creado {guion_txt.relative_to(P)}: repásalo (nombres, cifras, puntuación) y ejecuta reel.py alinear {a.reel}")
    n = len(cortes["tramos"])
    if not (w / "guion.json").exists() and not (w / "guion_pro.json").exists():
        if a.clasico:
            zooms = [[1.0, 1.025] if k % 2 == 0 else [1.05, 1.06] for k in range(n)]
            zooms[-1] = [1.0, 1.04]
            guardar(w / "guion.json", {"correcciones": {}, "destacar": [], "partir_subtitulos_en": [], "zooms": zooms, "logos": {},
                                       "capitulos": [], "elementos": [], "musica": {"archivo": "", "volumen": 0.1}})
            print(f"Creado {w / 'guion.json'} vacío (modo clásico): rellénalo (ver references/guion.md).")
        else:
            zooms = [[1.0, 1.03] if k % 2 == 0 else [1.07, 1.09] for k in range(n)]
            guardar(w / "guion_pro.json", {"zooms": zooms, "logos": {}, "secciones": [],
                                           "subtitulos": {"max_linea": 18, "sin": [], "grande": [], "textos": {}, "partir_antes": [],
                                                          "no_partir_antes": [], "destacar_idx": []},
                                           "piezas": [], "sonidos": []})
            print(f"Creado {w / 'guion_pro.json'} vacío (modo pro): rellénalo (ver references/guion-pro.md).")
    if (w / "cortes_guion.json").exists():
        viejos = leer(w / "cortes_guion.json")
        igual = viejos.get("fps") == cortes.get("fps") and [(x["inicio"], x["fin"]) for x in viejos["tramos"]] == \
            [(x["inicio"], x["fin"]) for x in cortes["tramos"]]
        if igual:
            (w / "cortes_guion.json").unlink()
        else:
            print(f"\n[importante] Los cortes han cambiado y ya había un guion escrito: sus tiempos ya no cuadran. "
                  f"Ejecuta reel.py recolocar {a.reel} (los mueve solos) y después reel.py alinear {a.reel}.")
    print(f"\nVÍDEO BASE LIMPIO: {cortes['duracion']:.2f}s. Cortes (inicio de cada tramo en el vídeo nuevo):",
          " ".join(f"{tr['offset']:.2f}" for tr in cortes["tramos"]))
    print("PALABRAS DEL VÍDEO BASE (tiempos de Whisper, aproximados; en modo pro los exactos salen de reel.py alinear):")
    imprimir_palabras(t, pausa=0.35)
    print(f"\nMira los primeros fotogramas (reel.py tira editor/public/reels/{a.reel}/base.mp4 0 0.32 --fps {fps} --ancho 400). "
          "Si el reel abre con los ojos a medio cerrar, repite cortar con --congelar-inicio 2 (o los que hagan falta).")


def cmd_alinear(a):
    w = trabajo(a.reel)
    guion = w / "alineacion" / "guion.txt"
    if not guion.exists():
        sys.exit(f"Falta {guion.relative_to(P)} (lo crea reel.py cortar): una frase por línea, tal como se verá en pantalla")
    py("alinear.py", w / "base16k.wav", guion, "--salida", w / "alineacion" / "tiempos.json",
       "--whisper", w / "transcripcion_base.json")


def cmd_logos(a):
    extra = [x for d in (a.domain or []) for x in ("--domain", d)] + (["--force"] if a.force else [])
    py("logos.py", *a.nombres, *extra)


def cmd_captura(a):
    extra = ["--nombre", a.nombre, "--ancho", str(a.ancho), "--alto", str(a.alto)]
    extra += ["--quitar-arriba", str(a.quitar_arriba), "--quitar-abajo", str(a.quitar_abajo)]
    extra += ["--espera", str(a.espera), "--bajar", str(a.bajar)]
    extra += [x for t in (a.clic or []) for x in ("--clic", t)] + [x for t in (a.ocultar or []) for x in ("--ocultar", t)]
    py("captura.py", a.reel, a.url, *extra)


def cmd_edl(a):
    py("edl_pro.py" if es_pro(a.reel, a) else "construir_edl.py", a.reel)


def tiempos_auto(reel):
    """Momentos que hay que mirar de un reel pro: cada pieza entrando, cada cosa recién encendida y cada pieza
    completa, más los subtítulos grandes."""
    from edl_pro import eventos
    edl = leer(EDITOR / "public" / "reels" / reel / "edl_pro.json")
    if not edl:
        sys.exit("Falta el EDL: ejecuta antes reel.py edl")
    ts = [0.0]
    for p in edl["piezas"]:
        ts += [p["i"] + 0.12, p["i"] + 0.5, p["f"] - 0.3]
        ts += [ev[1] + 0.4 for ev in eventos(p)]
    ts += [pag["i"] + 0.4 for pag in edl["paginas"] if "tam" in pag]
    salida = []
    for t in sorted(x for x in ts if 0 <= x < edl["duracion"] - 0.05):
        if not salida or t - salida[-1] >= 0.3:
            salida.append(round(t, 2))
    return [str(x) for x in salida]


def cmd_revisar(a):
    w = trabajo(a.reel)
    pro = es_pro(a.reel, a)
    tiempos = a.tiempos
    if not tiempos or tiempos == ["auto"]:
        if not pro:
            sys.exit("Indica los segundos que quieres ver: reel.py revisar <reel> 0.5 6.3 12.4 …")
        tiempos = tiempos_auto(a.reel)
        print(f"{len(tiempos)} fotogramas: " + " ".join(tiempos))
    carpeta = w / "revision"
    tmp = carpeta / "_tmp"
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir(parents=True)
    for vieja in carpeta.glob(f"{a.nombre}_*.jpg"):
        vieja.unlink()
    edl = f"reels/{a.reel}/edl_pro.json" if pro else f"reels/{a.reel}/edl.json"
    extra = ["--comp", "ReelPro" if pro else "Reel", "--escala", str(a.escala)] + (["--zonas"] if a.zonas and pro else [])
    limpiar_temporales()
    run([exe("node"), "scripts/fotogramas.mjs", edl, tmp, *tiempos, *extra], cwd=EDITOR)
    fotos = sorted(tmp.glob("f_*.jpg"))
    for k in range(0, len(fotos), a.por_hoja):
        grupo = fotos[k:k + a.por_hoja]
        entradas = [x for f in grupo for x in ("-i", str(f))]
        filtro = f"hstack=inputs={len(grupo)}" if len(grupo) > 1 else "null"
        hoja = carpeta / f"{a.nombre}_{k // a.por_hoja + 1}.jpg"
        subprocess.run([exe("ffmpeg"), "-hide_banner", "-loglevel", "error", "-y", *entradas, "-filter_complex", filtro,
                        "-frames:v", "1", "-q:v", "3", str(hoja)], check=True)
        print(f"  {hoja.relative_to(P)}  ←  " + ", ".join(f.stem[2:] + "s" for f in grupo))
    shutil.rmtree(tmp, ignore_errors=True)


def cmd_portada(a):
    """Imagen a tamaño completo para subirla como portada del reel (salida/<reel>_portada.jpg)."""
    w = trabajo(a.reel)
    tmp = w / "portada_tmp"
    shutil.rmtree(tmp, ignore_errors=True)
    if es_pro(a.reel, a):
        guion = leer(w / "guion_pro.json")
        edl = EDITOR / "public" / "reels" / a.reel / "edl_portada.json"
        if "portada" not in guion or not edl.exists():
            sys.exit('El guion no tiene "portada" (o falta reel.py edl): ver references/guion-pro.md')
        t = a.t if a.t is not None else guion["portada"]["t"]
        run([exe("node"), "scripts/fotogramas.mjs", f"reels/{a.reel}/edl_portada.json", tmp, str(t), "--escala", "1",
             "--comp", "ReelPro"], cwd=EDITOR)
    else:
        run([exe("node"), "scripts/fotogramas.mjs", f"reels/{a.reel}/edl.json", tmp, str(a.t if a.t is not None else 1.0),
             "--escala", "1"], cwd=EDITOR)
    destino = P / "salida" / f"{a.reel}_portada.jpg"
    destino.parent.mkdir(exist_ok=True)
    shutil.move(str(next(tmp.glob("f_*.jpg"))), destino)
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"LISTO: {destino}")


def medir_volumen(salida, imprimir=True):
    """Volumen integrado (LUFS) y pico real (dBFS) del archivo ya codificado. Devuelve (lufs, pico)."""
    r = subprocess.run([exe("ffmpeg"), "-hide_banner", "-nostats", "-i", str(salida), "-af", "ebur128=peak=true",
                        "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    i = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    pico = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)
    if imprimir:
        print(f"LISTO: {salida}  ·  volumen {i[-1] if i else '?'} LUFS (ideal ≈ -14), pico {pico[-1] if pico else '?'} dBFS")
    return (float(i[-1]) if i else None, float(pico[-1]) if pico else None)


def retraso_audio(render, base, seg=25):
    """Segundos que el sonido del render va por detrás del vídeo base (correlación de la voz, hasta 80 ms).
    0 si no se puede medir con claridad: en la duda no se toca."""
    import numpy as np
    sr = 16000

    def onda(v):
        raw = subprocess.run([exe("ffmpeg"), "-v", "error", "-i", str(v), "-t", str(seg), "-af", "pan=mono|c0=c0",
                              "-ar", str(sr), "-f", "f32le", "-"], capture_output=True).stdout
        return np.frombuffer(raw, np.float32)

    x, y = onda(base), onda(render)
    n = min(len(x), len(y))
    if n < sr * 3:
        return 0.0
    x, y = x[:n], y[:n]
    lags = range(-int(0.02 * sr), int(0.08 * sr) + 1)
    corr = [float(np.dot(x[: n - k], y[k:])) if k >= 0 else float(np.dot(x[-k:], y[: n + k])) for k in lags]
    mejor = int(np.argmax(corr))
    if corr[mejor] <= 0 or corr[mejor] < 0.5 * float(np.dot(x, x)):  # la voz no se reconoce: no se toca
        return 0.0
    tarde = lags[mejor] / sr
    return tarde if tarde >= 0.004 else 0.0


def cmd_render(a):
    w = trabajo(a.reel)
    pro = es_pro(a.reel, a)
    salida = P / "salida" / f"{a.reel}_{a.nombre}.mp4"
    salida.parent.mkdir(exist_ok=True)
    props = w / ("props_pro.json" if pro else "props.json")
    props.write_text(json.dumps({"edl": f"reels/{a.reel}/{'edl_pro' if pro else 'edl'}.json"}), encoding="utf-8")
    # --color-space=bt709: el vídeo sale marcado como vídeo estándar (yuv420p, BT.709). Sin ello sale como "rango
    # completo" sin etiquetar y en algunos reproductores cambian el contraste y los tonos.
    comun = [f"--props={props}", "--codec=h264", f"--crf={a.crf}", "--color-space=bt709"]
    if not pro:
        run_remotion([exe("npx"), "remotion", "render", "src/index.ts", "Reel", salida, *comun, "--audio-bitrate=192k"], cwd=EDITOR)
        return medir_volumen(salida)
    bruto = w / "_render.mp4"
    run_remotion([exe("npx"), "remotion", "render", "src/index.ts", "ReelPro", bruto, *comun, "--audio-codec=aac",
                  "--audio-bitrate=320k", "--log=error"], cwd=EDITOR)
    # Máster de sonido: la voz ya va a -14 LUFS; los efectos se suman encima, así que un limitador deja los picos
    # por debajo de -1 dB (sin él, la suma puede saturar) y un fundido de 0,2 s cierra las colas de los efectos.
    # El vídeo no se vuelve a codificar.
    dur = float(subprocess.run([exe("ffprobe"), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                str(bruto)], capture_output=True, text=True).stdout)
    # Remotion entrega el sonido unas centésimas tarde (el arranque del codificador de audio, ~43 ms): se mide
    # contra la voz del vídeo base y se adelanta lo mismo, para que labios, gráficos y sonido vayan a la vez.
    edl = leer(EDITOR / "public" / "reels" / a.reel / "edl_pro.json")
    tarde = retraso_audio(bruto, EDITOR / "public" / edl["video"])
    adelanto = f"atrim=start={tarde:.4f},asetpts=PTS-STARTPTS," if tarde else ""
    # Al codificar a AAC el pico real sube unas décimas sobre el techo del limitador: si pasa de -1 dB, se repite
    # el máster con el techo un poco más bajo (es solo el sonido: tarda un par de segundos).
    for limite in (0.87, 0.82, 0.77):
        run([exe("ffmpeg"), "-hide_banner", "-loglevel", "error", "-y", "-i", bruto, "-c:v", "copy",
             "-af", f"{adelanto}alimiter=limit={limite}:attack=2:release=60:level=disabled:latency=1,"
                    f"afade=t=out:st={dur - tarde - 0.2:.3f}:d=0.2",
             "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", salida])
        _, pico = medir_volumen(salida, imprimir=False)
        if pico is None or pico <= -1.0:
            break
    bruto.unlink()
    if tarde:
        print(f"Sonido adelantado {tarde * 1000:.0f} ms para cuadrarlo con la imagen")
    medir_volumen(salida)


def cmd_sonido(a):
    py("sonido.py", a.reel)


def cmd_tira(a):
    py("tira.py", a.video, a.desde, a.hasta, "--fps", str(a.fps), "--cols", str(a.cols), "--ancho", str(a.ancho),
       *(["--salida", a.salida] if a.salida else []))


def cmd_recolocar(a):
    py("recolocar.py", a.reel, *(["--desde", a.desde] if a.desde else []))


def main():
    ap = argparse.ArgumentParser(description="Editor de reels con motion graphics (Remotion)")
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("entorno")
    s.add_argument("--instalar", action="store_true")
    s.add_argument("--gpu", action="store_true")
    sub.add_parser("preparar")
    s = sub.add_parser("analizar")
    s.add_argument("video")
    s.add_argument("reel")
    s.add_argument("--nombres", default="")
    s.add_argument("--idioma", default="es")
    s = sub.add_parser("cortar")
    s.add_argument("reel")
    s.add_argument("--tramos", required=True)
    s.add_argument("--fps", type=int, default=None, help="por defecto, los fotogramas reales de la grabación (25, 24 o 30)")
    s.add_argument("--congelar-inicio", type=int, default=0, help="fotogramas del principio que se sustituyen por el siguiente (parpadeo)")
    s.add_argument("--clasico", action="store_true", help="crear el guion del modo clásico (guion.json)")
    s = sub.add_parser("alinear")
    s.add_argument("reel")
    s = sub.add_parser("logos")
    s.add_argument("nombres", nargs="+")
    s.add_argument("--domain", action="append")
    s.add_argument("--force", action="store_true")
    s = sub.add_parser("captura")
    s.add_argument("reel")
    s.add_argument("url")
    s.add_argument("--nombre", default="fuente")
    s.add_argument("--ancho", type=int, default=900)
    s.add_argument("--alto", type=int, default=1250)
    s.add_argument("--quitar-arriba", type=int, default=0)
    s.add_argument("--quitar-abajo", type=int, default=0)
    s.add_argument("--clic", action="append", help="texto de un botón que pulsar antes (rechazar las cookies opcionales)")
    s.add_argument("--ocultar", action="append", help="selector CSS de algo que tapa la página")
    s.add_argument("--espera", type=int, default=2500)
    s.add_argument("--bajar", type=int, default=0)
    s = sub.add_parser("edl")
    s.add_argument("reel")
    s.add_argument("--clasico", action="store_true")
    s = sub.add_parser("revisar")
    s.add_argument("reel")
    s.add_argument("tiempos", nargs="*", help="segundos, o «auto» (modo pro): todos los momentos que hay que mirar")
    s.add_argument("--escala", type=float, default=0.5)
    s.add_argument("--por-hoja", type=int, default=4)
    s.add_argument("--nombre", default="hoja")
    s.add_argument("--zonas", action="store_true", help="dibujar lo que tapa la interfaz de Instagram (modo pro)")
    s.add_argument("--clasico", action="store_true")
    s = sub.add_parser("sonido")
    s.add_argument("reel")
    s = sub.add_parser("render")
    s.add_argument("reel")
    s.add_argument("--nombre", default="v1")
    s.add_argument("--crf", default="18")
    s.add_argument("--clasico", action="store_true")
    s = sub.add_parser("portada")
    s.add_argument("reel")
    s.add_argument("t", nargs="?", type=float, default=None)
    s.add_argument("--clasico", action="store_true")
    s = sub.add_parser("tira")
    s.add_argument("video")
    s.add_argument("desde")
    s.add_argument("hasta")
    s.add_argument("--fps", type=float, default=10)
    s.add_argument("--cols", type=int, default=8)
    s.add_argument("--ancho", type=int, default=250)
    s.add_argument("--salida", default=None)
    s = sub.add_parser("recolocar")
    s.add_argument("reel")
    s.add_argument("--desde", default=None)
    a = ap.parse_args()
    {"entorno": cmd_entorno, "preparar": cmd_preparar, "analizar": cmd_analizar, "cortar": cmd_cortar, "alinear": cmd_alinear,
     "logos": cmd_logos, "captura": cmd_captura, "edl": cmd_edl, "revisar": cmd_revisar, "sonido": cmd_sonido,
     "render": cmd_render, "portada": cmd_portada, "tira": cmd_tira, "recolocar": cmd_recolocar}[a.cmd](a)


if __name__ == "__main__":
    main()
