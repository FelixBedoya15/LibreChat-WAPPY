# Ejemplos reales (animaciones entregadas a Josema)

Son el `index.html` completo de las animaciones terminadas (nueve). Léelos para **ver el nivel y copiar piezas**, no
para empezar desde ellos ni para repetir su guion, su fondo, su paleta o su orden: la base de un proyecto nuevo es
siempre `plantilla/` y su diseño sale del concepto de ese vídeo (`references/direccion.md`).
Busca las funciones por nombre; cada una es una pieza autocontenida.

## astra-vs-opus.html — "Las reglas de la comparación" (44 s, 2026-09-25) · "espectacular", según Josema

Voz: por qué se compara Claude Opus 5.5 con GPT-6 Astra y no con GPT-6 Sol, y que Opus cuesta la mitad.

| t (s) | Voz | Pantalla | Pieza en el código |
|---|---|---|---|
| 0.40 | "Lo primero, las reglas de la comparación" | "LO PRIMERO" + título letra a letra; se dibuja una balanza | `scene1`, `letters`, `balanza` (trazos con `pathLength`) |
| 3.02 | "la comparación justa sería…" | chip que se escribe "la comparación justa" | `CHIP`, `chip()` |
| 4.64 / 6.56 | "Opus 5.5 frente a GPT-6 Sol" | tarjetas a izquierda y derecha; cada logo cae en su plato; balanza equilibrada | `mcard`, `OPK`/`SOK`, `beamAngle` (muelles `step`/`impulse`) |
| 9.79 | "no quería humillar…" | la balanza se vence hacia Opus; Sol se encoge | `beamAngle`, `SOK` |
| 12.73 | "Aquí no hay color" | Sol pasa a escala de grises (juego de palabras literal) | `put(..., g: 1)` |
| 13.41–14.87 | "…algo aún más interesante" | se tacha el chip, Sol sale, carta "?" con borde que avanza | `strike` del chip, `QK`, `qRect` |
| 21.11 / 22.03 | "…frente a GPT-6 Astra" | la carta gira (3D) y revela Astra; la balanza vuelve al equilibrio | `QK`/`AK` con `ry`, `slam` del nombre |
| 22.83–29.50 | "Astra es el tope de OpenAI, equivalente a Fable 5.1" | escalera: TOPE DE GAMA (Fable 5.1 = Astra) / GAMA ALTA (Opus 5.5 = Sol), cabeceras de empresa | `ladder`, `bandTop/bandMid`, `wTop/wMid`, `bTop` |
| 29.86–34.50 | "Opus 5.5 es tan bestia que podemos hacer esta comparativa" | Opus se ilumina, "bestia" = anillos + temblor, sube a la fila de arriba; "=" pasa a "VS" | `OPK` (subida), `badge` con `vsP`, destello dorado de la franja |
| 35.00–41.1 | "Opus tiene un coste de la mitad que Astra" | barras de precio reales ($4/$20 vs $10/$50) con línea "½ la mitad" | `cost`, `mkBar`, `wHalf`, `halfChip` |

Detalles que marcaron la diferencia:
- Un color por bando durante todo el vídeo (coral Claude a la izquierda, azul frío OpenAI a la derecha).
- Los nombres siempre en grande con la versión en el color del bando ("Opus **5.5**").
- Los tiempos salen de la alineación forzada (Whisper iba ~0,35 s adelantado).
- La voz dice "la mitad" y el dato real es el 40 %: se muestran los precios reales y la barra queda
  por debajo de la línea de la mitad. Nunca se pinta un dato falso para cuadrar con la voz.
- Este ejemplo lleva los logos incrustados como trazados SVG (`LOGO`); la plantilla los carga de `assets/logos`.

## hermes-agent.html — "Qué es Hermes Agent" (28,6 s, 2026-09-25)

Voz: qué es, dónde se instala, qué capacidades tiene, cómo se conecta a Telegram/WhatsApp/Discord y se controla desde el móvil.

