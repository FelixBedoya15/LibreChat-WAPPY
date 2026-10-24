"""Comprueba (y con --instalar, instala) lo que necesita la skill animaciones-horizontal-combinadas.

Necesario:  ffmpeg y ffprobe · Node.js 18+ con npm · Chromium de Playwright · Python 3.9+ con
            numpy, faster-whisper (texto de la voz), torch y torchaudio (alineación forzada MMS_FA).
Opcional:   GPU NVIDIA (transcribe y alinea mucho más rápido).
            opencv-python (encuadre de la cara en intros a cámara), scipy, scikit-image, matplotlib y Pillow
            (anim.py logo-trazo, anim.py mapa, anim.py planos --hoja). Se instalan con --instalar.
"""
import argparse
import importlib.util
import os
import platform
import re
import shutil
import subprocess
import sys
from pathlib import Path

SO = platform.system()


def asegurar_path():
    extra = []
    if SO == "Windows":
        local = os.environ.get("LOCALAPPDATA", "")
        extra += [os.path.join(local, "Microsoft", "WinGet", "Links"), r"C:\Program Files\nodejs", r"C:\ffmpeg\bin"]
    elif SO == "Darwin":
        extra += ["/opt/homebrew/bin", "/usr/local/bin"]
    for d in extra:
        if d and os.path.isdir(d) and d not in os.environ.get("PATH", ""):
            os.environ["PATH"] = os.environ.get("PATH", "") + os.pathsep + d


def version(cmd, flag="--version"):
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


def modulo(n):
    return importlib.util.find_spec(n) is not None


def chromium_playwright():
    bases = []
    if SO == "Windows":
        bases.append(Path(os.environ.get("LOCALAPPDATA", "")) / "ms-playwright")
    elif SO == "Darwin":
        bases.append(Path.home() / "Library" / "Caches" / "ms-playwright")
    else:
        bases.append(Path.home() / ".cache" / "ms-playwright")
    if os.environ.get("PLAYWRIGHT_BROWSERS_PATH"):
        bases.insert(0, Path(os.environ["PLAYWRIGHT_BROWSERS_PATH"]))
    for b in bases:
        if b.is_dir() and any(p.name.startswith("chromium") for p in b.iterdir()):
            return str(b)
    return None


def comprobar():
    asegurar_path()
    filas = []   # (componente, ok, detalle, cómo instalar)
    for cmd in ("ffmpeg", "ffprobe"):
        r, v = version(cmd, "-version")
        filas.append((cmd, bool(r), v or "no encontrado", "winget install Gyan.FFmpeg / brew install ffmpeg"))
    r, v = version("node")
    ok = bool(r) and v != "?" and int(v.split(".")[0]) >= 18
    filas.append(("node 18+", ok, v or "no encontrado", "winget install OpenJS.NodeJS.LTS / brew install node"))
    r, v = version("npm")
    filas.append(("npm", bool(r), v or "no encontrado", "viene con Node.js"))
    ch = chromium_playwright()
    filas.append(("Chromium (Playwright)", bool(ch), ch or "no encontrado", "npx playwright install chromium"))
    for m, pip in (("numpy", "numpy"), ("faster_whisper", "faster-whisper"), ("torch", "torch"), ("torchaudio", "torchaudio")):
        filas.append((f"python: {m}", modulo(m), "ok" if modulo(m) else "falta", f"pip install {pip}"))
    gpu = "no comprobada"
    if modulo("torch"):
        try:
            import torch
            gpu = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "sin GPU CUDA (irá en la CPU, más lento)"
        except Exception as e:
            gpu = f"error: {e}"
    return filas, gpu


OPCIONALES = (("cv2", "opencv-python", "intros a cámara: encuadre de la cara; capas: recorte"), ("scipy", "scipy", "logo-trazo"),
              ("skimage", "scikit-image", "logo-trazo"), ("matplotlib", "matplotlib", "mapa"), ("PIL", "pillow", "planos --hoja, mapa"),
              ("soundfile", "soundfile", "efectos y música (anim.py sonido)"))


def instalar(filas):
    faltan = [f for f in filas if not f[1]]
    for nombre, _, _, como in faltan:
        if nombre.startswith("python: "):
            mod = nombre.split(": ")[1]
            pkgs = {"faster_whisper": ["faster-whisper"], "numpy": ["numpy"], "torch": ["torch", "torchaudio"]}.get(mod)
            if mod == "torchaudio":
                # torchaudio tiene que coincidir con el torch instalado (y con su CUDA)
                try:
                    import torch
                    cuda = (torch.version.cuda or "").replace(".", "")
                    base = torch.__version__.split("+")[0]
                    idx = f"https://download.pytorch.org/whl/cu{cuda}" if cuda else "https://download.pytorch.org/whl/cpu"
                    cmd = [sys.executable, "-m", "pip", "install", f"torchaudio", "--index-url", idx]
                    print(f"torch {base}: instalando torchaudio compatible desde {idx}")
                    subprocess.call(cmd)
                    continue
                except Exception:
                    pkgs = ["torchaudio"]
            if pkgs:
                subprocess.call([sys.executable, "-m", "pip", "install", *pkgs])
        elif nombre.startswith("Chromium"):
            subprocess.call("npx -y playwright install chromium", shell=True)
        else:
            print(f"Instálalo a mano: {nombre} -> {como}")


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--instalar", action="store_true")
    a = ap.parse_args()
    filas, gpu = comprobar()
    for nombre, ok, det, _ in filas:
        print(f"{'OK ' if ok else 'FALTA'}  {nombre:<24} {det}")
    print(f"GPU    {gpu}")
    rvm = Path.home() / ".cache" / "animaciones-con-voz" / "rvm_resnet50_fp32.torchscript"
    print(f"{'OK ' if rvm.is_file() else 'luego'}  modelo de recorte (capas)  " + ("descargado" if rvm.is_file() else
          "se descarga la primera vez que se usa 'anim.py recortar' (108 MB)"))
    faltan_op = [(m, pip, uso) for m, pip, uso in OPCIONALES if not modulo(m)]
    for m, pip, uso in OPCIONALES:
        print(f"{'OK ' if modulo(m) else 'falta'}  python: {m:<16} opcional ({uso})")
    if faltan_op and a.instalar:
        subprocess.call([sys.executable, "-m", "pip", "install", *[pip for _, pip, _ in faltan_op]])
    faltan = [f for f in filas if not f[1]]
    if not faltan:
        print("\nTodo listo.")
        return 0
    if a.instalar:
        instalar(filas)
        return 0
    print("\nFalta algo: ejecuta 'python anim.py entorno --instalar' (o instala a mano lo indicado).")
    for nombre, _, _, como in faltan:
        print(f"  {nombre}: {como}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
