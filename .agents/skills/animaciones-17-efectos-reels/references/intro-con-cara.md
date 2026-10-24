# Intro a cámara: cara ↔ animación

Josema graba la intro de un vídeo hablando a cámara y pasa el MP4. Se entrega la intro montada: **sin pausas**,
alternando **planos de su cara** con **animaciones a pantalla completa** (nunca encima de su cara), con **su voz
continua** de principio a fin y cada animación clavada a la palabra que la dispara. Primera vez: intro de Muse
(28/09/2026, `ejemplos/muse-intro.html`), «está perfecto». Del resto de la skill cambia el principio (la voz sale de
la toma) y el final (el montaje); las animaciones se hacen igual que siempre.

Es el modo **cara**. Si la animación tiene que ir integrada en la grabación (detrás y delante de él, fondo
sustituido, tarjetas junto a su cara) o combinar ambas cosas, es el modo **capas** o **combinado**:
`references/capas-sobre-video.md` (el principio del flujo es el mismo que aquí).

## Contenido

1. Flujo
2. Quitar las pausas
3. Repartir los planos (edicion/montaje.json)
4. Las animaciones dentro de su ventana
5. Montar, revisar y entregar
6. Detalles técnicos y errores ya resueltos

## 1. Flujo

```
python <skill>/scripts/anim.py nuevo <Animaciones>/<nombre> --video <grabación.mp4>
cd <Animaciones>/<nombre>
python <skill>/scripts/anim.py transcribir --toma --nombres "Muse, Meta, WhatsApp"   → edicion/guion.txt
   (corrige edicion/guion.txt: una frase por línea, nombres bien escritos, "~" delante de una toma repetida;
    borra un «Gracias.» final: Whisper se lo inventa en el silencio)
python <skill>/scripts/anim.py alinear --toma        → edicion/tiempos.json (palabras de la toma original)
python <skill>/scripts/anim.py cortar                → voz sin pausas, edicion/cortes.json, proxy 720p, montaje.json
python <skill>/scripts/anim.py alinear               → trabajo/tiempos.json (palabras de la voz ya cortada)
python <skill>/scripts/anim.py planos                → palabras con su fotograma, saltos de corte, revisión del montaje
   (escribe edicion/montaje.json; programa las escenas en index.html; revisar como siempre)
python <skill>/scripts/anim.py montar --res 1080     → borrador rápido; revisa ritmo, cortes y sincronía
python <skill>/scripts/anim.py montar                → final a la resolución de la toma (4K 60 fps si es 4K)
```

`nuevo --video` guarda la toma en `edicion/fuente.json` (tamaño, fps exactos) y su audio en `edicion/toma.wav`.
Todo lo del montaje vive en `edicion/`; la animación, como siempre, en `index.html` + `assets/` + `trabajo/`.

## 2. Quitar las pausas (`anim.py cortar`)

- Cada frase de `edicion/guion.txt` es un bloque de voz. Sus bordes se afinan con la energía real: la voz clara
  empieza ~27 dB sobre el ruido de fondo y la cola se sigue hasta ~21 dB. Margen: `--pre .09` antes de la primera
  sílaba y `--post .13` tras la última. Hueco resultante entre frases ≈ 0,2–0,3 s: ritmo de intro de YouTube, natural.
- Pausas de menos de `--min-pausa .55` s se quedan (respirar entre dos ideas de la misma frase no se corta).
- Final: última palabra + `--cola .35`, o `--fin <s de la toma>`. Mira 3–4 fotogramas tras la última palabra:
  si se gira al ordenador o alarga la mano, corta antes con `--fin`.
- Cortes en fotogramas enteros y la voz cortada en la muestra equivalente (a 60 fps, 800 muestras por fotograma),
  con 8 ms de fundido en cada unión, en silencio: sin chasquidos. La voz cortada dura exactamente lo que la imagen.
- Calcula el encuadre del plano corto: detecta la cara (YuNet de OpenCV) en ~30 fotogramas y guarda en
  `montaje.json` → `"cerca": {cx, y0}` (centro de la cara y borde superior del recorte, en px de la toma), con los ojos
  a ~38 % de la altura. En el estudio de Josema (4K): cx ≈ 1770, y0 = 0.
