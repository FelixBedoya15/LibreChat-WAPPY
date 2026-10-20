---
name: animaciones-horizontal-combinadas
description: "Crea animaciones en vídeo sincronizadas palabra a palabra con la voz de Josema para YouTube, con logos reales y datos verificados. Cuatro modos: animación a pantalla completa sobre una voz en off; intro a cámara sin pausas alternando su cara con animaciones; capas sobre su vídeo (texto y logos detrás de su cabeza, iconos que le rodean, contorno luminoso, fondo sustituido, tarjetas de interfaz, subtítulos); o combinado con transiciones sin corte. Cada vídeo, con su propia dirección de arte, efectos de sonido y música libre de derechos. Úsala SIEMPRE que pase un audio, una transcripción con marcas o un vídeo suyo hablando a cámara y pida animaciones, motion graphics, quitar pausas, efectos sobre su vídeo, subtítulos o sonido, o diga «como la de Hermes / Astra vs Opus / Muse / editado por IA» o «como el vídeo de referencia»; también para retocar algo hecho con ella. Reels verticales, también con animaciones sincronizadas con su voz: editor-reels; esta, con --vertical, solo si en el reel quiere capas detrás y delante de él, fondo sustituido o transiciones sin corte. Diapositivas: presentaciones-interactivas-josema. Si solo hay audio o transcripción (sin grabación a cámara) y está instalada animaciones-horizontal-voz, prefiérela. Si hay grabación a cámara y solo quiere quitar pausas y alternar su cara con animaciones a pantalla completa, sin capas, efectos ni música (como la intro o la explicación de Muse), y está instalada animaciones-horizontal-cara, prefiérela."
---

# Animaciones sincronizadas con la voz

Josema (canal de YouTube en español sobre IA, agentes y herramientas como Claude Code) graba una explicación
y te pasa el audio. Tú entregas un MP4 que la acompaña: cada idea aparece en pantalla justo cuando la dice,
con los nombres y logos reales de lo que menciona y los datos comprobados. Él lo monta encima de su vídeo.
O te pasa **la grabación de una intro a cámara** y le entregas la intro montada: sin pausas y con su voz continua,
alternando su cara con animaciones a pantalla completa o con la animación integrada en la grabación.

Lo que valora, por este orden: que **la animación vaya exacta con el audio**, que se entiendan los conceptos
(sobre todo las comparativas y **los nombres de cada modelo o herramienta**), que sea limpia y que los logos
y datos sean los reales. Prefiere recibir el vídeo terminado: aparte de la tanda de preguntas de estilo del
principio, decide tú (colores, recursos visuales, tiempos), no le pidas decisiones técnicas y explícalas al final.
Pregunta solo si falta el audio o si de verdad no se entiende qué hay que mostrar.

`<skill>` es la carpeta de esta skill. Los comandos se lanzan desde la carpeta del proyecto (salvo `entorno` y `nuevo`).
En `ejemplos/` están las animaciones que ya se le entregaron (Astra vs Opus 1 y 2, Hermes Agent, la intro de Muse con
cara ↔ animación y su versión con capas, la intro «editado por IA» en modo combinado («brutal») y su reel vertical):
úsalas como **listón de calidad y almacén de piezas, nunca como plantilla**.

**Cada vídeo, el suyo** (Josema, 30/09/2026: «si la uso con otros vídeos hace exactamente lo mismo»). Las guías dicen
cómo hacerlo bien (sincronía, legibilidad, datos, sonido, lo que ya ha rechazado); lo que se ve sale de ESTE vídeo:
qué dice, cómo lo dice (ritmo, pausas, énfasis) y cómo es su plano. Antes de diseñar: `anim.py lectura` y un concepto
propio en `trabajo/concepto.md` (idea central, fondo, acabado, tipografía, paleta, movimiento, transiciones, pieza
firma, música), distinto del de los últimos vídeos (`anim.py historial`). Todo en `references/direccion.md`.

## Antes de empezar: modo y estilo

| Modo | Entrada | Qué se entrega | Guía |
|---|---|---|---|
| **audio** | voz en off o transcripción con marcas | animación a pantalla completa que acompaña la voz | pasos 1–8 de abajo |
| **cara** | vídeo a cámara | su cara sin pausas alternando con animaciones a pantalla completa | «Intro grabada a cámara» + `references/intro-con-cara.md` |
| **capas** | vídeo a cámara | su cara siempre visible con la animación integrada (detrás y delante de él) | `references/capas-sobre-video.md` |
| **combinado** | vídeo a cámara | capas + planos de animación a pantalla completa con transiciones sin corte | `references/capas-sobre-video.md` |

