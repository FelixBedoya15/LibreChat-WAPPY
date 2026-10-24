"""Construye la biblioteca de efectos de sonido de la skill (<skill>/sonidos/ + sonidos.json).

    python biblioteca_sonidos.py            (solo hace falta al cambiar la biblioteca; el resultado ya va en la skill)

Dos orígenes:
- Sintetizados aquí (numpy): sin derechos de nadie, estilo «minimalista y de intriga» (golpe grave, aire, tick, nota,
  swell, descarte, corte, bip). Se regeneran idénticos.
- Pixabay (Pixabay Content License: uso comercial sin atribución), tomados de la skill media-use si está instalada.

A todos: 48 kHz estéreo, sin silencio inicial, pico a −1 dBFS, y se mide dónde está el golpe («pico», en s desde el
inicio) y el nivel «activo» (RMS donde suena). La ganancia por defecto de cada uno (gain_db) deja todos los de una
misma familia al mismo nivel percibido bajo una voz a −16 LUFS (ver references/sonido.md).
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 48000
SKILL = Path(__file__).resolve().parent.parent
OUT = SKILL / "sonidos"
PIXABAY = Path.home() / ".claude" / "skills" / "media-use" / "audio" / "assets" / "sfx"
rng = np.random.default_rng(20260929)

# nivel activo objetivo por familia (dBFS). La voz a −16 LUFS habla a ~−19 dBFS de RMS: los efectos quedan por
# debajo (el golpe grave se siente más de lo que mide) y ninguno pasa de PICO_MAX: nunca tapan una palabra.
OBJETIVO = {"golpe": -23, "aire": -27, "tick": -30, "nota": -28, "aviso": -27, "tecla": -30, "subida": -26,
            "glitch": -30, "error": -28, "corte": -27}
PICO_MAX = -9.0


def t_(d):
    return np.arange(int(SR * d)) / SR


def env_ad(n, a, tau):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / tau)


def ruido(n, color="rosa"):
    x = rng.standard_normal(n)
    if color == "rosa":                  # 1/f aproximado con un filtro de Voss simplificado
        b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
        a = [1, -2.494956002, 2.017265875, -0.522189400]
        from scipy.signal import lfilter
        x = lfilter(b, a, x)
    return x / (np.abs(x).max() + 1e-9)


def banda(x, f_lo, f_hi):
    from scipy.signal import butter, sosfilt
    sos = butter(2, [max(20, f_lo), min(SR / 2 - 100, f_hi)], btype="band", fs=SR, output="sos")
    return sosfilt(sos, x)


def barrido_ruido(d, f0, f1, f2, pico):
    """ruido filtrado cuya frecuencia central va f0 -> f1 (en el pico) -> f2; envolvente en campana"""
    n = int(SR * d)
    x = ruido(n, "blanco")
    out = np.zeros(n)
    bloque = 480
    t = np.arange(n) / SR
    fc = np.where(t < pico, f0 * (f1 / f0) ** (t / pico), f1 * (f2 / f1) ** ((t - pico) / (d - pico)))
    from scipy.signal import butter, sosfilt
    for i in range(0, n, bloque):
        c = fc[min(n - 1, i + bloque // 2)]
        sos = butter(2, [c / 1.9, min(SR / 2 - 200, c * 1.9)], btype="band", fs=SR, output="sos")
        out[i:i + bloque] = sosfilt(sos, x[max(0, i - 2000):i + bloque])[-len(x[i:i + bloque]):]
    e = np.where(t < pico, (t / pico) ** 2.2, np.exp(-(t - pico) / ((d - pico) / 3.2)))
    return out * e


def estereo(x, pan=0.0, ancho=0.0):
    """pan -1..1; ancho = pequeño retardo entre canales (s) para dar amplitud"""
    l, r = x * np.sqrt((1 - pan) / 2) * 1.414, x * np.sqrt((1 + pan) / 2) * 1.414
    if ancho:
        k = int(ancho * SR)
        r = np.concatenate([np.zeros(k), r[:-k]])
    return np.stack([l, r], 1)


def sintetizados():
    s = {}
    # golpe grave: seno que cae 72 -> 38 Hz, ataque con un clic suave, cola larga
    d = 1.6; t = t_(d)
    f = 38 + 34 * np.exp(-t / .09)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env_ad(len(t), .004, .42) + .25 * np.sin(2 * ph) * env_ad(len(t), .004, .12)
    clic = banda(ruido(len(t), "blanco"), 1500, 6000) * env_ad(len(t), .0008, .006) * .35
    s["golpe"] = (estereo(x + clic), "golpe", "Golpe grave limpio (sub-hit): un nombre, un logo o una cifra que entra con fuerza; titular gigante.")
    # golpe corto: más seco, para acentos repetidos
    d = .7; t = t_(d)
    f = 45 + 40 * np.exp(-t / .05)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(t), .003, .16)
    s["golpe-corto"] = (estereo(x + banda(ruido(len(t), "blanco"), 2000, 7000) * env_ad(len(t), .0006, .004) * .3), "golpe",
                        "Golpe grave corto: acentos pequeños (una tarjeta que aterriza, un número).")
    # aire: whoosh suave de entrada (pico a 0,24 s)
    x = barrido_ruido(.55, 350, 2600, 900, .24)
    s["aire"] = (estereo(x, 0, .0004), "aire", "Whoosh suave: una pieza entra o se desplaza (tarjeta, panel, ficha de vídeo). Ancla: el pico cuando la pieza llega.")
    x = barrido_ruido(.45, 2200, 900, 250, .12)
    s["aire-salida"] = (estereo(x, 0, .0004), "aire", "Whoosh descendente y corto: una pieza o una escena sale. Más bajo que el de entrada.")
    # tick: clic tonal muy corto
    d = .06; t = t_(d)
    x = np.sin(2 * np.pi * 3100 * t) * env_ad(len(t), .0005, .0045) + banda(ruido(len(t), "blanco"), 3000, 9000) * env_ad(len(t), .0003, .002) * .5
    s["tick"] = (estereo(x), "tick", "Tick seco: aparece un chip, una etiqueta, un icono de una lista, una palabra de un titular.")
    x = np.sin(2 * np.pi * 1900 * t) * env_ad(len(t), .0008, .007)
    s["tick-suave"] = (estereo(x), "tick", "Tick grave y suave: elementos pequeños en serie (iconos que orbitan, casillas que se llenan).")
    # nota: campanita suave (parciales de campana)
    d = 2.0; t = t_(d)
    x = sum(a * np.sin(2 * np.pi * 880 * r * t) * env_ad(len(t), .004, tau)
            for r, a, tau in [(1, 1, 1.1), (2.0, .32, .55), (2.76, .18, .35), (5.4, .06, .18)])
    s["nota"] = (estereo(x, 0, .0006), "nota", "Nota de campana suave: un acierto, un check, algo positivo o «gratis».")
    x = np.zeros(len(t))
    for k, (f0, t0) in enumerate([(659.3, 0), (987.8, .09)]):
        n0 = int(t0 * SR)
        tt = t[:len(t) - n0]
        x[n0:] += sum(a * np.sin(2 * np.pi * f0 * r * tt) * env_ad(len(tt), .004, tau) for r, a, tau in [(1, 1, .9), (2, .25, .4), (3, .08, .2)])
    s["nota-doble"] = (estereo(x, 0, .0006), "nota", "Dos notas que suben: confirmación, «listo», publicado.")
    # swell: sube 1,3 s y termina de golpe (el pico al final: se ancla al instante del revelado)
    d = 1.3; t = t_(d)
    from scipy.signal import butter, sosfilt
    base = ruido(len(t), "rosa")
    out = np.zeros(len(t))
    for i in range(0, len(t), 480):
        c = 200 * (30 ** (i / len(t)))
        sos = butter(2, min(c, 9000), btype="low", fs=SR, output="sos")
        out[i:i + 480] = sosfilt(sos, base[max(0, i - 3000):i + 480])[-len(base[i:i + 480]):]
    tono = np.sin(2 * np.pi * np.cumsum(110 * (1 + t / d)) / SR) * .35
    e = (t / d) ** 3
    x = (out + tono) * e
    x[-int(.004 * SR):] *= np.linspace(1, 0, int(.004 * SR))
    s["swell"] = (estereo(x, 0, .0005), "subida", "Swell corto que sube y corta en seco: anticipa un revelado. Ancla: el final (pico) en el instante del golpe.")
    # descarte: barrido que baja (algo se descarta, pierde el color, se tacha)
    d = .5; t = t_(d)
    f = 620 * (180 / 620) ** (t / d)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(t), .01, .18) * .8 + banda(ruido(len(t)), 300, 1800) * env_ad(len(t), .01, .12) * .4
    s["descarte"] = (estereo(x), "tick", "Barrido que baja: algo se descarta, se tacha o pierde el color.")
    # corte: tajo (ruido agudo muy corto + aire) para la transición de cuchilla
    d = .5; t = t_(d)
    tajo = banda(ruido(len(t), "blanco"), 3500, 14000) * env_ad(len(t), .001, .03)
    x = tajo + barrido_ruido(.5, 3000, 5000, 600, .03) * .7
    s["corte"] = (estereo(x, 0, .0003), "corte", "Tajo: transición de cuchilla (una línea corta la imagen).")
    # bip corto (contador, aviso pequeño)
    d = .16; t = t_(d)
    x = np.sin(2 * np.pi * 1320 * t) * env_ad(len(t), .003, .05)
    s["bip"] = (estereo(x), "tick", "Bip corto: un contador, un temporizador, un aviso pequeño.")
    return s


def cargar(f):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(f), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)


PIX = {  # clave: (archivo de Pixabay, familia, descripción)
    "golpe-grave": ("impact-bass-1.mp3", "golpe", "Impacto grave con cola (Pixabay): el golpe grande de un revelado de marca o del titular principal."),
    "impacto": ("impact-bass-2.mp3", "golpe", "Impacto con una pequeña anticipación (Pixabay): el pico cae en el revelado."),
    "barrido": ("whoosh-short.mp3", "aire", "Whoosh corto (Pixabay): movimiento rápido, una ficha que cruza la pantalla."),
    "transicion": ("whoosh-cinematic.mp3", "aire", "Whoosh cinematográfico largo (Pixabay, 5,5 s): el vídeo que se convierte en ficha, un viaje de cámara."),
    "click": ("click-soft.mp3", "tick", "Clic suave (Pixabay): un cursor que pulsa un botón."),
    "tecla": ("key-press.mp3", "tecla", "Una tecla (Pixabay)."),
    "tecleo": ("typing.mp3", "tecla", "Tecleo de 1,5 s (Pixabay): un buscador o un prompt que se escribe."),
    "campana": ("chime.mp3", "nota", "Campanita melódica (Pixabay): éxito, confirmación."),
    "ping": ("ping.mp3", "nota", "Ping electrónico (Pixabay): un dato clave."),
    "brillo": ("sparkle.mp3", "nota", "Destello brillante (Pixabay): algo se ilumina, un mapa que se enciende."),
    "notificacion": ("notification.mp3", "aviso", "Aviso de notificación (Pixabay): una notificación o un mensaje que entra."),
    "subida": ("riser.mp3", "subida", "Riser largo de 10 s (Pixabay): subida de tensión; el pico al final."),
    "fallo": ("error.mp3", "error", "Tono de error (Pixabay): algo falla, «no»."),
    "glitch": ("glitch-3.mp3", "glitch", "Glitch discreto (Pixabay): cambio digital sutil."),
    "glitch-fuerte": ("glitch-1.mp3", "glitch", "Glitch con pegada (Pixabay): corte brusco. Úsalo poco."),
    "pop": ("pop.mp3", "tick", "Pop (Pixabay). Evítalo en el estilo sobrio: suena a dibujos animados."),
}


def preparar(x):
    """sin silencio inicial (deja 3 ms), pico a −1 dBFS; devuelve (x, pico_s, activo_dbfs)"""
    mono = np.abs(x).max(1)
    umbral = mono.max() * 10 ** (-50 / 20)
    i0 = max(0, int(np.argmax(mono > umbral)) - int(.003 * SR))
    x = x[i0:]
    # cola: corta donde queda por debajo de −60 dB del pico
    mono = np.abs(x).max(1)
    idx = np.where(mono > mono.max() * 10 ** (-60 / 20))[0]
    x = x[:idx[-1] + int(.02 * SR)] if len(idx) else x
    x = x / (np.abs(x).max() + 1e-12) * 10 ** (-1 / 20)
    k = int(.01 * SR)
    env = np.sqrt(np.convolve((x ** 2).mean(1), np.ones(k) / k, "same"))
    pico = float(np.argmax(env)) / SR
    act = env > env.max() * 10 ** (-20 / 20)
    activo = 20 * np.log10(np.sqrt(((x[act] ** 2).mean())) + 1e-12)
    return x, pico, activo


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    OUT.mkdir(exist_ok=True)
    import soundfile as sf
    man = {}
    fuentes = {k: (x, fam, desc, "sintetizado (animaciones-horizontal-combinadas, sin derechos)") for k, (x, fam, desc) in sintetizados().items()}
    if PIXABAY.is_dir():
        for k, (f, fam, desc) in PIX.items():
            if (PIXABAY / f).is_file():
                fuentes[k] = (cargar(PIXABAY / f), fam, desc, "Pixabay Content License (uso comercial sin atribución)")
    else:
        print("AVISO: no encuentro los efectos de Pixabay (skill media-use); solo se generan los sintetizados")
    for k, (x, fam, desc, origen) in fuentes.items():
        x, pico, activo = preparar(np.asarray(x, np.float64))
        sf.write(OUT / f"{k}.wav", x.astype(np.float32), SR, subtype="PCM_16")
        gain = round(min(OBJETIVO[fam] - activo, PICO_MAX + 1), 1)      # el archivo tiene el pico a −1 dBFS
        ancla = "fin" if k == "swell" else "pico"      # el riser de Pixabay tiene el pico a mitad
        man[k] = {"archivo": f"{k}.wav", "familia": fam, "dur": round(len(x) / SR, 3), "pico": round(len(x) / SR if ancla == "fin" else pico, 3),
                  "ancla": ancla, "gain_db": gain, "descripcion": desc, "origen": origen}
        print(f"{k:<15} {fam:<7} {len(x) / SR:5.2f} s  pico {pico:5.3f} s  activo {activo:6.1f} dBFS  gain {gain:+5.1f} dB")
    json.dump(man, open(OUT / "sonidos.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(man)} sonidos -> {OUT}")


if __name__ == "__main__":
    main()
