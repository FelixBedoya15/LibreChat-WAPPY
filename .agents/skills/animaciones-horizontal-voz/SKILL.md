---
name: animaciones-horizontal-voz
description: "Convierte una locución en español (audio o transcripción con marcas de tiempo) en una animación horizontal para YouTube (HTML a MP4 1920x1080 a 60 fps) diseñada para ese audio concreto: lo que dice, cómo está contado y cómo suena (ritmo, pausas, énfasis). Mide cada palabra con alineación forzada, verifica los datos en fuentes oficiales, pone los logos reales y crea para cada vídeo su propio concepto visual con guías de estilo en vez de una plantilla fija, así que no salen dos iguales. Úsala SIEMPRE que el usuario pase un audio o voz en off (mp3, wav, m4a) o una transcripción con marcas y pida una animación, un vídeo animado, motion graphics, una intro o algo visual que acompañe lo que dice, o diga «como la de Astra vs Opus» o «como la de los escenarios», aunque no mencione sincronía ni formato; también para retocar o volver a renderizar una animación hecha con ella. Con solo audio, prefiérela a animaciones-horizontal-combinadas (esa es para vídeos grabados a cámara)."
---

# Animaciones horizontales que nacen de la voz

El usuario (creador de YouTube en español sobre IA, agentes y herramientas) graba una explicación y te pasa el
audio, o solo su transcripción con marcas de tiempo. Tú entregas un MP4 1920×1080 que la acompaña: cada idea
aparece en pantalla en el momento exacto en que la dice, con los nombres y logos reales y los datos comprobados.
Él lo monta encima o intercalado con su vídeo.

`<skill>` es la carpeta de esta skill. Los comandos se lanzan desde la carpeta del proyecto (salvo `entorno` y `nuevo`).

## La clave: la animación se diseña a partir de ESTE audio

Esto no es una plantilla que se rellena. Tienes un motor, piezas, guías y ejemplos, pero lo que se ve en pantalla lo
decide el audio: dos locuciones distintas dan dos animaciones distintas, aunque hablen del mismo tema. El audio te da
cuatro cosas y la animación responde a las cuatro:

| Del audio | Decide | De dónde lo sacas |
|---|---|---|
| **Qué dice**: protagonistas, cifras, relaciones, frases hechas | qué se dibuja | guion corregido + datos verificados |
| **Cómo está contado**: gancho, giros («pero», «la realidad es que»), enumeraciones, clímax, cierre | cómo se organiza y se encadena | leer el guion entero |
| **Cómo suena**: ritmo, pausas, palabras con énfasis, energía | cuándo cambia y dónde golpea | `anim.py escuchar` + tiempos exactos |
| **Con qué tono**: confesión, análisis, entusiasmo, ironía | cómo se mueve (curvas, rebotes, cámara, luz) | escucharlo entero |

Con eso cada vídeo tiene **su concepto visual**: una idea que recorre toda la animación y que sale de lo que dice
la voz, a menudo literalizando sus propias frases. Así se resolvieron las dos que marcan el listón:
- **Intro** (hecha solo con la transcripción): «me tengo que comer mis palabras… decía que Opus no me parecía para
  tanto» → su vieja cita aparece en un bocadillo gris que se tacha y se arruga; «pega un salto importante» → la
  tarjeta salta con líneas de velocidad; «el mejor modelo de OpenAI» → un hueco con corona donde aterriza el rival.
- **Escenarios**: «5 escenarios» → cinco huecos numerados que se rellenan justo al nombrar cada uno; «veremos qué tal
  se porta…» → el último es una carta que gira; cada tarjeta lleva el duelo de la cabecera.

El método completo, con estos dos casos desmontados frase a frase: `references/adaptar-al-audio.md`.

**Variedad.** Antes de diseñar, lee `registro.md` (aperturas, recursos centrales y paletas de las animaciones ya
hechas) y cambia al menos la apertura y el recurso central respecto a las últimas, salvo que el audio sea otra parte
de la misma serie: entonces mantén la identidad (colores, tarjetas de los protagonistas) y cambia los recursos. Los
ejemplos son el listón de calidad y una cantera de piezas, no una estructura que repetir. Si el audio pide algo que
el motor no tiene, créalo.

## Lo que se valora, por este orden

1. Que la animación vaya **exacta con el audio**.
2. Que los conceptos se entiendan a la primera, sobre todo las comparativas y **los nombres de cada modelo o
   herramienta** (oficiales y grandes).
3. Que sea limpia (pocos focos a la vez) y que los logos y los datos sean los reales.

El usuario prefiere recibir el vídeo terminado: decide tú (concepto, colores, recursos, tiempos) y explícalo al
final. Pregunta solo si falta el audio o si de verdad no se entiende qué hay que mostrar.

## 0. Entorno

`python <skill>/scripts/anim.py entorno` comprueba ffmpeg, Node 18+, Chromium de Playwright, faster-whisper,
torch/torchaudio, matplotlib y la GPU. Si falta algo: `anim.py entorno --instalar` (di antes qué vas a instalar y
para qué; el modelo de Whisper large-v3 pesa ~3 GB y el de alineación 1,2 GB, se descargan la primera vez).