| Escena | Pantalla | Pieza en el código |
|---|---|---|
| Presentación | icono con halo + título letra a letra + chips "agente de IA" / "código abierto" + URL del repo que se teclea | `hermes`, `scene1`, `letters`/`lettersIn` |
| Instalación | nodo "instalar" y cables discontinuos hacia dos tarjetas: "Tu ordenador" / "Un servidor", con un mini icono que viaja por el cable | `Wire`, `mini()` + `TRL/TRR`, `drawStrokes` (iconos que se dibujan) |
| Capacidades | barra superior con el nombre y 5 tarjetas (Herramientas, Tareas, Memoria, Habilidades, Subagentes) que se encienden cuando las nombra; paquetes de luz bajando por los cables | `scene2`, `CAPS`, `Dot` + `travel` |
| Apps | huecos punteados que se rellenan con Telegram, WhatsApp y Discord al nombrarlos | `scene3`, `slots`, `apps` (entrada con muelle `E.spring`) |
| Móvil | teléfono que sube, se escribe un mensaje, sale la burbuja, "escribiendo…", respuesta; el paquete viaja móvil → app → servidor → vuelta | `phone`, `pTxt`, `mOut/mIn/mTyping`, `travel` encadenados |
| Cierre | título + lema + fila de logos | `outro` |

Este ejemplo usa imágenes de `assets/logos/` que no están en la skill: al copiar piezas, cámbialas por `logo('slug')`.

## astra-vs-opus-2.html — "5 escenarios" (20 s, 2026-09-25) · entregada

Voz: "Para comparar, utilizaremos 5 escenarios diferentes, aplicado a mi día a día: edición de mis reels para
Instagram, animaciones para vídeos de YouTube, crear sitios web, desarrollo de aplicaciones y luego también
veremos qué tal se porta creando videojuegos." Hecha ya con la plantilla actual (buen punto de partida para listas).

| t (s) | Voz | Pantalla | Pieza en el código |
|---|---|---|---|
| 0.78 | "Para comparar" | cabecera con las tarjetas de la parte 1 (Opus 5.5 VS Astra) a escala .58 | `cabecera`, `tarjeta`, `insignia` |
| 2.44 / 3.00 | "5 escenarios" | "5" con degradado y golpe, "escenarios" letra a letra | `titulo` (el "5" se anima aparte) |
| 3.66 | "diferentes" | 5 huecos punteados numerados, en cadena | `slots` |
| 4.60 | "aplicado a mi día a día" | chip "de mi día a día" | `ChipEscrito` |
| 6.56–13.74 | "reels… animaciones… sitios web… aplicaciones" | cada hueco se convierte en tarjeta al nombrarlo: logo (Instagram, YouTube) o icono que se dibuja + nombre; la cámara acompaña | `escenarios`, `ESC`, `cards` |
| 14.84 / 16.18 | "veremos qué tal se porta creando videojuegos" | el último hueco pasa a carta "?", gira y revela "Videojuegos" | `escenarios` (rama `esQ`) |
| 17.6–20.3 | (silencio) | onda de luz por las 5 tarjetas; se encienden sus duelos "Claude vs OpenAI" | `WAVE`, `pulse` |

## astra-vs-opus-intro.html — intro del vídeo, SIN AUDIO (41 s, 2026-09-26) · entregada

Solo transcripción con marcas (00:05, 00:10…): tiempos con `anim.py estimar`, render sin pista de sonido.
Piezas nuevas que merece la pena copiar:

| Voz | Pantalla | Pieza en el código |
|---|---|---|
| "me tengo que comer mis palabras… decía que Opus no me parecía para tanto" | bocadillo gris "vídeos anteriores" con «Opus no es para tanto» que se escribe; luego se tacha en rojo, se arruga y cae | `bocadillo`, `recuerdo()` |
| "esta vez sí… pega un salto importante" | la tarjeta recupera el color y salta hacia arriba con líneas de velocidad, flechas y anillos | `OPK` (`g`, `br`, salto con `E.back`), `salto()` |
| "enfrentarlo contra el mejor modelo de OpenAI, GPT-6 Astra" | "VS" con golpe, hueco punteado con el logo de OpenAI y corona dorada "el mejor de OpenAI"; el rival entra en el hueco | `rival()`, `hueco`, `corona`, `ASK` |
| "casos de uso reales que puedes aplicar desde ya" | marca verde de "real" en cada tarjeta, en cadena; chip "aplícalo desde ya" | `.scard .ok`, `ChipEscrito` con `escribirPalabras` |

## muse-intro.html — intro a cámara con cara ↔ animación (38 s, 4K 60 fps, 2026-09-28) · «está perfecto», según Josema

