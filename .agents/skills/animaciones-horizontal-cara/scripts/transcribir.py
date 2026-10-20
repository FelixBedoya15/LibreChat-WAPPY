"""Transcribe la locución con faster-whisper (GPU si la hay) para tener el TEXTO de la voz.

Uso:
    python transcribir.py <audio> --salida trabajo [--nombres "Claude Opus 5.5, GPT-6 Astra"] [--modelo large-v3] [--cpu]

Escribe:
    trabajo/transcripcion.json   segmentos y palabras con los tiempos de Whisper (aproximados)
    trabajo/guion.txt            una frase por línea: CORRÍGELO (nombres propios, cifras) y luego ejecuta alinear

Ojo: Whisper suele adelantar las palabras 0,2–0,45 s (la primera palabra de cada frase se come el silencio
anterior). Sus tiempos solo sirven de orientación: los buenos salen de alinear.py (alineación forzada).
El modelo se descarga la primera vez (large-v3 ~3 GB).
"""
import argparse
import glob
import json
import os
import sys
from pathlib import Path


def preparar_cuda():
    """En Windows, ctranslate2 necesita las DLL de cuBLAS/cuDNN: las toma de PyTorch o de los paquetes nvidia-* de pip."""
    dirs = []
    try:
        import torch  # noqa: F401
        dirs.append(os.path.join(os.path.dirname(torch.__file__), "lib"))
    except Exception:
        pass
    try:
        import nvidia
        for base in list(getattr(nvidia, "__path__", [])):
            dirs += glob.glob(os.path.join(base, "*", "bin"))
    except Exception:
        pass
    for d in dirs:
        if os.path.isdir(d):
            try:
                os.add_dll_directory(d)
            except (AttributeError, OSError):
                pass
            os.environ["PATH"] = d + os.pathsep + os.environ.get("PATH", "")


def transcribir(audio, modelo, device, prompt):
    from faster_whisper import WhisperModel
    compute = "float16" if device == "cuda" else "int8"
    try:
        model = WhisperModel(modelo, device=device, compute_type=compute, local_files_only=True)
    except Exception:
        print(f"Descargando el modelo {modelo} (solo la primera vez)...", file=sys.stderr)
        model = WhisperModel(modelo, device=device, compute_type=compute)
    segments, _ = model.transcribe(audio, language="es", word_timestamps=True, beam_size=5, vad_filter=False,
                                   condition_on_previous_text=False, initial_prompt=prompt or None)
    segs, words = [], []
    for s in segments:   # la transcripción ocurre al recorrer: aquí saltan los errores de GPU
        segs.append({"start": round(s.start, 3), "end": round(s.end, 3), "text": s.text.strip()})
        for w in s.words or []:
            words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 3)})
    return segs, words


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("--salida", default="trabajo")
    ap.add_argument("--nombres", default="", help="nombres propios que salen en la voz, separados por comas")
    ap.add_argument("--modelo", default="")
    ap.add_argument("--cpu", action="store_true")
    a = ap.parse_args()
    prompt = f"Nombres que aparecen: {a.nombres}." if a.nombres else ""
    out = Path(a.salida); out.mkdir(parents=True, exist_ok=True)

    segs = words = None
    if not a.cpu:
        preparar_cuda()
        try:
            segs, words = transcribir(a.audio, a.modelo or "large-v3", "cuda", prompt)
        except Exception as e:
            print(f"GPU no disponible o falló ({str(e)[:120]}); sigo en la CPU con el modelo medium.", file=sys.stderr)
    if segs is None:
        segs, words = transcribir(a.audio, a.modelo or "medium", "cpu", prompt)

    json.dump({"segmentos": segs, "palabras": words}, open(out / "transcripcion.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    # guion_whisper.txt = lo último que oyó Whisper; guion.txt = el que corriges tú.
    # guion.txt solo se reescribe si aún no lo has tocado (igual a la transcripción anterior): así una
    # segunda pasada con --nombres mejora el texto sin pisar tus correcciones.
    texto = "\n".join(s["text"] for s in segs) + "\n"
    guion, previo = out / "guion.txt", out / "guion_whisper.txt"
    sin_tocar = not guion.exists() or (previo.exists() and guion.read_text(encoding="utf-8") == previo.read_text(encoding="utf-8"))
    previo.write_text(texto, encoding="utf-8")
    if sin_tocar:
        guion.write_text(texto, encoding="utf-8")
    else:
        print(f"(guion.txt ya estaba corregido: no lo toco; la nueva transcripción está en {previo})")

    for s in segs:
        print(f"[{s['start']:6.2f}-{s['end']:6.2f}] {s['text']}")
    dudosas = [w for w in words if w["p"] < 0.6]
    if dudosas:
        print("\nPalabras dudosas (probabilidad < 0,6): " + ", ".join(f"{w['w']}@{w['s']:.2f}" for w in dudosas))
    print(f"\n{len(words)} palabras -> {out / 'transcripcion.json'}\nTexto para corregir -> {guion}")
    sig = "anim.py alinear --toma" if out.name == "edicion" else "anim.py alinear"
    print(f"Corrige nombres y cifras en ese archivo (una frase por línea) y ejecuta: {sig}")
    print("Si Whisper escribió mal nombres propios, repite con --nombres \"Nombre 1, Nombre 2\" (no pisa un guion ya corregido).")


if __name__ == "__main__":
    main()