Al empezar un proyecto nuevo, **primero entiende el vídeo y después pregunta**:
1. `anim.py nuevo` (con valores provisionales), `anim.py transcribir` (`--toma` si es una grabación) y
   `anim.py lectura` (ritmo, pausas y énfasis de la voz, cifras, nombres, estructura, colores del plano e historial).
2. **Una sola tanda de preguntas** (AskUserQuestion): modo (si hay vídeo), **dirección visual** (2–3 conceptos
   pensados para ESTE vídeo, cada uno con su fondo, acabado, tipografía y acento; el que mejor encaja primero),
   sonido (voz + efectos + música / voz + efectos / solo voz) y densidad (la que sugiere la lectura, primero).
   Detalles y valores por defecto: `references/estilos.md`.
3. Lo elegido va a `anim.py estilo --modo --tema --fondo --acabado --tipo --acento --sonido --musica --densidad
   --subtitulos` (queda en `ESTILO`, index.html) **antes de `anim.py cortar`**, y el concepto completo a
   `trabajo/concepto.md`.

No preguntes si ya lo dijo, si es un retoque o si dice «solo ejecuta»: elige tú el concepto (distinto del último vídeo)
y cuéntalo al final. Fuera de esa tanda, decide tú todo lo demás sin preguntar.

## Intro grabada a cámara: cara ↔ animación (modo cara)

Si Josema pasa un MP4 hablando a cámara (la intro de un vídeo) y pide quitar las pausas y meter animaciones que se
alternen con su cara (no encima), lee `references/intro-con-cara.md` y sigue este flujo. Las animaciones se diseñan y
programan igual que siempre (pasos 3 a 7); cambian el principio (la voz sale de la toma sin pausas) y el final:

```
anim.py nuevo <Animaciones>/<nombre> --video <grabación.mp4>        (y cd a la carpeta)
anim.py transcribir --toma --nombres "..."   → corrige edicion/guion.txt ("~" delante de una toma repetida)
anim.py alinear --toma                       → palabras de la toma original
anim.py cortar                               → voz sin pausas (assets/audio/voz.wav), cortes, proxy, encuadre de la cara
anim.py alinear                              → palabras de la voz cortada (trabajo/tiempos.json)
anim.py planos                               → fotograma de cada palabra; reparte cara/animación en edicion/montaje.json
anim.py montar --res 1080 / anim.py montar   → borrador y final (a la resolución de la toma: 4K 60 fps si es 4K)
```

Lo esencial: empieza en cara con el gancho y corta a la animación justo en el nombre del producto; animación para
logos, conexiones, datos, mapas y listas; cara para la promesa personal, las bisagras («El problema es que…») y el
cierre. Cortes secos entre palabras o en saltos de la toma; en los saltos dentro de un plano de cara, alterna plano
completo y plano corto (`zooms`). Cada escena se pinta solo dentro de su ventana (`dentro(t, V.id)`) y ya tiene
contenido en su primer fotograma.

## Capas sobre el vídeo (modos capas y combinado)

Lee `references/capas-sobre-video.md`. Mismo principio que el modo cara (`nuevo --video --modo combinado`, transcribir,
alinear, cortar, alinear) y después:

```
anim.py recortar                             → silueta de la persona en cada fotograma (GPU, ~2 min por 40 s de 4K)
anim.py planos                               → reparte edicion/montaje.json («cara» con capas, «anim» a pantalla completa)
   (escenas en index.html + estadoVideo(t): cuánto se ve la sala, la persona, el halo, el desenfoque…)
anim.py golpe --en <t del revelado>          → desde qué segundo del tema épico empezar para que un golpe caiga ahí
anim.py montar --res 1080 / anim.py montar   → borrador y final, con la mezcla de sonido
```