Formato nuevo (`references/intro-con-cara.md`): su grabación a cámara (79 s, 4K) sin pausas, alternando 5 planos de
cara con 4 de animación a pantalla completa; la voz continua. Proyecto completo en
`Videos Canal YouTube/Muse_Meta/Animaciones/muse-intro/` (con `edicion/montaje.json` y el README del montaje).
Las escenas usan su propia `camara(t)` por ventana; la plantilla ya trae `V`, `dentro`, `camara` con el asentamiento
y `fijo`, así que en un proyecto nuevo basta con copiar las escenas y quitar sus copias de esas funciones.

| t (s) | Plano | Voz | Pantalla | Pieza en el código |
|---|---|---|---|---|
| 0–1,7 | cara corto | «Meta acaba de lanzar» | — | `edicion/montaje.json` |
| 1,7 | anim | «Muse» | icono de la app (ficha blanca) que entra con rebote y su «m» se escribe a mano; «Muse» letra a letra; logo oficial de Meta encima | `museFicha`, `museSVG`, `museDibujo` (máscara que recorre el eje), `marca`, `metaLock` |
| 2,4–5,6 | anim | «su agente de IA totalmente gratis» | chip «agente de IA» palabra a palabra; se aparta y entra «GRATIS» en verde con golpe | `chipIA`, `gratis`, `FILA` (medido en `layout`) |
| 6,4–10,2 | anim | «Permite conectarse a tu WhatsApp, Instagram o correo» | la ficha sube y se centra (primero sube, luego se desplaza: no pisa el nombre), 3 huecos «+» con cables en árbol; cada app se rellena al nombrarla y un paquete sube hasta Muse, que late | `FICHA_KX/KY`, `HUB`, `APPS`, `wTronco`, `wRamas`, `wSube`, `dots1` |
| 14,5–17,0 | anim | «solo está disponible en Estados Unidos» | mapa del mundo en puntos que se dibuja desde EE. UU.; alfiler con el icono de Muse; EE. UU. se enciende en azul; rótulo fijo en pantalla aunque la cámara se acerca | `prepararMapa`, `pintarMapa` (canvas a la resolución del dispositivo), `pin`, `chipPais` + `fijo()` |
| 20,1–21,8 | anim (vuelve) | «sin tener que ser de allí» | se tacha el rótulo; la luz se extiende de EE. UU. a todo el mundo (retraso = distancia / velocidad) → «desde cualquier país» | `pintarMapa` (rama de la onda), fases de `ChipEscrito` con `tachar` y `borrar` |
| 24,5–34,9 | anim | «crear aplicaciones personalizadas, establecer objetivos…, WhatsApp y correo, imágenes y vídeos» | «CASOS DE USO» + 4 huecos numerados que se rellenan al nombrarlos, cada uno con una mini ilustración viva: app que se monta y cambia de color con un clic, diana con flecha, Muse conectado a WhatsApp y Gmail/Outlook, imagen que se genera de arriba abajo y vídeo que se reproduce | `CASOS`, `escenaCasos`, `casoApp`, `casoObjetivos`, `casoConexiones`, `casoGenerar`, `loc()` para los hijos de una tarjeta |

Detalles que marcaron la diferencia: cortes secos en la palabra (el icono aparece justo en «Muse»); el primer
fotograma de cada ventana ya tiene contenido; zoom alterno 1,0 / 1,22 en los saltos de su cara; datos contrastados
(«totalmente gratis» → en pantalla solo «GRATIS», porque hay planes de pago); logos oficiales (Muse vectorizado del
icono oficial con `anim.py logo-trazo`; mapa con `anim.py mapa`, aquí con el formato antiguo `x,y,1/0` = EE. UU. o no).

## muse-explicacion.html — parte 2 tras la intro: explicación con cara ↔ animación (75 s, 4K 60 fps, 2026-09-29) · «espectacular», según Josema

Misma técnica que la intro, pero es la parte que **explica conceptos**: 64 % animación y 36 % cara, 13 planos, media de
5,8 s por plano. La cara queda para las transiciones («Lo primero que tienes que saber es que no se trata de un…»,
«Sería como… pero de Meta»), las promesas («te voy a enseñar…») y el cierre. Toma de 144 s → 75 s. Proyecto en
`Videos Canal YouTube/Muse_Meta/Animaciones/muse-explicacion/`.

