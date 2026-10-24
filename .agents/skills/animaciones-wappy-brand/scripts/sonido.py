"""Mezcla de sonido: voz + efectos anclados a la animación + música de fondo -> assets/audio/mezcla.wav a −14 LUFS.

Uso (desde la carpeta del proyecto; normalmente lo lanzan 'anim.py render' y 'anim.py montar' solos):
    python sonido.py                  lee trabajo/sonidos.json (lo escribe 'node tools/sonidos.mjs') y mezcla
    python sonido.py --lista          imprime los efectos y temas disponibles

Qué hace:
1. Voz (CONFIG.audio) llevada a −16 LUFS: la referencia de todo lo demás.
2. Efectos: cada llamada sfx(t, 'nombre', {vol, pan}) del index.html. El golpe del sonido («pico» en sonidos.json)
   cae en t (o termina en t si su ancla es «fin», como el swell). Ganancia = gain_db del sonido + vol.
3. Música (ESTILO.sonido = 'musica'): el tema de ESTILO.musica (o los tramos de ESTILO.tramosMusica), al nivel
   musica.json -> nivel_db respecto a la voz (o ESTILO.musicaDb), en bucle si hace falta, con entrada y salida
   suaves y bajando 4 dB mientras suena la voz (ducking).
4. Master: loudnorm en dos pasadas (lineal) a −14 LUFS integrados y −1 dBTP.
Deja además las pistas por separado en trabajo/pistas/ (voz, música, efectos), por si se quieren remezclar.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 48000
SKILL = Path(__file__).resolve().parent.parent
SON = SKILL / "sonidos"
MUS = SKILL / "musica"
REF_VOZ = -16.0


def cargar(f, desde=0.0, dur=None):
    cmd = ["ffmpeg", "-v", "error"]
    if desde:
        cmd += ["-ss", f"{desde:.4f}"]
    cmd += ["-i", str(f)]
    if dur:
        cmd += ["-t", f"{dur:.4f}"]
    cmd += ["-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)


def escribir(f, x, bits=24):
    import soundfile as sf
    Path(f).parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(f), np.clip(x, -1, 1).astype(np.float32), SR, subtype=f"PCM_{bits}")


def lufs(x):
    """sonoridad integrada (EBU R128) con ffmpeg"""
    import tempfile
    import os
    fd, tmp = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    try:
        escribir(tmp, x, 16 if np.abs(x).max() <= 1 else 24)
        err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", tmp, "-af", "ebur128=framelog=quiet", "-f", "null", "-"],
                             capture_output=True, text=True).stderr
    finally:
        os.remove(tmp)
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", err)
    return float(m[-1]) if m else -70.0


def envolvente(x, ms=30):
    k = max(1, int(SR * ms / 1000))
    p = np.convolve((x ** 2).mean(1), np.ones(k) / k, "same")
    return 10 * np.log10(p + 1e-12)


def ducking(voz, reduccion=5.0, ataque=.06, suelta=.4):
    """ganancia (lineal, por muestra) para la música: baja 'reduccion' dB mientras hay voz"""
    e = envolvente(voz, 40)
    habla = e > (np.percentile(e, 99) - 32)
    objetivo = np.where(habla, -reduccion, 0.0)
    # suavizado de un polo, distinto al bajar (ataque) y al subir (suelta); a 1 kHz para que sea rápido
    paso = 48
    o = objetivo[::paso]
    g = np.zeros_like(o)
    a_at, a_su = np.exp(-paso / (SR * ataque)), np.exp(-paso / (SR * suelta))
    v = 0.0
    for i, x in enumerate(o):
        a = a_at if x < v else a_su
        v = a * v + (1 - a) * x
        g[i] = v
    g = np.interp(np.arange(len(objetivo)), np.arange(len(g)) * paso, g)
    return 10 ** (g / 20)


def pista_musica(clave, n, desde=None, nivel_db=None, entrada=.8, salida=1.6, man=None):
    m = man[clave]
    d0 = m.get("desde", 0.0) if desde is None else desde
    x = cargar(MUS / m["archivo"], d0)
    if len(x) < n:                                   # bucle con fundido cruzado de 1,5 s
        cf = int(1.5 * SR)
        out = x.copy()
        while len(out) < n:
            r = np.linspace(0, 1, cf)[:, None]
            out[-cf:] = out[-cf:] * (1 - r) + x[:cf] * r
            out = np.concatenate([out, x[cf:]])
        x = out
    x = x[:n].copy()
    if entrada > 0:
        k = min(n, int(entrada * SR))
        x[:k] *= np.linspace(0, 1, k)[:, None] ** 2
    if salida > 0:
        k = min(n, int(salida * SR))
        x[-k:] *= np.linspace(1, 0, k)[:, None] ** 1.5
    return x, (m.get("nivel_db", -18) if nivel_db is None else nivel_db)


def main():
    for st in (sys.stdout, sys.stderr):
        try:
            st.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--lista", action="store_true")
    ap.add_argument("--entrada", default="trabajo/sonidos.json")
    ap.add_argument("--salida", default="assets/audio/mezcla.wav")
    ap.add_argument("--objetivo", type=float, default=-14.0, help="LUFS integrados del master")
    a = ap.parse_args()
    man = json.load(open(SON / "sonidos.json", encoding="utf-8"))
    mman = json.load(open(MUS / "musica.json", encoding="utf-8"))
    if a.lista:
        print("EFECTOS (sfx(t, 'nombre', {vol, pan})):")
        for k, v in man.items():
            print(f"  {k:<14} {v['familia']:<7} {v['dur']:5.2f} s  {v['descripcion']}")
        print("\nMÚSICA (ESTILO.musica):")
        for k, v in mman.items():
            print(f"  {k:<17} {v['titulo']} — {v['autor']} ({v['dur']:.0f} s): {v['uso']}")
        return

    d = json.load(open(a.entrada, encoding="utf-8"))
    dur, estilo, cues = d["dur"], d.get("estilo") or {}, d.get("cues") or []
    n = int(round(dur * SR))
    voz_f = d.get("voz")
    voz = np.zeros((n, 2))
    if voz_f and Path(voz_f).is_file():
        v = cargar(voz_f)
        voz[:min(n, len(v))] = v[:n]
        l_voz = lufs(voz)
        voz *= 10 ** ((REF_VOZ - l_voz) / 20)
        print(f"Voz: {voz_f} · {l_voz:.1f} LUFS -> {REF_VOZ} (referencia)")
    else:
        print("Sin voz: la mezcla lleva solo efectos y música")

    # efectos
    efe = np.zeros((n, 2))
    cache, avisos = {}, []
    for c in sorted(cues, key=lambda c: c["t"]):
        k = c["id"]
        if k not in man:
            parecidos = [x for x in man if x.split("-")[0] in k or k.split("-")[0] in x]
            avisos.append(f"sonido desconocido '{k}' en {c['t']:.2f} s" + (f" (¿{', '.join(parecidos)}?)" if parecidos else ""))
            continue
        if k not in cache:
            cache[k] = cargar(SON / man[k]["archivo"])
        s = cache[k]
        m = man[k]
        g = 10 ** ((m["gain_db"] + 20 * np.log10(max(1e-4, c.get("vol", 1)))) / 20)
        pan = float(c.get("pan", 0))
        gl, gr = np.sqrt((1 - pan) / 2) * 1.414, np.sqrt((1 + pan) / 2) * 1.414
        i0 = int(round((c["t"] - (m["dur"] if m["ancla"] == "fin" else m["pico"])) * SR))
        a0, b0 = max(0, i0), min(n, i0 + len(s))
        if b0 <= a0:
            avisos.append(f"'{k}' en {c['t']:.2f} s cae fuera del vídeo")
            continue
        trozo = s[a0 - i0:b0 - i0] * g
        efe[a0:b0, 0] += trozo[:, 0] * gl
        efe[a0:b0, 1] += trozo[:, 1] * gr
    ts = sorted(c["t"] for c in cues)
    for i in range(len(ts) - 3):
        if ts[i + 3] - ts[i] < .3:
            avisos.append(f"4 efectos en menos de 0,3 s hacia {ts[i]:.2f} s: agrúpalos en uno")
            break
    print(f"Efectos: {len(cues)} ({len(cache)} distintos)")

    # música
    mus = np.zeros((n, 2))
    modo = estilo.get("sonido", "voz")
    if modo == "musica":
        tramos = estilo.get("tramosMusica") or [{"pista": estilo.get("musica") or "intro-tambores", "t0": 0, "t1": dur}]
        for i, tr in enumerate(tramos):
            if tr["pista"] not in mman:
                sys.exit(f"No hay tema '{tr['pista']}' en musica/musica.json (python sonido.py --lista)")
            t0, t1 = float(tr.get("t0", 0)), float(tr.get("t1", dur))
            k0, k1 = int(t0 * SR), min(n, int(t1 * SR))
            x, nivel = pista_musica(tr["pista"], k1 - k0, tr.get("desde"), tr.get("nivel_db", estilo.get("musicaDb")),
                                    entrada=tr.get("entrada", .8 if i == 0 else 1.0), salida=tr.get("salida", 1.6), man=mman)
            x *= 10 ** ((REF_VOZ + nivel - lufs(x)) / 20)
            mus[k0:k1] += x
            print(f"Música: {tr['pista']} ({mman[tr['pista']]['titulo']}) {t0:.1f}-{t1:.1f} s a {nivel} dB de la voz")
        if np.abs(voz).max() > 0:
            mus *= ducking(voz, float(estilo.get("ducking", 4)))[:, None]

    mezcla = voz + mus + efe
    tmp = Path("trabajo/pistas")
    tmp.mkdir(parents=True, exist_ok=True)
    if not np.abs(voz).max() > 0:
        # sin voz (animación que irá encima de su vídeo): no se normaliza a −14 (subiría los efectos una barbaridad);
        # todo queda al nivel que tendría junto a una voz a −14 LUFS, que es como la montará él
        g = 10 ** ((a.objetivo - REF_VOZ) / 20)
        pico = np.abs(mezcla).max() * g
        g *= min(1.0, 10 ** (-1 / 20) / pico) if pico > 0 else 1.0
        escribir(a.salida, mezcla * g)
        for nombre, x in (("musica", mus), ("efectos", efe)):
            escribir(tmp / f"{nombre}.wav", x * g)
        print(f"Sin voz: efectos{' y música' if np.abs(mus).max() > 0 else ''} al nivel que tendrían junto a una voz a "
              f"{a.objetivo:g} LUFS (sin normalizar) -> {a.salida}")
        for x in avisos:
            print("AVISO: " + x)
        return
    pre_gain = 1.0 / max(1.0, np.abs(mezcla).max())          # sin recortes al escribir el premaster
    l_mez = lufs(mezcla * pre_gain)
    pre = tmp / "_premaster.wav"
    escribir(pre, mezcla * pre_gain)
    # limitador de picos antes de subir el volumen: la voz a −16 LUFS tiene picos cerca de 0 dB y al llevar la mezcla
    # a −14 pasarían de −1 dBTP (loudnorm dejaría de ser lineal y comprimiría). Techo = −1 dBTP − la subida − 1,2 dB
    # de margen para los picos entre muestras. Luego loudnorm en dos pasadas, lineal: todo sube por igual.
    techo = 10 ** ((-2.2 - (a.objetivo - l_mez)) / 20)
    lim = f"alimiter=limit={techo:.4f}:attack=2:release=80:level=0:asc=1," if techo < .98 else ""
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(pre), "-af",
                          f"{lim}loudnorm=I={a.objetivo}:TP=-1:LRA=11:print_format=json", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    meas = json.loads(err[err.rfind("{"):err.rfind("}") + 1])
    af = (f"{lim}loudnorm=I={a.objetivo}:TP=-1:LRA=11:measured_I={meas['input_i']}:measured_TP={meas['input_tp']}:"
          f"measured_LRA={meas['input_lra']}:measured_thresh={meas['input_thresh']}:offset={meas['target_offset']}:"
          f"linear=true:print_format=json")
    Path(a.salida).parent.mkdir(parents=True, exist_ok=True)
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-i", str(pre), "-af", af, "-ar", str(SR), "-c:a", "pcm_s24le", a.salida],
                         capture_output=True, text=True).stderr
    res = json.loads(err[err.rfind("{"):err.rfind("}") + 1])
    lineal = res.get("normalization_type") == "linear"
    g_master = 10 ** ((a.objetivo - float(meas["input_i"])) / 20) * pre_gain
    for nombre, x in (("voz", voz), ("musica", mus), ("efectos", efe)):
        escribir(tmp / f"{nombre}.wav", x * g_master)
    pre.unlink()
    print(f"Master: {l_mez:.1f} -> {res['output_i']} LUFS · pico {res['output_tp']} dBTP · "
          f"{'lineal' if lineal else 'DINÁMICO (la mezcla tenía picos altos: revisa el volumen de los golpes)'}")
    print(f"-> {a.salida}  (pistas sueltas en trabajo/pistas/: voz, musica, efectos)")
    for x in avisos:
        print("AVISO: " + x)


if __name__ == "__main__":
    main()