- Deja `edicion/cara_proxy.mp4` (720p, la toma sin pausas con la voz): la previsualización lo muestra en los
  planos de cara, y sirve para mirar fotogramas sin decodificar el 4K.
- Muse: 79 s → 37,97 s en 11 tramos. Los datos y la voz se regeneran idénticos si repites el comando.

## 3. Repartir los planos (`edicion/montaje.json`)

```json
{ "fps": 60, "cerca": {"cx": 1771, "y0": 0},
  "planos": [
    {"tipo": "cara", "f0": 0,   "f1": 104, "zooms": [1.22]},
    {"tipo": "anim", "f0": 104, "f1": 625, "id": "lanzamiento"},
    {"tipo": "cara", "f0": 625, "f1": 871, "zooms": [1.0, 1.22]}, … ] }
```

Fotogramas del vídeo sin pausas, seguidos de 0 al total. `zooms` se recorre en ciclo en cada salto de corte que
cae dentro del plano (1,0 = plano completo; 1,22 = plano corto centrado en la cara): los saltos parecen cambios de
cámara. `anim.py planos` imprime cada palabra con su fotograma y los saltos, y avisa de cortes dentro de una palabra,
planos demasiado cortos y huecos.

Cómo decidirlo (lo que funcionó en Muse; 9 planos en 38 s, 61 % animación, media 4,2 s por plano):
- **Empieza en cara** con el gancho y **corta a la animación en el nombre del producto** («Meta acaba de lanzar» →
  corte → «**Muse**»): la presentación del producto es el primer golpe visual.
- **Animación** para lo que se entiende mejor viéndolo: el producto y sus logos, con qué se conecta, precios y datos,
  mapas («solo en Estados Unidos»), listas («varios casos de uso: …»).
- **Cara** para lo personal y las bisagras: la promesa («yo te voy a enseñar…»), «El problema es que…», «Vamos a ver
  varios casos de uso:» (anuncia la lista que viene en animación) y **el cierre** («Vamos a ello»). Termina en cara.
- Duraciones: cara ≥ 1,5 s (menos se nota como un parpadeo), animación nueva ≥ 2,4 s. Una animación que **vuelve**
  (retoma una ya vista) puede durar 1,7 s: el mapa volvió en «sin tener que ser de allí» y la luz se extendió al mundo.
- Una escena puede cubrir dos frases si evoluciona (presentación → conexiones, 8,7 s); una lista larga en animación
  aguanta 10 s si cada elemento entra al nombrarlo.
- **Parte que explica conceptos** (lo que va después de la intro; Muse parte 2, «espectacular»): más animación que
  cara, ~65 % (13 planos en 75 s, media 5,8 s). La cara, para las transiciones («Lo primero que tienes que saber es que no
  se trata de un…» → corte a la animación en el primer nombre), las repeticiones («Sería como un OpenClaw o un Hermes,
  pero de Meta»), las promesas («te voy a enseñar…») y el cierre. Si dos ideas en animación van seguidas en la toma,
  van en la misma ventana con una transición dentro (el panel de conectores entra en la nube). Si la intro terminó en
  plano completo, empieza esta parte en plano corto.
- **Dónde cortar**: en el hueco entre dos palabras, `floor((inicio − 0,03) × fps)` de la palabra que dispara la
  animación, o en un salto de la toma (ya es silencio). Corte seco: sin fundidos entre cara y animación.

## 4. Las animaciones dentro de su ventana

La plantilla lee `edicion/montaje.json` al arrancar: `V.<id> = {a, b}` es la ventana de cada plano de animación en
segundos. Cada escena se pinta solo dentro de la suya y apaga todo fuera:

```js
function escenaMapa(t) {
  if (!dentro(t, V.mapa) && !dentro(t, V.mapa2)) { off(lienzo); off(pin); chip.pintar(t, { o: 0 }); return; }
  …
}
```

- **El primer fotograma de cada ventana ya tiene contenido**: las entradas empiezan 0,1–0,45 s antes del corte
  (una ficha que ya está saliendo, un mapa que ya se está dibujando). Un fondo vacío tras el corte parece un fallo.
- `camara(t)` añade sola un asentamiento 1,06 → 1 (0,55 s) al entrar en cada ventana: acompaña el corte.
- Un rótulo que tiene que leerse mientras la cámara se acerca a otra cosa: `put(el, { ...fijo(t, CX, 112, 1.28), o })`
  lo deja fijo en pantalla.