| Voz | Pantalla | Pieza en el código |
|---|---|---|
| «similar a OpenClaw o Hermes» | tarjeta de Muse en el centro; «≈» a los lados; OpenClaw (open source) y Hermes (Nous Research) entran al nombrarlos; rótulo «AGENTES PERSONALES» | `escenaTrio`, `TMK`, `aprox` |
| «de momento… gratis con amplios límites semanales» | la tarjeta se aparta; columna con «de momento», «GRATIS» y un medidor «límite semanal» cuya pista se alarga con «amplios» | `chipMomento`, `gratis`, `medidor()` (pista y días L–D) |
| «me ha gastado un 3 % de mi suscripción semanal» | el medidor se llena un 3 % con un marcador; «3 %» grande | `escenaUso`, `med2`, `cifra`, `marca3` |
| «no se trata de un Claude Code, Antigravity o Codex» | tres tarjetas bajo «agentes de programación» al nombrarlas → pierden el color, se encogen y se tacha el rótulo | `escenaNoes`, `CODIG` (`g`, `br`), `ChipEscrito` con `tachar` |
| «más bien, un asistente personal que se integra con tu trabajo…» | entra Muse (su «m» se escribe) con «asistente personal»; Gmail, Outlook, Calendar y Drive se conectan en las esquinas | `fichaN`, `HERR`, `wHerr` + `tramo()` (cables que salen del borde) |
| «su punto clave es la integración… ecosistema de Meta» | «PUNTO CLAVE · Integración»; las apps de Meta en arco bajo Muse, cables y paquetes; logo de Meta | `escenaEco`, `APPS_META` (arco por ángulos) |
| «a base de clic te vas a conectar a WhatsApp» | panel «Conectores»: el cursor viaja y pulsa «Conectar» → cargando → «Conectado»; señala Instagram y Facebook | `panel`, `PF` (estados del botón), `CURK`, `BOTON()` |
| «vive en la nube de Meta… no tienes que instalarlo» | el panel entra en una nube que se dibuja; máquina «en línea · servidor de Meta»; portátil con descarga tachado: «nada que instalar» | `nube` (icono cloud a 860 px con `drawStrokes`), `vm`, `portatil`, `tachon` |
| «casi con la misma inteligencia que los más potentes» | barra de Muse Spark que sube hasta quedarse «casi» a la altura de Claude, GPT y Gemini («LOS MÁS POTENTES»); **sin cifras** | `escenaModelos`, `MOD`, `barras`, `casi`, `hueco` |
| «solo está disponible en Estados Unidos» | vuelve el mapa de la intro (callback) | `pintarMapa`, `pin`, `chipPais` + `fijo()` |

Detalles que marcaron la diferencia: nunca queda un hueco vacío entre dos ideas (la ficha de Muse entra justo cuando
salen las tarjetas descartadas; «de momento» llena la columna mientras llega «gratis»); lo que se niega se apaga y se
tacha en vez de desaparecer; un dato que no conviene fijar con números («casi al nivel de los mejores») se dibuja con
barras sin cifras; las escenas que vuelven (el mapa) conectan con la intro.

## muse-capas.html — la intro de Muse en modo combinado: capas sobre el vídeo + pantalla completa (38 s, 2026-09-29) · demo de la skill

Ojo: su fondo (espacio con suelo de rejilla), su revelado (anillos y confeti), su carpeta y el titular INTELIGENCIA
ARTIFICIAL detrás de la cabeza se parecen al vídeo de referencia, y Josema no los quiere en sus vídeos. Para una intro
con capas parte de `editado-por-ia.html` (más abajo); de aquí, copia solo piezas neutras (Buscador, Rotulo, Orbita…).

La misma toma y la misma voz que `muse-intro.html`, montadas con el estilo nuevo (tema profundidad, acento
`#4C86FF`, sonido con efectos y música `intro-scifi`, densidad espectáculo, subtítulos). Sirve de ejemplo de
casi todas las piezas de `motor/` y de `estadoVideo`. Montaje: cara 0–106 · anim «muse» 106–180 · cara 180–1340
(zooms 1 / 1,08) · anim «casos» 1340–2124 (`"asentar": false`) · cara hasta 2278 (`empuje` .04).

