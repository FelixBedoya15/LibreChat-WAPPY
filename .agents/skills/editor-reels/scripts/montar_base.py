"""Monta el vídeo base limpio: une los tramos buenos, recorta a vertical y deja el audio listo.

Uso:
    python montar_base.py prueba.mp4 trabajo/prueba/cortes.json editor/public/reels/prueba/base.mp4 \
        [--encuadre encuadre.json] [--centro-x 1920] [--ancho 1216] [--mitad] [--ciclo 6] [--congelar-inicio 2]

- Recorte vertical 9:16 a altura completa. Si el recorte pasa de --ancho-max (1296 px, lo que hace falta para un
  zoom de 1,2 en un lienzo de 1080), se reduce: Remotion lee el vídeo mucho más rápido y no se pierde nada.
- Fotogramas por segundo constantes (los de cortes.json: 30, o 25/24 si la imagen va así) y un
  fotograma clave cada 0,5 s (Remotion busca fotogramas más rápido).
- Fotogramas repetidos (lo mide cadencia.py): con --mitad se queda con uno de cada dos (60 → 30) y con --ciclo N
  quita el repetido de cada N (6: de 30 a 25; 5: de 30 a 24). Se hace antes de cortar, así los cortes caen en
  fotogramas reales y el audio no se desfasa (se quita uno por ciclo, siempre).
- --congelar-inicio N: los N primeros fotogramas del reel se sustituyen por el siguiente (queda quieto esas
  centésimas). Sirve cuando la toma empieza con un parpadeo: el reel abre con los ojos abiertos, que es lo que
  se ve antes de darle a reproducir, y la voz y los labios siguen cuadrando.
- Microfundidos de 15 ms en cada corte para que no haya chasquidos.
- Voz: filtro de graves, compresión suave y volumen normalizado a -14 LUFS (lo típico en Instagram).
- Grabación doble (encuadre.json con "pantalla"): además saca pantalla.mp4 junto a la salida, con el
  panel de la pantalla y exactamente los mismos cortes, para las piezas "pantalla" del guion.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("cortes")
    ap.add_argument("salida")
    ap.add_argument("--encuadre", default=None, help="encuadre.json de herramientas/encuadre.py")
    ap.add_argument("--centro-x", type=int, default=None, help="centro horizontal del recorte (px del original)")
    ap.add_argument("--ancho", type=int, default=None, help="ancho del recorte (por defecto, 9:16 a altura completa)")
    ap.add_argument("--ancho-max", type=int, default=1296, help="ancho máximo del vídeo base (0 = sin reducir)")
    ap.add_argument("--mitad", action="store_true", help="quedarse antes con uno de cada dos fotogramas (60 → 30)")
    ap.add_argument("--ciclo", type=int, default=0, help="quitar el fotograma repetido de cada N (ver cadencia.py)")
    ap.add_argument("--congelar-inicio", type=int, default=0, help="fotogramas del principio que se sustituyen por el siguiente")
    ap.add_argument("--cpu", action="store_true", help="codificar con libx264 en vez de NVENC")
    args = ap.parse_args()

    info = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
         "-of", "json", args.video], capture_output=True, text=True, check=True).stdout)
    W, H = info["streams"][0]["width"], info["streams"][0]["height"]
    cw = args.ancho or int(round(H * 9 / 16 / 2) * 2)
    cx = args.centro_x if args.centro_x is not None else W // 2
    x0 = max(0, min(W - cw, cx - cw // 2))
    pantalla = None
    if args.encuadre:
        enc = json.load(open(args.encuadre, encoding="utf-8"))
        cw, x0 = enc["recorte"]["ancho"], enc["recorte"]["x0"]
        pantalla = enc.get("pantalla")

    c = json.load(open(args.cortes, encoding="utf-8"))
    fps = c["fps"]
    n = len(c["tramos"])

    # Lo que se hace una sola vez, antes de cortar: quitar fotogramas repetidos y, si no es una grabación doble,
    # recortar a vertical y reducir. Quitar los repetidos sobre todo el vídeo (y no tramo a tramo) deja los cortes
    # en fotogramas reales y mantiene el ritmo de uno quitado por ciclo, sin desfases.
    comun = []
    if args.ciclo:  # fotogramas constantes antes de quitar el repetido de cada ciclo: 30 para acabar en 25 o en 24
        comun.append(f"fps={fps * args.ciclo // (args.ciclo - 1)}")
    elif args.mitad:
        comun.append(f"fps={fps}")
    if not pantalla:
        comun.append(f"crop={cw}:{H}:{x0}:0")
        if args.ancho_max and cw > args.ancho_max:
            comun.append(f"scale={args.ancho_max}:-2:flags=lanczos")
    if args.ciclo:
        comun.append(f"decimate=cycle={args.ciclo}")
    grafo = ""
    if comun:
        grafo = "[0:v]" + ",".join(comun) + f",split={n}" + "".join(f"[c{i}]" for i in range(n)) + ";"

    partes, etiquetas, etiquetas_p = [], [], []
    fade = 0.015
    for i, tr in enumerate(c["tramos"]):
        a = tr["inicio"]
        # Número exacto de fotogramas: si el vídeo de un tramo sale con uno de más (el corte redondeado cae
        # justo después de un fotograma), concat retrasa todo lo que viene detrás y los cortes reales dejan
        # de coincidir con cortes.json. El vídeo se recorta medio fotograma antes de cada borde y se fija en
        # n fotogramas; el audio dura exactamente n / fps.
        n_fot = int(round((tr["fin"] - a) * fps))
        b = a + n_fot / fps
        d = b - a
        quieto = min(args.congelar_inicio, n_fot - 1) if i == 0 else 0  # el reel abre con un fotograma bueno
        origen = f"[c{i}]" if comun else "[0:v]"
        video = (f"{origen}trim=start={max(0.0, a + (quieto - 0.5) / fps):.4f}:end={b - 0.5 / fps:.4f},setpts=PTS-STARTPTS,"
                 f"fps={fps},tpad=start={quieto}:start_mode=clone:stop=2:stop_mode=clone,trim=end_frame={n_fot},"
                 f"setpts=PTS-STARTPTS,")
        if pantalla:  # el mismo tramo, partido en cámara y pantalla
            p = pantalla
            video += (f"split=2[vx{i}][px{i}];[vx{i}]crop={cw}:{H}:{x0}:0,setsar=1[v{i}];"
                      f"[px{i}]crop={p['ancho']}:{p['alto']}:{p['x0']}:{p['y0']},setsar=1[p{i}];")
            etiquetas_p.append(f"[p{i}]")
        else:
            video += f"setsar=1[v{i}];"
        partes.append(
            video +
            f"[0:a]atrim=start={a:.5f}:end={b:.5f},asetpts=PTS-STARTPTS,"
            f"afade=t=in:st=0:d={fade},afade=t=out:st={d - fade:.4f}:d={fade}[a{i}];"
        )
        etiquetas.append(f"[v{i}][a{i}]")
    grafo += "".join(partes) + "".join(etiquetas) + f"concat=n={n}:v=1:a=1[vc][ac];"
    if pantalla:
        grafo += "".join(etiquetas_p) + f"concat=n={n}:v=1:a=0[pc];"
    grafo += ("[ac]highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,"
              "loudnorm=I=-14:TP=-1.5:LRA=7,aresample=48000[aout]")

    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
        f.write(grafo)
        grafo_path = f.name

    os.makedirs(os.path.dirname(os.path.abspath(args.salida)), exist_ok=True)
    encoders = subprocess.run(["ffmpeg", "-hide_banner", "-encoders"], capture_output=True, text=True).stdout
    x264 = ["-c:v", "libx264", "-preset", "fast", "-crf", "16"]
    nvenc = ["-c:v", "h264_nvenc", "-preset", "p6", "-tune", "hq", "-rc", "vbr", "-cq", "17", "-b:v", "0"]
    vcodec = x264 if args.cpu or "h264_nvenc" not in encoders else nvenc
    salida_p = os.path.join(os.path.dirname(os.path.abspath(args.salida)), "pantalla.mp4")

    def comando(vc):
        cmd = (["ffmpeg", "-hide_banner", "-loglevel", "error", "-stats", "-y", "-i", args.video,
                "-filter_complex_script", grafo_path, "-map", "[vc]", "-map", "[aout]"]
               + vc + ["-g", str(max(1, fps // 2)), "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                       "-movflags", "+faststart", args.salida])
        if pantalla:  # segunda salida: la pantalla, sin audio
            cmd += ["-map", "[pc]"] + vc + ["-g", str(max(1, fps // 2)), "-pix_fmt", "yuv420p", "-an",
                                            "-movflags", "+faststart", salida_p]
        return cmd

    if subprocess.run(comando(vcodec)).returncode != 0:
        if vcodec is not nvenc:
            sys.exit("ffmpeg ha fallado al montar el vídeo base")
        print("[aviso] NVENC ha fallado; repito con libx264 (más lento)", file=sys.stderr)
        subprocess.run(comando(x264), check=True)
    os.unlink(grafo_path)
    ancho_final = args.ancho_max if (not pantalla and args.ancho_max and cw > args.ancho_max) else cw
    extra = (f" · repetidos fuera (uno de cada {args.ciclo})" if args.ciclo else "") + \
            (f" · {args.congelar_inicio} fotogramas del principio congelados" if args.congelar_inicio else "")
    print(f"OK: {args.salida} · recorte {cw}x{H} desde x={x0} · {ancho_final} px de ancho · {fps} fps · {n} tramos · "
          f"{c['duracion']:.2f}s{extra}")
    if pantalla:
        print(f"OK: {salida_p} · pantalla {pantalla['ancho']}x{pantalla['alto']} con los mismos cortes")


if __name__ == "__main__":
    main()