Lo esencial: lo que tiene que sentirse «en la habitación» va detrás de la persona (titular gigante, logo de la
empresa) y la interfaz delante (tarjetas, buscador, notificación); cada palabra fuerte, un efecto (tabla voz → efecto
en la guía); punch-ins de 1,08 en los saltos; los cambios a pantalla completa, sin cortes cuando se pueda (la
grabación se encoge a una ficha, iris, cuchilla). Las piezas nuevas están en `motor/piezas.js` y declaran su sonido
solas. El motor trae una biblioteca amplia (línea de tiempo, visor REC, panel de tareas, explorador con arrastrar y
soltar, revelado con haces de luz, paneles de concepto, ruta de pasos, tarjeta de regalo, órbitas, rótulos…) y seis
fondos: **elige según el concepto de este vídeo y no copies la estructura de `ejemplos/editado-por-ia.html`** (sirve
para ver cómo se usa cada pieza, no para repetir su guion). La demo de Muse con capas se parece demasiado al vídeo de
referencia.

## Reel vertical (Instagram, TikTok, Shorts)

Los reels van normalmente con la skill **editor-reels** (su cara con piezas debajo, escenas a pantalla completa,
subtítulos y sonidos, todo sincronizado con su voz). Hazlo aquí solo si en el reel quiere lo que aquella no hace: capas
detrás y delante de él, fondo sustituido, contorno luminoso o transiciones sin corte. Entonces es el mismo flujo de capas
o combinado, con `anim.py nuevo ... --vertical` (1080×1920):
- **Encuadre:** la grabación horizontal ocupa el 88 % del alto, con el borde de abajo en el de la pantalla y centrada en su
  cara; el hueco de arriba estira la primera fila (la pared de listones sigue). Se ajusta en `edicion/montaje.json` →
  `"vertical": {"alto": 1686, "cx": <centro x de la cara>, "fy": <centro y de la cara>}` (px de la toma).
- **Zonas:** su cara ocupa y ≈ 300–980. La interfaz va por debajo de la barbilla (y ≈ 1040–1480) y los subtítulos en
  y ≈ 1520, con fondo oscuro (se leen sobre la camiseta). Nada importante en los 220 px de arriba ni por debajo de
  y ≈ 1560: ahí va la interfaz de Instagram. Lo que va detrás de la cabeza (`TituloGigante`), a y ≈ 350.
- **Render:** `anim.py montar` sale siempre a 1080×1920 con el juego de capas de la altura de la toma (nítido);
  `--res 720` para un borrador rápido.
- **Referencia técnica:** `ejemplos/reel-editado-por-ia.html` (ficha vertical, zonas seguras, subtítulos con fondo,
  `LineaBruto`, `Comentario`). El diseño, el del concepto de ESE reel: no repitas sus piezas ni su orden.

## 0. Entorno

`python <skill>/scripts/anim.py entorno` comprueba ffmpeg, Node 18+, Chromium de Playwright, faster-whisper,
torch/torchaudio y la GPU. Si falta algo: `anim.py entorno --instalar` (dile antes qué vas a instalar y para qué;
el modelo de Whisper large-v3 pesa ~3 GB y el de alineación 1,2 GB, se descargan la primera vez). Las intros a cámara,
el mapa y los logos a mano usan además OpenCV, scipy, scikit-image, matplotlib y Pillow (opcionales; `--instalar` los pone).

## 1. Crear el proyecto

Las animaciones de cada vídeo viven en una carpeta `Animaciones/` dentro de la carpeta del vídeo
(p. ej. `Videos Canal YouTube/<Vídeo>/Claude_Code/Animaciones/`). Si el directorio de trabajo ya es esa
carpeta, crea el proyecto ahí; si no, búscala o créala junto al resto del material del vídeo.

```
python <skill>/scripts/anim.py nuevo <Animaciones>/<nombre-corto> <ruta/al/audio.mp3>
```

Copia la plantilla (motor, renderizador, fuentes, herramientas de revisión), mete la voz en
`assets/audio/`, pone la duración en `CONFIG` e instala playwright-core. Si aún no sabes de qué habla el audio,
usa un nombre provisional (p. ej. el del archivo de audio): renombrar la carpeta después es seguro.

## 2. Qué dice la voz

```
python <skill>/scripts/anim.py transcribir --nombres "Claude Opus 5.5, GPT-6 Astra, OpenAI"
```

Deja el texto en `trabajo/guion.txt`. Si en la primera pasada los nombres salen mal y aún no los conocías,
repite con `--nombres`: reescribe `guion.txt` mientras no lo hayas corregido (la última transcripción queda
siempre en `guion_whisper.txt`). **Corrígelo**: una frase por línea, nombres y cifras como deben verse
en pantalla. Whisper se equivoca en los nombres propios ("Fiber" por "Fable", "Ultra" por "Astra"):
contrasta con el contexto del vídeo (nombre de la carpeta, otros proyectos) y con la web. Después lee el guion
entero y entiende el argumento: qué se compara, qué conclusión quiere que quede.

