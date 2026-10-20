"""Transcribe un audio con marcas de tiempo por palabra (faster-whisper), en la GPU si la hay.

Uso:
    python transcribir.py audio16k.wav transcripcion.json [--modelo large-v3] [--idioma es]
                          [--nombres "Claude, n8n, Gemini"] [--cpu]

Guarda palabras con tiempos y las zonas donde el detector de voz (VAD) oye habla. Las zonas con
voz pero sin palabras suelen ser muletillas ("eh", "mmm") que Whisper no escribe.
Sin GPU (o si falla) pasa sola a la CPU con el modelo "medium", más rápido. El modelo se descarga
la primera vez (large-v3 ~3 GB, medium ~1,5 GB).
"""
import argparse
import glob
import json
import os
import sys
import time


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


def transcribir(audio, modelo, device, idioma, prompt):
    from faster_whisper import WhisperModel

    compute = "float16" if device == "cuda" else "int8"
    try:
        model = WhisperModel(modelo, device=device, compute_type=compute, local_files_only=True)
    except Exception:
        print(f"Descargando el modelo {modelo} (solo la primera vez)...", file=sys.stderr)
        model = WhisperModel(modelo, device=device, compute_type=compute)
    segments, info = model.transcribe(audio, language=idioma, word_timestamps=True, beam_size=5,
                                      vad_filter=False, condition_on_previous_text=False,
                                      initial_prompt=prompt or None)
    segs, words = [], []
    for s in segments:  # la transcripción ocurre al recorrer: aquí saltan los errores de GPU
        segs.append({"start": round(s.start, 3), "end": round(s.end, 3), "text": s.text.strip()})
        for w in s.words or []:
            words.append({"start": round(w.start, 3), "end": round(w.end, 3), "word": w.word.strip(),
                          "prob": round(w.probability, 3)})
    return info, segs, words


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("salida")
    ap.add_argument("--modelo", default=None, help="por defecto large-v3 en GPU y medium en CPU")
    ap.add_argument("--idioma", default="es")
    ap.add_argument("--nombres", default="", help="nombres propios que aparecen (ayuda a escribirlos bien)")
    ap.add_argument("--cpu", action="store_true")
    args = ap.parse_args()

    prompt = "Eh, bueno, mmm..." if args.idioma == "es" else ""
    if args.nombres:
        prompt += f" Se habla de {args.nombres}."

    t0 = time.time()
    device = "cpu"
    if not args.cpu:
        preparar_cuda()
        try:
            info, segs, words = transcribir(args.audio, args.modelo or "large-v3", "cuda", args.idioma, prompt)
            device = "cuda"
        except Exception as e:
            print(f"[aviso] sin GPU para Whisper ({e.__class__.__name__}); sigo con la CPU", file=sys.stderr)
    if device == "cpu":
        info, segs, words = transcribir(args.audio, args.modelo or "medium", "cpu", args.idioma, prompt)

    from faster_whisper.audio import decode_audio
    from faster_whisper.vad import VadOptions, get_speech_timestamps

    audio = decode_audio(args.audio, sampling_rate=16000)
    speech = get_speech_timestamps(audio, VadOptions(threshold=0.5, min_silence_duration_ms=120, speech_pad_ms=20))
    speech = [{"start": round(x["start"] / 16000, 3), "end": round(x["end"] / 16000, 3)} for x in speech]

    out = {"idioma": info.language, "duracion": round(info.duration, 3), "segmentos": segs, "palabras": words,
           "voz": speech, "dispositivo": device}
    os.makedirs(os.path.dirname(os.path.abspath(args.salida)), exist_ok=True)
    with open(args.salida, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"OK: {len(words)} palabras, {len(speech)} zonas de voz, {time.time() - t0:.1f}s ({device})")


if __name__ == "__main__":
    main()