| t (s) | Voz | Pantalla | Pieza en el código | Sonido |
|---|---|---|---|---|
| 0–1,0 | «Meta acaba de…» | la grabación entra como ficha inclinada en el espacio y vuela a pantalla completa | `ficha`, `FICHA_INI`, `pintarFicha`; estadoVideo `t < 1` | transicion |
| 0,28 | «Meta» | logo de Meta grande detrás de la cabeza (asoma por los lados) | `metaHalo` (WORLD, z1) | golpe corto |
| 1,82 | «Muse» | revelado a pantalla completa: destello, logo que se enfoca, anillos, confeti; el espacio acelera con líneas de velocidad | `Revelado`, `ESPACIOK` | swell + golpe grave + brillo |
| 2,68 | «su agente» | cuchilla: la línea cruza y vuelve la cara | `cuchilla(t, T_CUCHILLA, { haciaAnim: false })` | corte |
| 3,12 / 3,94 | «inteligencia artificial» | INTELIGENCIA / ARTIFICIAL gigantes detrás de la cabeza | `TituloGigante` | golpe, golpe corto |
| 4,66 / 5,64 | «totalmente gratis» | bloques «Totalmente» / «GRATIS» con la cámara desenfocada y apagada | `Rotulo` + estado blur/br | golpe corto, tick |
| 8,0–10,2 | «WhatsApp, Instagram o correo» | iconos que orbitan la cara (delante y detrás) + contorno luminoso | `Orbita` + estado halo | tick suave por icono |
| 11,4–12,7 | «cualquier cosa que le pidas» | prompt que se escribe palabra a palabra | `Buscador` | aire + tecleo |
| 13,5–17 | «el problema es que solo está disponible en Estados Unidos» | la habitación se desvanece a un espacio casi quieto, halo rojo, «Solo en EE. UU.» | estado fondo + haloRgb, `Rotulo` | transicion; barrido al volver |
| 17,5–21,7 | «en este vídeo yo te voy a enseñar…» | cara limpia con subtítulos | — | — |
| 22,3–35,4 | «Vamos a ver varios casos de uso: …» | la grabación se encoge a una ficha con «CASOS DE USO» y a la derecha se rellenan 4 tarjetas al nombrarlas; al final la ficha vuelve a pantalla completa | `FICHA_CASOS`, `zoomVideo`, `tarjetaFuente`, `escenaCasos` | transicion, tick por tarjeta, aire + golpe corto |
| todo | — | subtítulos palabra a palabra (no en pantalla completa ni con el fondo sustituido) | `Subtitulos` | — |

Lecciones de esta demo (ya corregidas en el motor): la cuchilla necesitaba que la sala siguiera visible bajo su
recorte y que una región vacía no se viera; el asentamiento 1,06 → 1 de los planos de animación descuadraba la
ficha (de ahí `"asentar": false`); los efectos al nivel de la voz tapaban palabras (biblioteca 5–8 dB más baja).

## editado-por-ia.html — intro «La edición de este vídeo la ha hecho la IA» en modo combinado (34 s, 4K 60 fps, 29–30/09/2026) · v3 «brutal», según Josema

La referencia actual del modo combinado: la de Muse con capas (arriba) se parece demasiado al vídeo de referencia y
Josema la descartó para sus vídeos. Toma de 92 s → 34,3 s sin pausas. Estilo: profundidad con la cortina de luz, acento
`#3E6EF2`, música `intro-tambores` (desde 22,665 s: el final de un redoble cae en «Claude»; `anim.py golpe`), efectos,
densidad espectáculo, subtítulos. Montaje: cara 0–498 · anim «bruto» 498–710 · anim «claude» 710–858 (los dos sin
asentamiento) · cara 858–1545 · anim «pasos» 1545–1881 · cara 1881–2060 (empuje .05). Todas las piezas están ya en
`motor/` (este archivo solo las coloca y sincroniza): cópialo como punto de partida de una intro con capas.

