"""Tira de fotogramas de un vídeo ya renderizado (para revisar una transición fotograma a fotograma).

Uso: python tira.py <video> <desde> <hasta> [--fps 10] [--cols 8] [--ancho 250] [--salida ruta.jpg]
"""
import os
import subprocess
import sys
from pathlib import Path

FUENTES = [r"C:\Windows\Fonts\arialbd.ttf", "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
           "/System/Library/Fonts/Helvetica.ttc", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
           "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf"]


def main():
    args = sys.argv[1:]

    def opcion(nombre, defecto):
        if nombre in args:
            k = args.index(nombre)
            v = args[k + 1]
            del args[k:k + 2]
            return v
        return defecto

    fps = float(opcion("--fps", "10"))
    cols = int(opcion("--cols", "8"))
    ancho = int(opcion("--ancho", "250"))
    salida = opcion("--salida", None)
    video, a, b = args[0], float(args[1]), float(args[2])
    salida = salida or str(Path(video).with_name(f"tira_{a:06.2f}.jpg"))
    n = max(1, int(round((b - a) * fps)))
    filas = -(-n // cols)
    vf = f"fps={fps}:round=down,scale={ancho}:-1,"
    # El reloj de cada fotograma. Sin una fuente con ruta explícita, drawtext se cae en Windows (Fontconfig).
    fuente = next((f for f in FUENTES if os.path.exists(f)), None)
    if fuente:
        ruta = fuente.replace("\\", "/").replace(":", r"\:")
        reloj = r"%{pts\:hms\:" + str(a) + "}"
        vf += f"drawtext=fontfile='{ruta}':text='{reloj}':x=4:y=4:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.7,"
    vf += f"tile={cols}x{filas}"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(a), "-t", str(b - a), "-i", video, "-vf", vf,
                    "-frames:v", "1", "-q:v", "3", salida], check=True)
    print(salida)


if __name__ == "__main__":
    main()
