"""Comprueba (y con --instalar, instala) lo que necesita la skill editor-reels.

Uso:
    python entorno.py                     solo comprobar
    python entorno.py --instalar          instalar lo que falte
    python entorno.py --instalar --gpu    además, librerías CUDA para transcribir en una GPU NVIDIA

Necesario: ffmpeg y ffprobe, Node.js 18 o superior (con npm), Python 3.9 o superior con
faster-whisper, opencv-python y numpy.
Recomendado: PyTorch (torch y torchaudio) para la alineación exacta de cada palabra, que es lo que hace que las
animaciones del modo pro entren en la sílaba que toca (sin él se usan los tiempos de Whisper, menos precisos).
Opcional: GPU NVIDIA (transcripción y codificación rápidas).
Instala con winget (Windows), Homebrew (macOS) o apt (Linux), y pip para Python.
"""
import argparse
import importlib.util
import os
import platform
import re
import shutil
import subprocess
import sys

SO = platform.system()  # Windows, Darwin o Linux


def asegurar_path():
    """Añade al PATH de esta sesión las rutas típicas de ffmpeg y Node (útil justo después de instalar)."""
    extra = []
    if SO == "Windows":
        local = os.environ.get("LOCALAPPDATA", "")
        extra += [os.path.join(local, "Microsoft", "WinGet", "Links"), r"C:\Program Files\nodejs", r"C:\ffmpeg\bin"]
    elif SO == "Darwin":
        extra += ["/opt/homebrew/bin", "/usr/local/bin"]
    for d in extra:
        if d and os.path.isdir(d) and d not in os.environ.get("PATH", ""):
            os.environ["PATH"] = os.environ.get("PATH", "") + os.pathsep + d


def programa(cmd, flag="--version"):
    ruta = shutil.which(cmd)
    if not ruta:
        return None, None
    try:
        out = subprocess.run([ruta, flag], capture_output=True, text=True, timeout=30,
                             shell=SO == "Windows" and ruta.lower().endswith((".cmd", ".bat"))).stdout
    except Exception:
        return ruta, "?"
    m = re.search(r"(\d+)\.(\d+)(\.\d+)?", out or "")
    return ruta, (m.group(0) if m else "?")


def modulo(nombre):
    return importlib.util.find_spec(nombre) is not None


def comprobar():
    asegurar_path()
    filas = []  # (componente, ok, detalle, necesario)
    for cmd in ("ffmpeg", "ffprobe"):
        ruta, v = programa(cmd, "-version")
        filas.append((cmd, bool(ruta), f"{v} ({ruta})" if ruta else "no encontrado", True))
    ruta, v = programa("node")
    mayor = int(v.split(".")[0]) if v and v[0].isdigit() else 0
    filas.append(("node", bool(ruta) and mayor >= 18, f"v{v}" + ("" if mayor >= 18 else " (hace falta 18 o más)") if ruta else "no encontrado", True))
    ruta, v = programa("npm")
    filas.append(("npm", bool(ruta), v or "no encontrado", True))
    py_ok = sys.version_info >= (3, 9)
    filas.append(("python", py_ok, platform.python_version(), True))
    for mod, pip in (("faster_whisper", "faster-whisper"), ("cv2", "opencv-python"), ("numpy", "numpy")):
        ok = modulo(mod)
        det = "instalado" if ok else f"falta (pip install {pip})"
        if ok and mod == "cv2":
            import cv2
            ok = hasattr(cv2, "FaceDetectorYN")
            det = f"OpenCV {cv2.__version__}" + ("" if ok else " (demasiado antiguo: falta FaceDetectorYN)")
        filas.append((pip, ok, det, True))
    # Recomendado y opcionales
    exacta = modulo("torch") and modulo("torchaudio")
    filas.append(("torch + torchaudio", exacta, "listo (alineación exacta de cada palabra)" if exacta else
                  "faltan: las animaciones irán con tiempos aproximados (se instalan con --instalar)", False))
    gpu = shutil.which("nvidia-smi")
    filas.append(("GPU NVIDIA", bool(gpu), "sí" if gpu else "no (se usará la CPU: más lento)", False))
    if gpu and modulo("ctranslate2"):
        cuda_libs = modulo("torch") or modulo("nvidia.cublas") or SO != "Windows"
        filas.append(("CUDA para Whisper", cuda_libs, "listo" if cuda_libs else "faltan cuBLAS/cuDNN (--instalar --gpu)", False))
    return filas