| t (s) | Voz | Pantalla | Pieza | Sonido |
|---|---|---|---|---|
| 0–2,62 | «La edición de este vídeo que estás viendo» | la grabación es una ficha inclinada delante de la cortina de luz; debajo, la línea de tiempo de un editor cuyos clips se colocan solos; EDICIÓN / ESTE VÍDEO; vuela a pantalla completa en «viendo» | `videoFicha`, `LineaTiempo`, `Cortina` (vel 90, onda) | tick, tick, transición |
| 2,72 | «lo ha hecho» | línea de escaneo que le recorre | `Escaneo` | barrido |
| 3,62–5,60 | «por completo la inteligencia artificial» | panel EDICIÓN CON IA junto a su cabeza: 5 tareas reales que se marcan; en «artificial», ✓ COMPLETA | `PanelTareas` | aire, tick suave por tarea, nota |
| 7,46 | «Yo solo he tenido que grabar» | visor de cámara (esquinas, ● REC, código de tiempo, 4K · 60 FPS) | `VisorREC` | bip |
| 8,30–10,16 | «colocar el contenido en bruto» | la grabación se encoge a ficha con el visor dentro; pie «video_bruto.mp4 · 4K · 60 fps»; EN BRUTO | `videoFicha` + `VisorREC({ ficha })` | transición, tick |
| 10,55–11,9 | «en una carpeta» | ventana del explorador «Animaciones» (con el zip de la skill); un cursor agarra la ficha y la suelta en el hueco: «2 elementos»; la ventana se centra | `Explorador`, `Arrastre` | aire, clic, clic + golpe corto |
| 11,88–13,9 | «Y Claude Opus se ha encargado» | el logo sale del archivo girando con estela, estalla en haces de luz, «Claude Opus 5.5» se barre con un filo de luz, ANTHROPIC | `RevelarHaces` (+ `Cortina` vel 150 y onda) | swell, golpe grave, brillo, barrido |
| 13,86–14,30 | — | iris que se abre desde su cara | `iris()` en estadoVideo | aire |
| 15,71 / 16,81 | «estas animaciones increíbles» | rótulo en bloques, cámara desenfocada detrás | `Rotulo` + blur/br | golpe corto, tick |
| 19,15 / 19,97 | «todos los efectos y sonidos» | contorno luminoso; panel «FX · Efectos» (Transiciones, Desenfoque) y panel «Sonidos» con la forma de onda de su voz y un cabezal | `PanelConcepto` ×2 | aire, nota |
| 22,35 | «añadir todos estos títulos» | TÍTULOS gigante detrás de la cabeza | `TituloGigante` | golpe |
| 23,2–25,4 | «incluso cada logotipo que ves» | logos de las herramientas reales orbitando (Claude, Anthropic, Python, FFmpeg, Node.js, Playwright), por delante a la altura del pecho | `Orbita` (cy 445) + halo | tick suave por logo |
| 25,75–31,35 | «te voy a explicar paso a paso… y te regalaré la skill» | la grabación a la izquierda; ruta vertical de 4 pasos, uno por palabra, que se queda completa ~2 s; en «regalaré» se enciende el paso 3 con DE REGALO | `RutaPasos` (destacar) | tick por paso, nota |
| 31,4–34,3 | «para que tú la puedas montar hoy mismo» | tarjeta DE REGALO · Skill · animaciones-con-voz; «Instalando…» en «montar» → «✓ Lista, hoy mismo» | `TarjetaRegalo` | aire, aire, nota doble |

Lo que Josema pidió cambiar por el camino (y ya está en `references/diseno.md` § 7 y en el motor):
- v1 → v2: un golpe de zoom de 1,035 sobre su grabación se veía como un «tambaleo»; INTELIGENCIA ARTIFICIAL detrás de
  él, el espacio con suelo de rejilla y la carpeta con tapa se parecían demasiado al vídeo de referencia.
- v2 → v3: los corchetes «CARA DETECTADA» sobre su cara «quedan feísimos»; faltaba música épica; el paso a paso iba
  demasiado rápido para leerlo (se alargó de 3,9 a 5,6 s y la tarjeta de la skill se acortó); la varita y los destellos
  de «efectos y sonidos» eran «muy de IA» y las barras de sonido parpadeaban.

## reel-editado-por-ia.html — reel vertical «Este vídeo lo ha editado por completo la IA» en modo combinado (50 s, 1080×1920 60 fps, 30/09/2026)

El primer reel con este motor (`anim.py nuevo --video … --vertical`). Josema había recibido antes una versión hecha con la
skill editor-reels y dijo que «le falta animaciones mejores»: este es el mismo guion con capas, fondo sustituido y
revelados. Toma OBS 4K 60 fps de 2:22 → 50,2 s sin pausas (12 tramos, sin tomas repetidas). Estilo: profundidad con la
cortina de luz, acento `#3E6EF2`, voz + efectos (sin música: la pone en Instagram), densidad espectáculo, subtítulos.
Montaje: cara 0–2224 (zooms 1 · 1,08 · 1 · 1,14 · 1 · 1,08 · 1 · 1,08 · 1) · anim «claude» 2224–2560 sin asentamiento ·
cara 2560–3011 (empuje .03). `edicion/montaje.json` → `"vertical": {"alto": 1686, "cx": 1796, "fy": 595}`.