## 1. Crear el proyecto

Crea el proyecto en la carpeta de animaciones del vídeo en curso (si el directorio de trabajo ya es esa carpeta,
ahí; si no, junto al resto del material del vídeo):

```
python <skill>/scripts/anim.py nuevo <carpeta>/<nombre-corto> <ruta/al/audio.mp3>
python <skill>/scripts/anim.py nuevo <carpeta>/<nombre-corto> --dur 41        (sin audio: solo transcripción)
```

Copia la plantilla (motor, renderizador, fuentes, herramientas de revisión), mete la voz en `assets/audio/`, pone la
duración en `CONFIG` e instala playwright-core. Un nombre provisional vale: renombrar la carpeta después es seguro.

## 2. Qué dice: transcribir y corregir

```
python <skill>/scripts/anim.py transcribir --nombres "Claude Opus 5.5, GPT-6 Astra, OpenAI"
```

Deja el texto en `trabajo/guion.txt`. **Corrígelo**: una frase por línea, nombres y cifras como deben verse en
pantalla. Whisper se equivoca en los nombres propios («Fiber» por «Fable», «leads» por «reels»): contrasta con el
contexto del vídeo (carpetas, otros proyectos) y con la web. Si en la primera pasada no conocías los nombres, repite
con `--nombres` (no pisa un guion ya corregido). Después **lee el guion entero** y escribe en tres líneas qué tiene
que quedar, cuál es el giro y cuál es el tono (va al README).

**Sin audio** (transcripción con marcas «00:05», «00:10»…): guárdala tal cual en `trabajo/transcripcion_marcas.txt`
(el texto antes de la primera marca empieza en 0:00), corrige nombres y ejecuta
`anim.py estimar trabajo/transcripcion_marcas.txt`: reparte cada frase por sílabas desde su marca. Son tiempos
**estimados** (±0,3–0,5 s dentro de la frase): pon lo principal de cada frase en su marca y el resto con entradas que
toleren algo de desfase. Al entregar, ofrece clavarlo al milisegundo si te pasa el audio de esa toma.

## 3. Tiempos exactos de cada palabra

```
python <skill>/scripts/anim.py alinear
python <skill>/scripts/anim.py envolvente <palabra o índice> ...     (comprobación)
```

Alineación forzada del guion corregido sobre el audio (`trabajo/tiempos.json`): los inicios caen donde empieza de
verdad cada palabra. Whisper va 0,1–0,45 s adelantado, así que nunca uses sus tiempos para sincronizar. Pronunciaciones
(`GPT-6{yi pi ti six}`), puntuaciones bajas, la última palabra y cómo probar variantes: `references/sincronia.md`.

## 4. Cómo suena: escuchar

```
python <skill>/scripts/anim.py escuchar       → trabajo/escucha.md + trabajo/escucha.png (mapa de la voz)
```

Ritmo de cada frase (pausado, medio, rápido), pausas (dónde cabe un cambio de escena), palabras que destacan en la voz
(candidatas a acento visual) y energía por frase (dónde está el clímax). Mira el mapa de la voz: es la partitura sobre
la que vas a componer. Sin audio da el ritmo y las pausas entre frases; el énfasis lo decide el significado.

## 5. Datos y logos

- Lista las entidades (empresas, modelos con versión, precios, cifras) y **verifícalas en fuentes oficiales** con
  WebSearch/WebFetch, abriendo la página oficial (no te quedes con el resumen del buscador). Si la voz redondea,
  muestra el dato real sin contradecirla; si dice algo falso, no lo pongas como hecho y avisa. `references/datos-y-logos.md`.
- Logos: `anim.py logos "Claude" "OpenAI" "Instagram"` → `assets/logos/` listos para fondo oscuro; revísalos con
  `anim.py ver-logos`. En la animación: `logo('slug', tamaño)`, `tarjeta({logo: 'slug', ...})`, `nodo({logo: 'slug', ...})`.
- Iconos: la plantilla trae ~100 de Lucide; para otro, `anim.py iconos nombre-en-lucide` (nunca de memoria).

## 6. Concepto y guion visual

Aquí se decide todo. Con el guion, `escucha.md` y `registro.md` delante:
1. **Concepto visual**: la idea que recorre la animación, sacada de una frase del audio (a menudo la que lo resume o
   la frase hecha que usa). Una idea central y piezas que la sirven.
2. **Identidad**: un color por protagonista (marca real), el mismo todo el vídeo; si es parte de una serie, la de la serie.
3. **Partitura**: tabla voz → pantalla con una columna «por qué» que diga qué del audio lo pide (va al README):