### Sin audio: solo la transcripción con marcas de tiempo

Si Josema pasa el texto con marcas ("00:05", "00:10"…) y pide la animación sin audio (una intro que irá encima
de su vídeo, por ejemplo):
1. `anim.py nuevo <Animaciones>/<nombre> --dur <última marca + 4–6 s>` crea el proyecto sin voz: la previsualización
   corre con un reloj y el render sale sin pista de sonido.
2. Guarda el texto en `trabajo/transcripcion_marcas.txt`, tal cual. El texto antes de la primera marca empieza en 0:00.
   Corrige nombres ("openie G P t 6" → "OpenAI, GPT-6").
3. `anim.py estimar trabajo/transcripcion_marcas.txt` reparte las palabras de cada frase por sílabas desde su marca y
   escribe `trabajo/tiempos.json`. Son **estimados**: ±0,3–0,5 s dentro de cada frase. Pon el visual principal de cada
   frase en su marca, y los secundarios con animaciones que toleren algo de desfase.
4. Al entregar, díselo y ofrécele clavarlo al milisegundo si te pasa el audio de esa toma (proyecto con audio +
   `transcribir` + `alinear`). Todo lo demás del proceso es igual.

## 3. Datos y logos

- Lista las entidades (empresas, modelos con versión, precios, cifras) y **verifícalas en fuentes oficiales**
  con WebSearch/WebFetch. Si la voz redondea, muestra el dato real sin contradecirla; si dice algo falso,
  no lo pongas como hecho y avisa. Detalles y ejemplo real en `references/datos-y-logos.md`.
- Logos: `python <skill>/scripts/anim.py logos "Claude" "OpenAI" "Anthropic"` → `assets/logos/` listos para fondo
  oscuro. Compruébalos con `anim.py ver-logos` (hoja `trabajo/revision/logos.png` sobre el fondo real). En la animación:
  `logo('slug', tamaño)`, `tarjeta({logo: 'slug', ...})` o `nodo({logo: 'slug', ...})`. Si alguno no aparece o es de
  baja calidad, búscalo en el kit de prensa oficial.
- Logo de un solo trazo (una firma, la «m» de Muse): `anim.py logo-trazo icono.png` lo vectoriza (contorno + eje) para
  que se escriba a mano en pantalla (piezas `museSVG`/`museDibujo` de `ejemplos/muse-intro.html`).
- Mapa del mundo en puntos («solo disponible en…», «en todo el mundo»): `anim.py mapa --marcar USA,ESP`.
- Iconos: la plantilla trae ~100 de Lucide; para otro, `anim.py iconos nombre-en-lucide` lo descarga y lo añade al `index.html`
  (no los escribas de memoria).

## 4. Tiempos exactos de cada palabra

```
python <skill>/scripts/anim.py alinear
python <skill>/scripts/anim.py envolvente <palabra o índice> ...     (comprobación)
```

`alinear` hace alineación forzada del guion corregido sobre el audio (`trabajo/tiempos.json`): los inicios caen
donde empieza de verdad cada palabra. Whisper va 0,2–0,45 s adelantado, así que **nunca uses sus tiempos para
sincronizar**. `envolvente` imprime dónde sube de verdad la energía en cada palabra pedida y dónde termina la voz.
Pronunciaciones raras (`GPT-6{yi pi ti six}`), puntuaciones bajas, la última palabra y cómo probar variantes sin
pisar `tiempos.json` (`alinear --salida`): `references/sincronia.md`.
Copia al objeto `T` del `index.html` los inicios de las palabras que disparan algo (`T.astra = 22.03`).

## 5. Concepto y guion visual

Primero el concepto (`trabajo/concepto.md`, `references/direccion.md`): la idea central que ordena el vídeo, su
dirección de arte y su pieza firma. Después, antes de programar, la tabla voz → pantalla (va luego al README y al
mensaje final); si el estilo lleva sonido, con su columna:

| t (s) | Voz | Pantalla | Sonido |
|---|---|---|---|
| 4.64 | "Opus 5.5 frente a…" | entra la tarjeta Claude Opus 5.5 por la izquierda; su logo cae en la balanza | aire · golpe corto en «Opus» |

