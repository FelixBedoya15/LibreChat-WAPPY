# Montaje: cara ↔ animación

Josema graba un tramo de su vídeo hablando a cámara y pasa el MP4. Se entrega montado: **sin pausas**, alternando
**planos de su cara** con **animaciones a pantalla completa** (nunca encima de su cara), con **su voz continua** de
principio a fin y cada animación clavada a la palabra que la dispara. Aprobados: la intro de Muse (28/09/2026,
`ejemplos/muse-intro.html`, «está perfecto») y la explicación que va justo después (29/09/2026,
`ejemplos/muse-explicacion.html`, «está espectacular»). Proyectos completos, con su `edicion/` y su README, en
`Videos Canal YouTube/Muse_Meta/Animaciones/muse-intro/` y `.../muse-explicacion/`.

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
python <skill>/scripts/anim.py transcribir --nombres "Muse, Meta, WhatsApp"   → edicion/guion.txt
   (corrige edicion/guion.txt: una frase por línea, nombres bien escritos, "~" delante de una toma repetida;
    borra un «Gracias.» final: Whisper se lo inventa en el silencio)
python <skill>/scripts/anim.py alinear --toma        → edicion/tiempos.json (palabras de la toma original)
python <skill>/scripts/anim.py cortar                → voz sin pausas, edicion/cortes.json, proxy 720p, montaje.json
python <skill>/scripts/anim.py alinear               → trabajo/tiempos.json (palabras de la voz ya cortada)
python <skill>/scripts/anim.py planos                → palabras con su fotograma, saltos de corte, revisión del montaje
   (escribe edicion/montaje.json; programa las escenas en index.html; revisar)
python <skill>/scripts/anim.py montar --res 1080     → borrador rápido; revisa ritmo, cortes y sincronía
python <skill>/scripts/anim.py montar                → final a la resolución de la toma (4K 60 fps si es 4K)
```

`nuevo --video` guarda la toma en `edicion/fuente.json` (tamaño, fps exactos) y su audio en `edicion/toma.wav`.
Todo lo del montaje vive en `edicion/`; la animación en `index.html` + `assets/` + `trabajo/`.

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
  a ~38 % de la altura. En el estudio de Josema (4K, pared de listones): cx ≈ 1740–1770, y0 = 0.
- Deja `edicion/cara_proxy.mp4` (720p, la toma sin pausas con la voz): la previsualización lo muestra en los
  planos de cara, y sirve para mirar fotogramas sin decodificar el 4K.
- Si `edicion/montaje.json` no existe, escribe el esqueleto (todo cara); si existe, no lo toca (avisa si ya no
  cuadra con el total de fotogramas).
- Deja `trabajo/guion.txt` (el guion sin las líneas con `~`) solo si no existe: si vuelves a cortar después de
  corregir `edicion/guion.txt`, bórralo antes para que se rehaga.
- Muse intro: 79 s → 37,97 s en 11 tramos. Muse explicación: 144 s → 75,02 s. Los datos y la voz se regeneran
  idénticos si repites el comando.

## 3. Repartir los planos (`edicion/montaje.json`)

```json
{ "fps": 60, "cerca": {"cx": 1738, "y0": 0},
  "planos": [
    {"tipo": "cara", "f0": 0,   "f1": 241, "zooms": [1.22]},
    {"tipo": "anim", "f0": 241, "f1": 734, "id": "trio"},
    {"tipo": "cara", "f0": 734, "f1": 952, "zooms": [1.0]}, … ] }