| t (s) | Voz | Pantalla | Por qué |
|---|---|---|---|
| 10.20 | «La realidad es que…» | la vieja cita se tacha en rojo y se arruga | giro del relato + «comerse las palabras» literal |

   - Una idea visual por frase; lo principal entra 0,02–0,05 s antes de su palabra (tarde se nota; antes, no).
   - Cambios de escena grandes en las pausas largas; acentos en las palabras que destacan en la voz **y** importan
     por significado; ritmo de las entradas según el ritmo de cada frase.
   - Continuidad: la misma pieza viaja de escena en escena (cambia de sitio, tamaño o estado) en vez de desaparecer.
   - Texto justo: nombres y chips de 3–5 palabras como mucho (la frase ya la dice la voz). Siempre algo vivo: ningún
     plano quieto más de ~2 s.
   - El último plano aguanta hasta el final del audio.
4. **Control**: ¿se entendería sin sonido? ¿cada escena la pide una frase de este audio? ¿es distinta de las últimas
   del registro? Preguntas completas en `references/adaptar-al-audio.md` § 9.

Guías de estética, color, legibilidad, cámara e ideas que ya funcionaron (inspiración, no receta): `references/diseno.md`.

## 7. Construir la animación

Trabaja en el `index.html` del proyecto: conserva el motor y sustituye todo lo marcado como DEMO por tus escenas.
Cada fotograma es una función pura de `t`: escenas como funciones `escenaX(t)` que colocan sus piezas con `put()` y
las ocultan con `off()` fuera de su tramo, y fotogramas clave con `norm()` + `KF()` para lo que viaja. Motor, piezas
incluidas y errores conocidos: `references/motor.md`. Piezas ya resueltas en `ejemplos/` (bocadillo que se tacha, salto,
hueco con corona, huecos numerados, carta que gira, balanza, escalera, barras, flujos, móvil con chat): cópialas si
encajan con tu concepto y transfórmalas; si no hay ninguna que diga lo que dice el audio, créala con el mismo lenguaje.

Previsualización: `node server.mjs` → http://127.0.0.1:5178/ (espacio, flechas, `?t=12.5`; sin audio corre con un reloj).

## 8. Revisar antes de renderizar

```
python <skill>/scripts/anim.py revisar 3.1 4.9 7.6 9.9 13.2 ...        (hoja de contactos en trabajo/revision/)
```

Instantes con cada escena completa, 2–3 dentro de cada transición y los de las palabras clave; mira la hoja y 2–3
fotogramas **a tamaño real**. Repasa la lista de `references/diseno.md` § 8. Corrige y repite: revisar tarda
segundos; renderizar, minutos.

## 9. Render, entrega y registro

```
python <skill>/scripts/anim.py render                  (1080p60 con la voz; sin audio sale sin pista; ~4 min por 45 s)
python <skill>/scripts/anim.py comprobar --palabras    (pistas, arranque, hoja del MP4 y un fotograma por tiempo de T)
```

Lanza el render en segundo plano y espera a que termine. En la hoja de palabras (`trabajo/comprobar/palabras_N.png`)
cada fotograma es 0,12 s después de su palabra: lo que dispara ya tiene que estar entrando. Después:
1. Copia el vídeo a la carpeta de animaciones del vídeo con un nombre descriptivo: `<Tema>_<escena>_1080p60.mp4`.
2. `README.md` del proyecto: las tres líneas del paso 2, el concepto, la partitura, datos con fuentes, logos,
   decisiones y cómo volver a renderizar.
3. **Añade una fila a `<skill>/registro.md`** (fecha, vídeo, concepto, apertura, recurso central, paleta, cierre).
4. Envía el MP4 con SendUserFile (si pesa más de 30 MB solo llega en la app de escritorio: dilo).
5. Mensaje final corto: la partitura resumida, qué decidiste y por qué desde el audio, discrepancias entre la voz y
   los datos, y las fuentes (enlaces).

Otros formatos: `anim.py render --noaudio` (sin la voz), `--scale=2 --fps=30` (4K).

## Iterar con el feedback

- Cambios de esta animación: edita el `index.html`, revisa y vuelve a renderizar. Guarda antes la versión anterior.
- Si algo valdría para todas (un tamaño, una pieza, un criterio), llévalo a `<skill>/plantilla/` o a la guía que
  corresponda, para que las siguientes lo aprovechen. Si el usuario rechaza un recurso, elimínalo de la skill.
- Si una animación sale especialmente bien, añádela a `ejemplos/` con su tabla en `ejemplos/README.md`.

## Referencias

- `references/adaptar-al-audio.md`: el método (qué dice, cómo está contado, cómo suena, tono → concepto y partitura),
  variedad y casos resueltos. **Léelo antes del paso 6, siempre.**
- `references/diseno.md`: estética, color, legibilidad, ritmo, ideas que ya funcionaron, cámara, lista de revisión.
- `references/sincronia.md`: transcribir, corregir, alinear, estimar sin audio, comprobar.
- `references/motor.md`: el motor de la plantilla, sus piezas y errores conocidos. Léelo antes del paso 7.
- `references/datos-y-logos.md`: verificación de datos, buscador de logos, colores de marca.
- `registro.md`: animaciones ya hechas (para no repetirse).
- `ejemplos/README.md`: las animaciones entregadas, escena por escena, con cómo se adaptó cada una a su audio.