Cómo pensarla (el porqué y el catálogo completo están en `references/diseno.md`):
- **Una idea visual por frase**, que entra 0,02–0,05 s antes de su palabra. Tarde se nota; un pelo antes, no.
- **Los golpes salen de su voz**: las palabras que remarca (`anim.py lectura`) y los giros del argumento, no un
  patrón fijo cada N segundos. Varía la duración de los planos y el tipo de entrada según el ritmo de cada frase.
- **Los protagonistas son tarjetas con logo y nombre grande** (familia + nombre + versión: "Claude · Opus 5.5").
  Un color por protagonista durante todo el vídeo; en comparativas, A a la izquierda y B a la derecha.
- **Busca el dibujo del concepto, no el texto**: comparar → VS o balanza; "no hay color" → el perdedor pierde el
  color; gamas → escalera con "="; precios → barras con valores reales; expectación → carta que gira;
  instalar, conectar apps, usar desde el móvil → cables, huecos que se rellenan, móvil con chat.
- **Continuidad**: la misma tarjeta viaja de escena en escena (cambia de sitio y tamaño) en vez de desaparecer.
- Nada de subtítulos ni frases largas: chips de 3–5 palabras como mucho. Nada quieto más de ~2 s.
- Titular solo cuando la voz anuncia un tema o una sección ("las reglas de la comparación", "5 escenarios");
  si describe algo concreto (un agente que resume el correo), dibújalo desde el primer segundo.
- El último plano aguanta hasta el final del audio.
- Ritmo según la densidad elegida (`references/estilos.md` § 5).
- **Sonido** (si el estilo lo lleva): cada pieza que entra o sale suena, con la tabla de `references/diseno.md` § 5
  y `references/sonido.md` § 3; `sfx(t, 'nombre')` una vez por golpe visual, nunca por fotograma.

## 6. Construir la animación

Trabaja en el `index.html` del proyecto: conserva el motor y sustituye todo lo marcado como DEMO por tus escenas.
Cada fotograma es una función pura de `t`: escenas como funciones `escenaX(t)` que colocan sus piezas con
`put()` y las ocultan con `off()` fuera de su tramo, y fotogramas clave con `norm()` + `KF()` para lo que viaja.
API del motor, piezas incluidas (tarjeta, nodo de flujo con hueco que se rellena, chip que se escribe palabra a
palabra, VS/=, barras, cables con paquetes y piezas que viajan, anillos, títulos letra a letra, iconos, cámara) y
errores conocidos: `references/motor.md`.
Para piezas más elaboradas (balanza con física, carta que gira, escalera de gamas, móvil con chat), copia de
`ejemplos/` (índice en `ejemplos/README.md`).

Previsualización con audio: `node server.mjs` → http://127.0.0.1:5178/ (espacio, flechas, `?t=12.5`).

## 7. Revisar antes de renderizar

```
python <skill>/scripts/anim.py revisar 3.1 4.9 7.6 9.9 13.2 ...        (hoja de contactos en trabajo/revision/)
```

Elige los instantes en que cada escena está completa, 2–3 instantes dentro de cada transición y los momentos
de las palabras clave; mira la hoja y además 2–3 fotogramas sueltos **a tamaño real** (legibilidad).
Repasa la lista de `references/diseno.md` § 8: nombres oficiales y legibles, logos correctos, cada cosa con su
palabra, nada cortado ni superpuesto, cifras iguales a la fuente. Corrige y repite: revisar tarda segundos,
renderizar unos minutos.

## 8. Render y entrega

```
python <skill>/scripts/anim.py historial --comprobar   (antes: ¿se parece demasiado al último vídeo?)
python <skill>/scripts/anim.py render        (1080p60 con la voz; ~4 min por cada 45 s)
python <skill>/scripts/anim.py comprobar --palabras   (pistas, arranque de audio y vídeo, hoja del MP4 y un
                                                      fotograma del MP4 en cada tiempo de T)
```