```

Fotogramas del vídeo sin pausas, seguidos de 0 al total. `zooms` se recorre en ciclo en cada salto de corte que
cae dentro del plano (1,0 = plano completo; 1,22 = plano corto centrado en la cara): los saltos parecen cambios de
cámara. `anim.py planos` imprime cada palabra con su fotograma y los saltos, y avisa de cortes dentro de una palabra,
planos demasiado cortos y huecos.

### Intro (Muse intro: 9 planos en 38 s, 61 % animación, media 4,2 s por plano)

cara 1,7 · **anim 8,7** · cara 4,1 · **anim 2,5** · cara 3,1 · **anim 1,7** · cara 2,7 · **anim 10,5** · cara 3,0 (s)

- **Empieza en cara** con el gancho y **corta a la animación en el nombre del producto** («Meta acaba de lanzar» →
  corte → «**Muse**»): la presentación del producto es el primer golpe visual.
- **Animación** para lo que se entiende mejor viéndolo: el producto y sus logos, con qué se conecta, precios y datos,
  mapas («solo en Estados Unidos»), listas («varios casos de uso: …»).
- **Cara** para lo personal y las bisagras: la promesa («yo te voy a enseñar…»), «El problema es que…», «Vamos a ver
  varios casos de uso:» (anuncia la lista que viene en animación) y **el cierre** («Vamos a ello»). Termina en cara.
- Una escena puede cubrir dos frases si evoluciona (presentación → conexiones, 8,7 s); una lista larga en animación
  aguanta 10 s si cada elemento entra al nombrarlo.

### Parte que explica conceptos (Muse explicación: 13 planos en 75 s, 64 % animación, media 5,8 s por plano)

| t (s) | Plano | Voz |
|---|---|---|
| 0–4,0 | cara, corto | «Muse es el nuevo agente de inteligencia artificial de Meta,» |
| 4,0–12,2 | **anim** | «similar a OpenClaw o Hermes. De momento lo puedes utilizar totalmente gratis con amplios límites semanales.» |
| 12,2–15,9 | cara, completo | «De hecho, todo lo que he realizado para este vídeo tan solo me ha gastado» |
| 15,9–19,0 | **anim** | «un 3 % de mi suscripción semanal.» |
| 19,0–22,1 | cara, corto | «Lo primero que tienes que saber es que no se trata de un» |
| 22,1–31,5 | **anim** | «Claude Code, Antigravity o Codex. Más bien, se trata de un asistente personal que se integra con tu trabajo…» |
| 31,5–35,5 | cara, completo | «Sería como un OpenClaw o un Hermes, pero de Meta.» |
| 35,5–41,7 | **anim** | «Y su punto clave es la integración, obviamente, con todo el ecosistema de herramientas de Meta.» |
| 41,7–43,6 | cara, corto | «De hecho, en este vídeo te voy a enseñar cómo,» |
| 43,6–56,2 | **anim** | «a base de clic, te vas a conectar a WhatsApp… Además, vive en un entorno en la nube de Meta…» |
| 56,2–60,5 | cara, completo | «Y funciona con los modelos de inteligencia artificial de Meta» |
| 60,5–68,9 | **anim** | «que a día de hoy ya se encuentra casi con la misma inteligencia que los más potentes. Y aunque solo está disponible en Estados Unidos,» |
| 68,9–75,0 | cara, corto | «esto no será un problema porque te voy a enseñar cómo puedes empezar a utilizarlo aunque estés fuera de allí.» |

- Más animación que cara, ~65 %: aquí se explican conceptos. La cara, para las **transiciones** («Lo primero que
  tienes que saber es que no se trata de un…» → corte a la animación en el primer nombre), las **repeticiones**
  («Sería como un OpenClaw o un Hermes, pero de Meta»: ya se vio), las **promesas** («te voy a enseñar…») y el **cierre**.
- Corta a la animación en la palabra que la abre, aunque sea a mitad de frase («…me ha gastado | un 3 %»,
  «…no se trata de un | Claude Code»): la voz sigue y la imagen responde justo a la palabra.
- Si dos ideas en animación van seguidas en la toma, van en la misma ventana con una transición dentro (el panel de
  conectores entra en la nube; las barras de modelos dan paso al mapa).
- Si la parte anterior (la intro) terminó en plano completo, empieza en plano corto; después alterna corto y completo
  en cada plano de cara.

### En los dos casos

- Duraciones: cara ≥ 1,5 s (menos se nota como un parpadeo), animación nueva ≥ 2,4 s. Una animación que **vuelve**
  (retoma una ya vista) puede durar 1,7 s: el mapa volvió en «sin tener que ser de allí» y la luz se extendió al mundo.
- **Dónde cortar**: en el hueco entre dos palabras, `floor((inicio − 0,03) × fps)` de la palabra que dispara la
  animación, o en un salto de la toma (ya es silencio). Corte seco: sin fundidos entre cara y animación.
- Las escenas que vuelven conectan partes del vídeo: el mapa de la intro reapareció en la explicación.

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
- Dentro de una ventana larga (12,6 s en «clic → nube»), nunca un hueco vacío: lo siguiente entra mientras sale lo
  anterior, o la misma pieza cambia de papel (el panel se encoge y entra en la nube).
- Previsualización (`node server.mjs`): en los planos de cara se ve el proxy con el encuadre del montaje (arriba a la
  derecha: «CARA · 1.22» o «ANIM · id»). Revisa el ritmo con la voz antes de montar.

## 5. Montar, revisar y entregar

- `anim.py montar --res 1080` (borrador: ~4,5 min para 38 s con 23 s de animación; ~8 min para 75 s con 48 s) y
  `anim.py planos --hoja out/<x>.mp4`: hoja con el fotograma de antes y el de después de cada corte
  (`trabajo/revision/cortes.png`). Comprueba que la cara no se corta en el plano corto, que la animación ya tiene
  contenido en su primer fotograma y que no hay saltos raros.
- `anim.py comprobar out/<x>.mp4 --palabras`: un fotograma 0,12 s después de cada palabra de `T` en el vídeo montado.
- Final: `anim.py montar --nombre <Tema>_<parte>` (4K 60 fps: intro de Muse ~13,5 min, explicación ~26 min; el render
  de la animación a 4K va a ~2,5 fps: lánzalo en segundo plano). Solo se renderizan las ventanas de animación.
- Copia `out/<nombre>_<alto>p<fps>.mp4` a la raíz de `Animaciones/` y haz también la versión 1080p (reescalada de la
  4K) para verla en el móvil:
  `ffmpeg -i X_2160p60.mp4 -vf scale=1920:1080:flags=lanczos -c:v libx264 -preset slow -crf 18 -c:a copy X_1080p60.mp4`.
- La voz va tal cual (sin música ni compresión): él la mezcla en su edición. Mide y di el volumen integrado
  (`ffmpeg -i X.mp4 -af ebur128 -f null -`; Muse: −18,8 y −19,0 LUFS).
- README del proyecto (el de `muse-explicacion/` es el modelo):

```
# <Tema> · <parte> — cara ↔ animación
Grabación `<ruta>` (<s> s, 4K 60 fps) → **<s> s** sin pausas, <n> planos (<x> % animación).
Entregas: `../<Tema>_<parte>_2160p60.mp4` (4K 60 fps) y `../<Tema>_<parte>_1080p60.mp4`.
## Montaje          tabla t (s) · Plano · Voz · Pantalla
## Decisiones       pausas (s → s), reparto de planos y por qué, datos mostrados de forma cualitativa…
## Datos (verificados el <fecha>)   cada dato con su enlace oficial
## Logos            de dónde sale cada uno
## Cómo rehacerlo   anim.py cortar · planos · node server.mjs · montar --res 1080 --nombre X · montar --nombre X
```

- Mensaje final: la tabla, decisiones, discrepancias entre voz y datos, fuentes.

## 6. Detalles técnicos y errores ya resueltos

- `montar` codifica cada plano aparte con los mismos parámetros de x264 (misma base de tiempos) y los une sin
  recodificar; comprueba tamaño y número de fotogramas de cada pieza y del total frente a la voz. La voz es
  `edicion/voz_cortada.wav` entera desde el fotograma 0: imagen y voz van clavadas por construcción.
- Planos de cara: `-ss (f − 0,4)/fps` antes de `-i` + `-frames:v n` → fotograma exacto. Plano corto: `crop` + `scale`
  lanczos (1,22 sobre 4K sigue nítido).
- `--reusar` salta las ventanas ya renderizadas con el tamaño y largo correctos: si cambias una escena, borra su
  `out/planos/<alto>/anim_<id>_bruto.mp4` antes.
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
- Rutas largas en Windows: `CreateProcess` no acepta carpetas de trabajo de más de 260 caracteres; si un proyecto
  de prueba vive muy hondo, créalo en una ruta más corta.
