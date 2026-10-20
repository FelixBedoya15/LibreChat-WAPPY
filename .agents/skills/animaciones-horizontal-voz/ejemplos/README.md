# Ejemplos: animaciones entregadas y cómo se adaptó cada una a su audio

Son el `index.html` completo de cuatro animaciones terminadas. Sirven para dos cosas: **el listón de calidad**
(legibilidad, sincronía, limpieza) y **una cantera de piezas** que copiar y transformar. No son estructuras que
repetir: cada una salió de su audio (ver la columna «por qué») y la siguiente saldrá del suyo. La base de un proyecto
nuevo es siempre `plantilla/`; de aquí se copian funciones sueltas (busca por nombre, cada una es autocontenida).

Las dos que el usuario marcó como referencia de esta skill son la **intro sin audio** y los **escenarios**.

## astra-vs-opus-intro.html — intro del vídeo, SIN AUDIO (41 s) · referencia

Hecha solo con la transcripción y sus marcas (`anim.py estimar`); el render sale sin pista de sonido.

| Voz | Pantalla | Por qué (qué del audio lo pide) | Pieza en el código |
|---|---|---|---|
| «He estado probando… Opus 5.5» | chip «probando durante estos días» palabra a palabra; entra la tarjeta de Opus | gancho: el protagonista desde el primer segundo | `ChipEscrito` + `escribirPalabras`, `OPK` |
| «…me tengo que comer mis palabras… decía que Opus no me parecía para tanto» | bocadillo gris «vídeos anteriores» con «Opus no es para tanto»; la tarjeta pierde el color | la frase hecha y la opinión pasada, literales | `bocadillo`, `recuerdo()`, `OPK` (`g`, `br`) |
| «La realidad es que esta vez sí…» | la cita se tacha, se arruga y cae; la tarjeta recupera el color | giro del relato | `recuerdo()`, `OPK` |
| «…pega un salto importante» | salto con líneas de velocidad, flechas y anillos | frase hecha literal; el tono pasa a épico | `salto()`, `lineas`, `flechas` |
| «…enfrentarlo contra el mejor modelo de OpenAI, GPT-6 Astra» | VS con golpe, hueco con el logo de OpenAI y corona «el mejor de OpenAI»; aterriza Astra | «el mejor» = corona; el rival llena un hueco | `rival()`, `hueco`, `corona`, `ASK` |
| «En 5 escenarios… edición de vídeo, animaciones, aplicaciones, videojuegos» | cabecera + «5 escenarios» + huecos que se rellenan al nombrarlos | enumeración anunciada | `escenarios()` |
| «No se trata de una simple comparación» | chip que se tacha | negación | `ChipEscrito` (`tachar`) |
| «…casos de uso reales que puedes aplicar desde ya» | marca verde de «real» en cadena; «aplícalo desde ya» | cierre con la promesa | `.scard .ok`, `ChipEscrito` |

## astra-vs-opus-2.html — «5 escenarios» (20 s) · referencia

| t (s) | Voz | Pantalla | Por qué | Pieza en el código |
|---|---|---|---|---|
| 0.78 | «Para comparar» | cabecera con las tarjetas de la serie (Opus 5.5 VS Astra) a escala .58 | recuerda quién compite | `cabecera`, `tarjeta`, `insignia` |
| 2.44 / 3.00 | «5 escenarios» | «5» con degradado y golpe, «escenarios» letra a letra | el número anunciado, primero | `titulo` (el «5» se anima aparte) |
| 3.66 | «diferentes» | 5 huecos punteados numerados, en cadena | la estructura antes del contenido | `slots` |
| 4.60 | «aplicado a mi día a día» | chip «de mi día a día» | matiz personal, breve | `ChipEscrito` |
| 6.56–13.74 | «reels… animaciones… sitios web… aplicaciones» | cada hueco se convierte en tarjeta al nombrarlo: logo o icono que se dibuja + nombre; la cámara acompaña | la lista se completa al ritmo de la voz | `escenarios`, `ESC`, `cards` |
| 14.84 / 16.18 | «veremos qué tal se porta creando videojuegos» | el último hueco pasa a carta «?», gira y revela «Videojuegos» | expectación en la voz | `escenarios` (rama `esQ`) |
| 17.6–20.3 | (silencio) | onda de luz por las 5 tarjetas; se encienden sus duelos | el silencio final también se usa | `WAVE`, `pulse` |

## astra-vs-opus.html — «Las reglas de la comparación» (44 s)

| t (s) | Voz | Pantalla | Por qué | Pieza en el código |
|---|---|---|---|---|
| 0.40 | «Lo primero, las reglas de la comparación» | «LO PRIMERO» + título letra a letra; se dibuja una balanza | anuncia una sección; «comparación» → balanza | `scene1`, `letters`, `balanza` |
| 4.64 / 6.56 | «Opus 5.5 frente a GPT-6 Sol» | tarjetas a izquierda y derecha; cada logo cae en su plato; balanza equilibrada | «la comparación justa» | `mcard`, `OPK`/`SOK`, `beamAngle` (muelles `step`/`impulse`) |
| 9.79 / 12.73 | «no quería humillar…» / «Aquí no hay color» | la balanza se vence; Sol se encoge y pasa a gris | frases hechas literales | `beamAngle`, `SOK` (`g`, `br`) |
| 13.41–22.03 | «…algo aún más interesante… frente a GPT-6 Astra» | se tacha el chip, carta «?» que gira y revela Astra; la balanza se reequilibra | expectación + revelación | `QK`/`AK` con `ry` |
| 22.83–29.50 | «Astra es el tope de OpenAI, equivalente a Fable 5.1» | escalera de gamas con «=» | «tope», «equivalente» | `ladder`, `bandTop/bandMid`, `bTop` |
| 29.86–34.50 | «Opus 5.5 es tan bestia que podemos hacer esta comparativa» | Opus se ilumina, tiembla y sube de fila; «=» pasa a «VS» | «tan bestia», «juega en otra liga» | `OPK`, `badge` |
| 35.00–41.1 | «Opus tiene un coste de la mitad que Astra» | barras de precio reales con línea «½ la mitad» (el dato real es 40 %: la barra queda por debajo) | cifra verificada, sin contradecir a la voz | `cost`, `mkBar`, `wHalf` |

## hermes-agent.html — «Qué es Hermes Agent» (28,6 s)

| Escena | Pantalla | Por qué | Pieza en el código |
|---|---|---|---|
| Presentación | icono con halo + título letra a letra + chips + URL del repo que se teclea | presenta un producto | `hermes`, `scene1`, `letters`/`lettersIn` |
| Instalación | nodo «instalar» y cables hacia «Tu ordenador» / «Un servidor», con un mini icono que viaja | «se instala en tu ordenador o en un servidor» | `Wire`, `mini()`, `drawStrokes` |
| Capacidades | barra con el nombre y 5 tarjetas que se encienden al nombrarlas; paquetes de luz por los cables | lista de capacidades | `scene2`, `CAPS`, `Dot` + `travel` |
| Apps | huecos que se rellenan con Telegram, WhatsApp y Discord al nombrarlos | «se conecta con tus apps» | `scene3`, `slots`, `apps` |
| Móvil | el teléfono sube, se escribe un mensaje, «escribiendo…», respuesta; el paquete viaja móvil → app → servidor | «controlarlo desde el móvil» | `phone`, `travel` encadenados |

Este ejemplo usa imágenes de `assets/logos/` que no están en la skill: al copiar piezas, cámbialas por `logo('slug')`.
El de las reglas lleva los logos incrustados como trazados SVG (`LOGO`); la plantilla los carga de `assets/logos`.