| t (s) | Voz | Pantalla | Pieza | Sonido |
|---|---|---|---|---|
| 0–2 | «Este vídeo lo ha editado» | ficha vertical inclinada delante de la cortina de luz, ESTE VÍDEO / EDITADO POR IA apiladas arriba a la izquierda; vuela a pantalla completa en «completo» | `videoFicha`, `Cortina` | tick, tick, transición |
| 1,96–6 | «por completo la inteligencia artificial» | escaneo; panel EDICIÓN CON IA bajo la barbilla con 5 tareas; ✓ COMPLETA en «artificial» | `Escaneo`, `PanelTareas` | barrido, aire, tick por tarea, nota |
| 5,2–7,4 | «Yo solo me he grabado así» | visor REC con sus rótulos subidos a la zona segura por CSS | `VisorREC` | bip |
| 6,8–16 | «en bruto, con mis pausas… Claude le ha quitado los silencios y las tomas repetidas… Justo aquí había un corte» | la toma real (2:22, sus 12 trozos); 1:32 DE PAUSAS en ámbar; se juntan (0:50); la línea se estira y es este reel con su cabezal; tijera CORTE en la unión que acaba de pasar | `LineaBruto` | aire, tick, transición, corte |
| 13,28 | «¿Ves este zoom?» | corte con zoom de 1,14 (el único grande) | montaje | barrido suave |
| 16,8–20,6 | «Coloca los subtítulos… en azul» | SUBTÍTULOS gigante detrás de la cabeza (y 350); se vuelve azul en «azul» | `TituloGigante` | golpe, tick |
| 22,9–27 | «como Claude o ChatGPT… lo busca» | logos orbitando alrededor de él con contorno luminoso; buscador «logo oficial de ChatGPT» | `Orbita` (cy 820) + halo, `Buscador` | tick suave, aire, tecleo |
| 27,4–29 | «Crea animaciones como estas» | rótulo en bloques con la cámara desenfocada | `Rotulo` | golpe corto, tick |
| 30,7–34,3 | «Y adapta cada cosa a lo que voy diciendo» | la sala se funde a la cortina; línea de tiempo VOZ / TEXTOS / EFECTOS | `LineaTiempo` + estado fondo | transición |
| 36,1–39,7 | «grabarme el vídeo en bruto y pasárselo a Claude Code» | visor REC; ficha EN BRUTO; ventana «Claude Code» y el cursor la suelta en el hueco (vertical por CSS) | `VisorREC`, `videoFicha`, `Explorador`, `Arrastre` | bip, transición, aire, clic, clic + golpe corto |
| 40,45–42,2 | «con Opus 5.5» | revelado con haces de luz, «Claude Opus 5.5», ANTHROPIC; iris desde su cara | `RevelarHaces`, `iris()` | swell, golpe grave, brillo, barrido, aire |
| 42,6–46 | «y esta skill de aquí… Si quieres la skill» | tarjeta LA SKILL: «Editando tu vídeo…» → ✓ Vídeo editado → DE REGALO | `TarjetaRegalo` | aire, aire, nota doble, nota |
| 47,1–48,9 | «comenta edición y te la envío» | caja de comentario que escribe EDICIÓN y se envía: ✓ Te la envío gratis | `Comentario` | aire, tecla por letra, clic + nota doble |

Lo propio del formato vertical (cópialo de aquí):
- Piezas bajo la barbilla (y ≈ 1040–1480), `TituloGigante` a y 350 detrás de la cabeza, subtítulos a y 1520 con fondo
  oscuro (`.subt` con `backdrop-filter`): sin fondo no se leían sobre el logo de la camiseta.
- Subtítulos agrupados por frases (`CORTES_SUBS` en `layout()`: índice de la primera palabra de cada grupo, `w.frase`) en
  vez de cada N palabras, que partía «así / en bruto» o «Justo / aquí».
- CSS del propio index: `.recov` (visor), `.expl .slot .mini` (hueco vertical), `.rev-nm` (nombre del revelado a 106 px),
  `.vficha .vf-tags` (etiquetas de la ficha apiladas).