def mostrar(filas):
    ancho = max(len(f[0]) for f in filas)
    for nombre, ok, det, necesario in filas:
        marca = "OK " if ok else ("FALTA" if necesario else "--  ")
        print(f"  {marca:5} {nombre.ljust(ancho)}  {det}")


def ejecutar(cmd):
    print("→", " ".join(cmd), flush=True)
    return subprocess.run(cmd).returncode == 0


def instalar(filas, gpu):
    faltan = {f[0] for f in filas if not f[1] and f[3]}
    hechos = True
    if faltan & {"ffmpeg", "ffprobe"}:
        if SO == "Windows":
            hechos &= ejecutar(["winget", "install", "--id", "Gyan.FFmpeg", "-e", "--accept-source-agreements",
                                "--accept-package-agreements"])
        elif SO == "Darwin":
            hechos &= ejecutar(["brew", "install", "ffmpeg"])
        else:
            hechos &= ejecutar(["sudo", "apt-get", "install", "-y", "ffmpeg"])
    if faltan & {"node", "npm"}:
        if SO == "Windows":
            hechos &= ejecutar(["winget", "install", "--id", "OpenJS.NodeJS.LTS", "-e", "--accept-source-agreements",
                                "--accept-package-agreements"])
        elif SO == "Darwin":
            hechos &= ejecutar(["brew", "install", "node"])
        else:
            print("  Node.js: instala la versión LTS con nvm (https://github.com/nvm-sh/nvm) o desde nodejs.org")
            hechos = False
    paquetes = [p for p in ("faster-whisper", "opencv-python", "numpy") if p in faltan]
    if paquetes:
        hechos &= ejecutar([sys.executable, "-m", "pip", "install", "--upgrade", *paquetes])
    if gpu and shutil.which("nvidia-smi") and SO in ("Windows", "Linux") and not modulo("torch"):
        hechos &= ejecutar([sys.executable, "-m", "pip", "install", "nvidia-cublas-cu12", "nvidia-cudnn-cu12"])
    if not (modulo("torch") and modulo("torchaudio")):
        # Alineación exacta de palabras (modo pro). Con la CPU basta: alinear un reel tarda unos segundos.
        print("  PyTorch (torch y torchaudio): varios cientos de MB; la primera alineación baja además un modelo de 1,2 GB")
        if not ejecutar([sys.executable, "-m", "pip", "install", "torch", "torchaudio"]):
            print("  [aviso] no se ha podido instalar PyTorch: el modo pro funcionará con tiempos aproximados")
    if faltan & {"python"}:
        print("  Python: instala Python 3.9 o superior desde python.org y vuelve a lanzar la skill")
        hechos = False
    return hechos


def main():
    ap = argparse.ArgumentParser(description="Comprueba e instala lo que necesita editor-reels")
    ap.add_argument("--instalar", action="store_true")
    ap.add_argument("--gpu", action="store_true", help="instalar también las librerías CUDA para Whisper")
    args = ap.parse_args()

    print(f"Sistema: {SO} {platform.release()} · Python {platform.python_version()}")
    filas = comprobar()
    mostrar(filas)
    faltan = [f for f in filas if not f[1] and f[3]]
    sin_exacta = not (modulo("torch") and modulo("torchaudio"))
    if not faltan and not (args.instalar and (args.gpu or sin_exacta)):
        print("Todo listo." + (" (Recomendado: --instalar para añadir PyTorch y tener la alineación exacta.)" if sin_exacta else ""))
        return 0
    if not args.instalar:
        print(f"Faltan {len(faltan)} cosas. Ejecuta con --instalar para instalarlas.")
        return 1
    instalar(filas, args.gpu)
    print("\nComprobación después de instalar:")
    filas = comprobar()
    mostrar(filas)
    faltan = [f for f in filas if not f[1] and f[3]]
    if faltan:
        print("Sigue faltando algo. Si acabas de instalar ffmpeg o Node en Windows, cierra y vuelve a abrir "
              "la terminal (o Claude) para que se actualice el PATH.")
        return 1
    print("Todo listo.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
