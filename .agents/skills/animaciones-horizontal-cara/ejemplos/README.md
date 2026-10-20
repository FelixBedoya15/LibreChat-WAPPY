# Ejemplos reales (entregados a Josema)

Son el `index.html` completo de animaciones terminadas y aprobadas. Los dos de Muse son **exactamente** los que
produjeron los vídeos entregados en este formato (cara ↔ animación, 4K 60 fps): el listón de calidad y el punto de
partida para las escenas. Los otros cuatro son animaciones a pantalla completa sobre una voz en off, de las que salen
piezas del catálogo (balanza, carta que gira, escalera de gamas, móvil con chat, huecos numerados).

Léelos para **copiar piezas y estructura**, no para empezar desde ellos: la base de un proyecto nuevo es siempre
`plantilla/` (mismo motor, ya con el montaje). Busca las funciones por nombre; cada una es una pieza autocontenida.
Los proyectos completos de Muse (con `edicion/montaje.json`, logos y README con fuentes) están en
`Videos Canal YouTube/Muse_Meta/Animaciones/muse-intro/` y `.../muse-explicacion/`.

## muse-intro.html — intro a cámara con cara ↔ animación (38 s, 4K 60 fps, 2026-09-28) · «está perfecto», según Josema

Su grabación a cámara (79 s, 4K) sin pausas, alternando 5 planos de cara con 4 de animación a pantalla completa;
la voz continua. Proyecto completo en `Videos Canal YouTube/Muse_Meta/Animaciones/muse-intro/` (con
`edicion/montaje.json` y el README del montaje).
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

# Piezas de otras animaciones (voz en off, pantalla completa)

Hechas con el mismo motor antes de este formato. Los logos de `astra-vs-opus.html` van incrustados y los de
`hermes-agent.html` son imágenes que no están en la skill: al copiar piezas, cámbialos por `logo('slug')`.

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

Se hizo sin audio, con tiempos estimados desde una transcripción con marcas (00:05, 00:10…) y render sin pista de sonido.
Piezas nuevas que merece la pena copiar:

| Voz | Pantalla | Pieza en el código |
|---|---|---|
| "me tengo que comer mis palabras… decía que Opus no me parecía para tanto" | bocadillo gris "vídeos anteriores" con «Opus no es para tanto» que se escribe; luego se tacha en rojo, se arruga y cae | `bocadillo`, `recuerdo()` |
| "esta vez sí… pega un salto importante" | la tarjeta recupera el color y salta hacia arriba con líneas de velocidad, flechas y anillos | `OPK` (`g`, `br`, salto con `E.back`), `salto()` |
| "enfrentarlo contra el mejor modelo de OpenAI, GPT-6 Astra" | "VS" con golpe, hueco punteado con el logo de OpenAI y corona dorada "el mejor de OpenAI"; el rival entra en el hueco | `rival()`, `hueco`, `corona`, `ASK` |
| "casos de uso reales que puedes aplicar desde ya" | marca verde de "real" en cada tarjeta, en cadena; chip "aplícalo desde ya" | `.scard .ok`, `ChipEscrito` con `escribirPalabras` |