Con efectos o música, `render` (y `montar`) rehacen antes la mezcla (`anim.py sonido`: voz + efectos + música a
−14 LUFS → assets/audio/mezcla.wav, y las pistas sueltas en trabajo/pistas/). Lanza el render en segundo plano y
espera a que termine. Mira las hojas de `comprobar`: en la de palabras
(`trabajo/comprobar/palabras_N.png`) cada fotograma es 0,12 s después de su palabra y lo que dispara ya tiene que
estar entrando. Después:
1. Copia el vídeo a la raíz de `Animaciones/` con un nombre descriptivo: `<Tema>_<escena>_1080p60.mp4`.
2. Escribe `README.md` en el proyecto: el concepto, tabla voz → pantalla (y sonido) con tiempos, datos con sus
   fuentes, logos usados, estilo elegido, música (tema y licencia), decisiones tomadas y cómo volver a renderizar.
   Apunta el vídeo en el historial: `anim.py historial --anotar --titulo "…"`.
3. Envía el MP4 con SendUserFile. Si pesa más de 30 MB solo le llega en la app de escritorio, no en el móvil: díselo.
4. Mensaje final, corto: qué se ve en cada momento (la tabla), qué has decidido tú, cualquier discrepancia
   entre la voz y los datos, las fuentes (enlaces) y, si lleva música, qué tema es y que es libre de derechos.

En una intro a cámara no se usa `render` a pelo: `anim.py montar` renderiza solo los planos de animación y los
intercala con la grabación (ver `references/intro-con-cara.md` § 5, con la revisión de los cortes).

Si Josema quiere la animación sin la voz: `anim.py render --noaudio`. Otro formato (4K, 30 fps):
`anim.py render --scale=2 --fps=30` (a 4K el render va a ~2,5 fps; comprueba el tamaño del MP4 con `comprobar`).

## Iterar con el feedback

- Cambios de esta animación (un tiempo, un texto, un color): edita el `index.html`, revisa y vuelve a renderizar.
- Si Josema rechaza o pide cambiar algo que valdría para todas (un tamaño, un recurso que no le gusta),
  cámbialo también en `<skill>/plantilla/` o apúntalo en `references/diseno.md` § 7 con el motivo, para no repetirlo.
- Si una animación nueva sale especialmente bien, añádela a `ejemplos/` con su tabla en `ejemplos/README.md`; si sus
  piezas valen para otros vídeos, pásalas a `plantilla/motor/` (como las de «editado por IA») y documéntalas en
  `references/motor.md` § 10.
- Guarda la versión anterior (vídeos e `index.html`) antes de rehacer algo: Josema compara y a veces vuelve atrás.
- **Lo que ya ha rechazado** (detalle en `references/diseno.md` § 7; no lo repitas): golpes cortos de zoom sobre su
  grabación («tambaleo»); recursos calcados del vídeo de referencia (espacio con suelo de rejilla, carpeta con tapa,
  revelado con anillos y confeti, INTELIGENCIA ARTIFICIAL detrás de él); corchetes o «CARA DETECTADA» sobre su cara;
  iconos «de IA» (varita, destellos); cualquier cosa que parpadee; listas o pasos que no dan tiempo a leer; **que dos
  vídeos se parezcan** (mismo fondo, piezas y orden). En las intros quiere música épica que pegue, con un golpe
  cuadrado con el revelado (`anim.py golpe`).

## Referencias

- `references/direccion.md`: **cada vídeo, el suyo**: leer el vídeo, el concepto, el menú de fondos, acabados,
  tipografías, paletas, transiciones y piezas, el historial y la pieza firma. Léelo antes de las preguntas y del paso 5.
- `references/sincronia.md`: transcribir, corregir, alinear y comprobar; cómo usar los tiempos. Léelo antes del paso 4.
- `references/diseno.md`: estética, color, legibilidad, ritmo, catálogo voz → recurso, cámara, qué evitar, lista de revisión. Léelo antes del paso 5.
- `references/motor.md`: el motor de la plantilla, sus piezas y los errores conocidos. Léelo antes del paso 6.
- `references/datos-y-logos.md`: verificación de datos, buscador de logos y colores de marca.
- `references/intro-con-cara.md`: intro grabada a cámara (quitar pausas, repartir planos cara ↔ animación, montar, revisar).
- `references/estilos.md`: los cuatro modos, las preguntas del principio, valores por defecto y densidad.
- `references/capas-sobre-video.md`: modos capas y combinado (recorte, capas, estadoVideo, recursos, transiciones, montaje).
- `references/sonido.md`: efectos (biblioteca, qué suena al entrar y al salir), música libre de derechos y mezcla.
- `ejemplos/README.md`: las animaciones aprobadas, escena por escena, con dónde está cada pieza en su código.
