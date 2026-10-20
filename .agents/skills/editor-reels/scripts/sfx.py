"""Genera los efectos de sonido propios del editor (sin licencias de terceros).

Uso:
    python herramientas/sfx.py editor/public/sfx

- pop.wav      : el "plop" de un logo o icono que aparece
- blip.wav     : toque corto y agudo para tarjetas que se encienden
- impacto.wav  : golpe grave (para momentos muy dramáticos; úsalo poco)
- check.wav    : dos notas ascendentes cortas, para cada punto de una lista que se marca
- exito.wav    : acorde brillante y suave, para una palabra destacada ("GRATIS")
- tijera.wav   : dos chasquidos metálicos muy cortos, para marcar un corte
Todos a 48 kHz, mono, con el pico a -3 dB.

De respaldo (solo si no existen: normalmente se bajan los de Remotion, que suenan más naturales):
whoosh.wav, whip.wav, switch.wav, mouse-click.wav y ding.wav.
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000


def guardar(path, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 10 ** (-3 / 20)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def tiempo(seg):
    return np.arange(int(SR * seg)) / SR


def paso_bajo(x, corte):
    a = np.exp(-2 * np.pi * corte / SR)
    y = np.zeros_like(x)
    for i in range(1, len(x)):
        y[i] = (1 - a) * x[i] + a * y[i - 1]
    return y


def pop():
    t = tiempo(0.16)
    f = 190 + 780 * np.exp(-t / 0.016)
    fase = 2 * np.pi * np.cumsum(f) / SR
    env = (1 - np.exp(-t / 0.0015)) * np.exp(-t / 0.038)
    clic = np.random.default_rng(1).standard_normal(len(t)) * np.exp(-t / 0.0025) * 0.25
    return np.sin(fase) * env + clic


def blip():
    t = tiempo(0.1)
    env = (1 - np.exp(-t / 0.002)) * np.exp(-t / 0.026)
    return (np.sin(2 * np.pi * 1320 * t) + 0.3 * np.sin(2 * np.pi * 2640 * t)) * env


def impacto():
    t = tiempo(0.6)
    f = 42 + 110 * np.exp(-t / 0.045)
    fase = 2 * np.pi * np.cumsum(f) / SR
    grave = np.sin(fase) * np.exp(-t / 0.2)
    ruido = paso_bajo(np.random.default_rng(2).standard_normal(len(t)), 900) * np.exp(-t / 0.05) * 1.6
    chasquido = np.random.default_rng(3).standard_normal(len(t)) * np.exp(-t / 0.004) * 0.35
    return grave + ruido + chasquido


def nota(f, dur, decay, t0=0.0, total=None):
    t = tiempo(total or (t0 + dur))
    env = np.where(t >= t0, (1 - np.exp(-(t - t0) / 0.003)) * np.exp(-(t - t0) / decay), 0.0)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)) * env


def check():
    total = 0.32
    return nota(1046.5, 0.12, 0.05, 0.0, total) + nota(1568.0, 0.2, 0.08, 0.075, total)


def exito():
    total = 1.1
    notas = [(783.99, 0.0), (987.77, 0.05), (1174.66, 0.1), (1567.98, 0.16)]  # sol mayor arpegiado
    x = sum(nota(f, 1.0, 0.32, t0, total) * (0.8 if k < 3 else 0.55) for k, (f, t0) in enumerate(notas))
    brillo = np.random.default_rng(4).standard_normal(len(x)) * np.exp(-tiempo(total) / 0.02) * 0.08
    return x + brillo


def ruido_filtrado(dur, f0, f1, q=0.35, semilla=5):
    """Ruido pasado por un filtro de paso banda cuya frecuencia va de f0 a f1 (barrido)."""
    n = int(SR * dur)
    x = np.random.default_rng(semilla).standard_normal(n)
    fc = np.geomspace(f0, f1, n)
    y = np.zeros(n)
    bp = lp = 0.0
    for i in range(n):  # filtro de estado variable (Chamberlin)
        f = 2 * np.sin(np.pi * min(fc[i], SR / 6) / SR)
        hp = x[i] - lp - q * bp
        bp += f * hp
        lp += f * bp
        y[i] = bp
    return y


def whoosh():
    t = tiempo(0.36)
    env = np.sin(np.pi * np.clip(t / 0.36, 0, 1)) ** 2
    return ruido_filtrado(0.36, 500, 4000) * env


def whip():
    t = tiempo(0.16)
    env = (1 - np.exp(-t / 0.004)) * np.exp(-t / 0.05)
    return ruido_filtrado(0.16, 6000, 900, semilla=6) * env


def clic(dur=0.05, f=2400, semilla=7):
    t = tiempo(dur)
    golpe = np.random.default_rng(semilla).standard_normal(len(t)) * np.exp(-t / 0.0015)
    return golpe + np.sin(2 * np.pi * f * t) * np.exp(-t / 0.006) * 0.6


def switch():
    x = np.zeros(int(SR * 0.16))
    a, b = clic(0.04, 1800, 8), clic(0.04, 2600, 9)
    x[:len(a)] += a
    x[int(SR * 0.07):int(SR * 0.07) + len(b)] += b * 0.8
    return x


def ding():
    t = tiempo(1.2)
    env = (1 - np.exp(-t / 0.002)) * np.exp(-t / 0.35)
    return (np.sin(2 * np.pi * 1318.5 * t) + 0.35 * np.sin(2 * np.pi * 2637 * t)
            + 0.12 * np.sin(2 * np.pi * 3955.5 * t)) * env


def tijera():
    """Unas tijeras que cortan: dos chasquidos metálicos, agudos y secos, separados 55 ms."""
    t = tiempo(0.18)
    x = np.zeros_like(t)
    for k, (t0, amp) in enumerate(((0.0, 1.0), (0.055, 0.75))):
        dt = np.clip(t - t0, 0, None)
        activo = t >= t0
        ruido = np.random.default_rng(10 + k).standard_normal(len(t)) * np.exp(-dt / 0.005)
        ping = np.sin(2 * np.pi * (4800 + 900 * k) * dt) * np.exp(-dt / 0.014)
        x += amp * activo * (0.55 * ruido + 0.45 * ping)
    return x - paso_bajo(x, 1500)  # sin graves: suena a metal pequeño


RESPALDO = {"whoosh": whoosh, "whip": whip, "switch": switch, "mouse-click": clic, "ding": ding}


def main():
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "editor/public/sfx")
    out.mkdir(parents=True, exist_ok=True)
    for nombre, fn in RESPALDO.items():
        if not (out / f"{nombre}.wav").exists():
            guardar(out / f"{nombre}.wav", fn())
    guardar(out / "pop.wav", pop())
    guardar(out / "blip.wav", blip())
    guardar(out / "impacto.wav", impacto())
    guardar(out / "check.wav", check())
    guardar(out / "exito.wav", exito())
    guardar(out / "tijera.wav", tijera())
    print("OK:", ", ".join(p.name for p in sorted(out.glob("*.wav"))))


if __name__ == "__main__":
    main()
