# Problemas frecuentes

## Instalación

- **`entorno` dice que falta ffmpeg o Node justo después de instalarlo (Windows).** El PATH no se actualiza hasta abrir una terminal nueva. El script ya prueba las rutas típicas: `%LOCALAPPDATA%\Microsoft\WinGet\Links` y `C:\Program Files\nodejs`. Si sigue fallando, pide al usuario que reinicie Claude o la terminal.
- **No está winget, o en macOS no está Homebrew.** Indica al usuario la instalación manual: ffmpeg desde gyan.dev (Windows) o `brew`, y Node LTS desde nodejs.org. Luego repite `entorno`.
- **`pip install faster-whisper` falla.** Comprueba la versión de Python con `python --version`: hace falta la 3.9 o superior, y mejor 3.10–3.13 de 64 bits.
- **No se puede instalar PyTorch (torch y torchaudio), o `alinear` dice que falta.** El modo pro funciona igual: `alinear` reparte los tiempos de Whisper sobre el texto del guion y avisa de que son aproximados (±0,1–0,3 s). Las animaciones no caerán siempre en la sílaba: revisa más fotogramas en las entradas importantes y díselo al usuario. La primera alineación exacta descarga un modelo de 1,2 GB.
- **Tildes y símbolos rotos, o `UnicodeEncodeError`, al ejecutar un script suelto en Windows.** Lánzalo a través de `reel.py` (pone UTF-8) o con `PYTHONIOENCODING=utf-8`.

## Transcripción (Whisper)

- **La primera vez tarda:** descarga el modelo, unos 3 GB para large-v3 o 1,5 GB para medium. Avisa al usuario.
- **Errores de `cudnn` o `cublas`, o "no GPU".** El script sigue en la CPU (más lento, pero funciona). Para la GPU NVIDIA en Windows, usa `entorno --instalar --gpu`, que instala nvidia-cublas-cu12 y nvidia-cudnn-cu12. Si el usuario tiene PyTorch con CUDA, ya vale.
- **Nombres mal escritos.** Pasa `--nombres "Claude, n8n, ..."` en `analizar` y corrige lo que quede con `correcciones` en el guion.
- **Muletillas sin transcribir ("eh", "mmm").** Whisper no las escribe. Las zonas de voz sin palabras suelen ser eso; déjalas fuera de los tramos.

## Cortes y vídeo base

- **Se come el principio o el final de una palabra.** Amplía ese tramo 0,1 s en `--tramos`. `cortes.py` busca la voz clara (27 dB sobre el suelo de ruido) para no meter respiraciones. Con un audio muy ruidoso, puede hacer falta un umbral más bajo.
- **No detecta la cara.** `encuadre.py` falla y se usa un recorte centrado. Si la persona no está en el centro, monta a mano con `montar_base.py ... --centro-x <px> --ancho <px>`.
- **Vídeo vertical de móvil.** Funciona: si hace falta reducir, los lados se rellenan con desenfoque. Pon `"relleno": "desenfoque"` si el fondo no es liso.
- **Vídeos de iPhone (HEVC, frecuencia variable).** ffmpeg los lee sin problema. El vídeo base sale en H.264 a fotogramas constantes.
- **El movimiento da tirones (fotogramas repetidos).** Muchas cámaras, capturadoras y OBS guardan «a 60 fps» (o a 30) una imagen que en realidad va a 25 o a 24: el archivo repite fotogramas. Montado a 30, uno de cada seis sale repetido. `analizar` y `cortar` miden los fotogramas reales (`scripts/cadencia.py`, en ventanas con voz), montan el reel a esa cifra y quitan los repetidos antes de cortar. Lo dicen al ejecutarse («el archivo dice 60, la imagen va a 25»). Si `cortar` avisa de que el vídeo base sigue repitiendo fotogramas, repite con el `--fps` que indica. Un simple `fps=25` de ffmpeg no lo arregla (elige mal los fotogramas): hay que quitar el repetido de cada ciclo, que es lo que hace `montar_base.py --mitad --ciclo N`.
- **El reel empieza con un parpadeo o con la boca a medias.** Es el fotograma que se ve antes de reproducir. `cortar --congelar-inicio N` sustituye los N primeros fotogramas por el siguiente (queda quieto unas centésimas, sin desfasar la voz).
- **He vuelto a cortar y el guion ya estaba escrito.** `cortar` guarda los cortes anteriores (`cortes_guion.json`) y avisa. `reel.py recolocar <reel>` lleva cada tiempo del guion al mismo instante del vídeo nuevo (deja copia `.antes.json`); después, `alinear` y `edl`, y repasa la tabla de sincronía.
- **El vídeo base pesa mucho o el render va lento.** `montar_base.py` reduce el recorte a 1296 px de ancho (lo que hace falta para un zoom de 1,2); con una grabación 4K el render tarda la mitad. `--ancho-max 0` lo desactiva.
- **Clips de móvil unidos que salen girados o con el tamaño cambiado (1920x1080 en vez de 1080x1920).** ffmpeg 7 copia al archivo unido la marca de rotación del primer clip aunque la imagen ya esté girada. Quítala sin recodificar: `ffmpeg -display_rotation 0 -i unido.mp4 -c copy bien.mp4`. Compruébalo con `ffprobe -show_entries stream_side_data` (no debe salir `rotation`).
- **Selfie en espejo (el texto de la camiseta se lee al revés).** El iPhone graba así con "Reflejar cámara frontal". Voltea esos clips con `hflip` al unirlos.
- **Un clip enseña un vídeo que suena en el ordenador y no se oye.** El micro inalámbrico no coge los altavoces. Busca el vídeo original y sincronízalo por los cambios de imagen: correlación de la variación de brillo por fotograma entre la zona de la pantalla y el original (la del audio no sirve si apenas se oye). Pon su audio en ese tramo y, si el clip corta a mitad de frase, déjalo sonar sobre el principio del plano siguiente (corte en L).
- **NVENC no disponible o falla.** `montar_base.py` usa libx264 solo (más lento).