- Entre ventanas no se ve nada: una escena puede seguir su lógica (los huecos de la lista se rellenan aunque en ese
  momento se vea la cara) y al volver ya está en su sitio.
- Previsualización (`node server.mjs`): en los planos de cara se ve el proxy con el encuadre del montaje (arriba a la
  derecha: «CARA · 1.22» o «ANIM · id»). Revisa el ritmo con la voz antes de renderizar.
- Piezas nuevas de Muse que merece la pena copiar (ver `ejemplos/README.md`): icono de app cuyo logo se escribe a
  mano (`anim.py logo-trazo`), mapa del mundo en puntos (`anim.py mapa`), centro con conectores que se rellenan
  (WhatsApp, Instagram, Correo) y fila de casos de uso con mini ilustraciones.

## 5. Montar, revisar y entregar

- `anim.py montar --res 1080` (borrador: ~4,5 min para 38 s con 21 s de animación) y `anim.py planos --hoja out/<x>.mp4`: hoja con el
  fotograma de antes y el de después de cada corte (`trabajo/revision/cortes.png`). Comprueba que la cara no se
  corta en el plano corto, que la animación ya tiene contenido en su primer fotograma y que no hay saltos raros.
- `anim.py comprobar out/<x>.mp4 --palabras`: un fotograma 0,12 s después de cada palabra de `T` en el vídeo final.
- Final: `anim.py montar` (Muse, 4K 60 fps: ~13 min; el render de la animación a 4K va a ~2,5 fps). Solo se
  renderizan las ventanas de animación. Copia `out/<nombre>_<alto>p<fps>.mp4` a la raíz de `Animaciones/` con un
  nombre descriptivo y haz también la versión 1080p (reescalada de la 4K) para verla en el móvil:
  `ffmpeg -i X_2160p60.mp4 -vf scale=1920:1080:flags=lanczos -c:v libx264 -preset slow -crf 18 -c:a copy X_1080p60.mp4`.
- Sonido según el estilo: con `sonido: voz`, la voz va tal cual (sin música ni compresión) y él la mezcla en su
  edición; mide y di el volumen integrado (Muse: −18,8 LUFS). Con efectos o música, `montar` hace antes la mezcla
  (`references/sonido.md`): voz + efectos + música a −14 LUFS, y las pistas sueltas en trabajo/pistas/. En los cortes
  secos de cara a animación suena un `barrido` suave.
- Mensaje final: tabla tiempo · plano · voz · pantalla, decisiones, discrepancias entre voz y datos, fuentes.

## 6. Detalles técnicos y errores ya resueltos

- `montar` codifica cada plano aparte con los mismos parámetros de x264 (misma base de tiempos) y los une sin
  recodificar; comprueba tamaño y número de fotogramas de cada pieza y del total frente a la voz.
- Planos de cara: `-ss (f − 0,4)/fps` antes de `-i` + `-frames:v n` → fotograma exacto. Plano corto: `crop` + `scale`
  lanczos (1,22 sobre 4K sigue nítido).
- **`--scale=2` salía a 1080p**: CDP `Page.captureScreenshot` captura a 1x aunque la página tenga
  deviceScaleFactor 2. `render.mjs` ya pasa `clip.scale`. `montar` avisa si el tamaño no cuadra.
- fps fraccionales (59,94): se guardan exactos en `fuente.json` (`fps_txt`) y la muestra de audio de cada fotograma
  se redondea (error < 1 ms, sin deriva).
- **Whisper duplica a veces la palabra del corte entre dos segmentos** («se integra con | con tu trabajo»). Antes de
  tomarlo por un tartamudeo, alinea: si una de las dos sale con puntuación ≈ 0 y muy corta, no se dijo; quítala del
  guion (Muse, parte 2).
- **Frases repetidas o arranques fallidos**: déjalos en `edicion/guion.txt` (se dicen, y el alineador necesita el
  texto real), cada uno en su línea, con `~` al principio de la línea que sobra. `alinear --toma` la alinea igual y
  `cortar` no la mete en el montaje (ni en `trabajo/guion.txt`). Escucha la duda con `anim.py envolvente` o mirando
  los tiempos: la buena suele ser la última.
