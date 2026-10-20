"""Captura una página web (la fuente oficial de la noticia) para enseñarla en el reel dentro de una ventana.

Uso (desde la carpeta del proyecto):
    python captura.py <reel> <url> [--nombre fuente] [--ancho 900] [--alto 1250] [--quitar-arriba 0] [--quitar-abajo 0]
                      [--clic "Decline optional cookies"] [--ocultar "selector css"] [--espera 2500] [--bajar 0]

Usa el navegador que Remotion ya tiene instalado en el proyecto (Chrome Headless Shell). Guarda la captura
original en trabajo/<reel>/capturas/<nombre>.png y la versión para el reel en
editor/public/reels/<reel>/media/<nombre>.jpg, e imprime el ancho y el alto que hay que poner en el guion.
--quitar-arriba / --quitar-abajo recortan píxeles (de la captura, que va al doble de tamaño) para quitar un aviso
de cookies o una barra. Si el aviso tapa toda la página, --clic pulsa antes un botón por su texto (siempre el de
rechazar las cookies opcionales, nunca el de aceptarlas) y --ocultar quita elementos por su selector; --bajar
desplaza la página esos píxeles y --espera son los milisegundos que se deja cargar (hace falta Node 22 o superior).
Mira siempre la captura antes de usarla: que sea la página correcta y se lea.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

P = Path.cwd()


def navegador():
    base = P / "editor" / "node_modules" / ".remotion"
    for nombre in ("chrome-headless-shell.exe", "chrome-headless-shell"):
        hallados = sorted(base.rglob(nombre))
        if hallados:
            return hallados[0]
    sys.exit("No encuentro el navegador de Remotion. Ejecuta antes: reel.py preparar")


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("reel")
    ap.add_argument("url")
    ap.add_argument("--nombre", default="fuente")
    ap.add_argument("--ancho", type=int, default=900)
    ap.add_argument("--alto", type=int, default=1250)
    ap.add_argument("--quitar-arriba", type=int, default=0)
    ap.add_argument("--quitar-abajo", type=int, default=0)
    ap.add_argument("--clic", action="append", default=[], help="texto de un botón que hay que pulsar antes (rechazar cookies)")
    ap.add_argument("--ocultar", action="append", default=[], help="selector CSS de algo que tapa la página")
    ap.add_argument("--espera", type=int, default=2500, help="milisegundos que se deja cargar la página")
    ap.add_argument("--bajar", type=int, default=0, help="píxeles que se desplaza la página antes de capturar")
    a = ap.parse_args()

    original = P / "trabajo" / a.reel / "capturas" / f"{a.nombre}.png"
    original.parent.mkdir(parents=True, exist_ok=True)
    original.unlink(missing_ok=True)
    if a.clic or a.ocultar or a.bajar:
        # Hay que tocar la página antes de la foto: se maneja el navegador desde Node (captura_cdp.mjs)
        orden = ["node", str(Path(__file__).with_name("captura_cdp.mjs")), str(navegador()), a.url, str(original),
                 str(a.ancho), str(a.alto), "--espera", str(a.espera), "--bajar", str(a.bajar)]
        for texto in a.clic:
            orden += ["--clic", texto]
        for sel in a.ocultar:
            orden += ["--ocultar", sel]
        r = subprocess.run(orden, capture_output=True, text=True, encoding="utf-8", errors="replace")
        print(r.stdout.strip())
    else:
        r = subprocess.run([str(navegador()), "--headless", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=2",
                            f"--window-size={a.ancho},{a.alto}", "--virtual-time-budget=9000", f"--screenshot={original}", a.url],
                           capture_output=True, text=True, encoding="utf-8", errors="replace")
    if not original.exists():
        print(r.stderr[-1500:])
        sys.exit("No se ha podido capturar la página (¿pide iniciar sesión o bloquea navegadores automáticos?). "
                 "Alternativa: una captura hecha a mano, guardada en editor/public/reels/<reel>/media/.")
    destino = P / "editor" / "public" / "reels" / a.reel / "media" / f"{a.nombre}.jpg"
    destino.parent.mkdir(parents=True, exist_ok=True)
    quitar = a.quitar_arriba + a.quitar_abajo
    recorte = f"crop=iw:ih-{quitar}:0:{a.quitar_arriba}" if quitar else "null"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(original), "-vf", recorte, "-q:v", "3", str(destino)], check=True)
    info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                                      "-of", "json", str(destino)], capture_output=True, text=True).stdout)["streams"][0]
    print(f"Original: {original.relative_to(P)}")
    print(f"Para el reel: {destino.relative_to(P)}")
    print(f'En el guion: "captura": {{"src": "reels/{a.reel}/media/{a.nombre}.jpg", "ancho": {info["width"]}, '
          f'"alto": {info["height"]}, "dominio": "…", "ruta": "/…", "scrollEn": 0, "scrollDur": 1.5}}')


if __name__ == "__main__":
    main()