## Remotion

- **`Failed to launch the browser process ... chrome-headless-shell.exe ENOENT` (Windows).** Casi siempre es una ruta de más de 260 caracteres: la carpeta del proyecto está demasiado anidada. `preparar` avisa si pasa de unos 110 caracteres. Mueve el proyecto a una ruta corta (p. ej. `Documentos\Reels`) y vuelve a ejecutar `preparar`.
- **`preparar` ya descarga Chrome Headless Shell** (unos 110 MB, con `npx remotion browser ensure`) y `revisar` se asegura de que esté. Es normal que la primera vez tarde.
- **La tipografía se descarga de Google Fonts al renderizar.** Hace falta internet.
- **`delayRender` agota el tiempo o sale una imagen en negro en `revisar`.** Vuelve a lanzarlo. Si se repite, comprueba que `editor/public/reels/<reel>/base.mp4` existe y que el EDL apunta a él.
- **Render lento.** Cuenta con 2–4 minutos por minuto de vídeo. La concurrencia está en `editor/remotion.config.ts` (`setConcurrency`).
- **Cambios de la plantilla que no se ven.** Ejecuta `reel.py preparar`, que copia `plantilla/` en `editor/`. No toca `editor/src/pro/propias.tsx` (las piezas propias del proyecto).
- **El disco se llena, o `ENOSPC: no space left on device`.** Remotion deja en la carpeta temporal del sistema una copia del proyecto por ejecución (`remotion-webpack-bundle-…`) y otra del vídeo base por cada fotograma suelto (`remotion-v…-assets…`), y en Windows no siempre las borra: llegaron a acumularse 80 GB. `revisar`, `portada` y `render` trabajan en una carpeta temporal propia (`editor-reels-…`) y la borran al acabar. Si lanzas Remotion a mano (`npx remotion …`), borra después esas carpetas de la carpeta temporal. Ante un fallo raro al renderizar, mira primero el espacio libre.
- **`Browser failed to load … fonts.gstatic.com` al sacar fotogramas.** Un corte de red al bajar la tipografía; `fotogramas.mjs` reintenta solo. Si se repite, no hay internet.
- **Un aviso rojo «Pieza desconocida» en los fotogramas.** El `tipo` de una pieza del guion no existe: está mal escrito o falta apuntarla en `propias.tsx`.
- **Los colores del vídeo cambian según el reproductor (más contraste, tonos raros).** El render va con `--color-space=bt709` para que salga marcado como vídeo estándar; si renderizas a mano, no lo quites.
- **Un error de TypeScript en una pieza propia.** Compruébalo con `npx tsc --noEmit -p .` dentro de `editor/`.
- **`reel.py captura` no saca la página** (pide sesión o bloquea navegadores automáticos). Haz la captura a mano, guárdala en `editor/public/reels/<reel>/media/` y pon su ancho y su alto en el guion.
- **La captura sale tapada por un aviso de cookies o una barra de idioma.** Si es una banda arriba o abajo, `--ocultar fijos` la quita (y `--quitar-arriba` / `--quitar-abajo` recortan lo que quede). Si es una ventana que tapa toda la página, `--clic "Decline optional cookies"` pulsa antes el botón con ese texto: siempre el de rechazar las cookies opcionales, nunca el de aceptar. Si ni así se va (pasa en ai.meta.com), captura otra página oficial: la nota de prensa suele servir mejor que la página del producto. Con más de 1000 px de `--ancho`, muchas webs pasan a su versión de escritorio con barra lateral: mejor 900.

## Logos

- **`NOT FOUND` o "calidad baja".** Busca el logo oficial (kit de prensa o la web del producto) y compruébalo sobre fondo oscuro. Para herramientas recientes que no están en los catálogos, añádelas al mapa `TOOLS` de `scripts/logos.py` con `"web": "https://..."`. Así se hizo con Google Stitch y Google Flow.
- **Logo negro sobre transparente (invisible).** `logos.py` lo pasa a blanco. Si llega de otra fuente, conviértelo antes de usarlo.

## Instagram

- **No se puede descargar un reel por enlace** (yt-dlp dice "login required"). No uses las cookies del usuario. Pídele el botón "Descargar" de la app o una grabación de pantalla, o analízalo en el navegador (ver `referencias.md`).
