# Capas sobre el vídeo (modos capas y combinado)

Josema graba hablando a cámara y la animación se **integra** en la grabación en vez de solo alternarse con ella:
texto y logos detrás de su cabeza, iconos que pasan por delante y por detrás, contorno luminoso en su silueta,
la habitación que se funde al fondo de la animación (la cortina de luz), tarjetas de interfaz junto a su cara, subtítulos, y
(en **combinado**) cortes a animación a pantalla completa donde su grabación sigue viva dentro de una ficha que
vuela. Nació del análisis del vídeo de referencia (29/09/2026, `ejemplos/muse-capas.html` es la demo con la intro
de Muse). La sincronía, los datos y los logos se trabajan igual que siempre.

**Referencia de calidad: `ejemplos/editado-por-ia.html`** (intro «La edición de este vídeo la ha hecho la IA», v3
aprobada: «brutal», 30/09/2026). No es una plantilla: cada vídeo lleva su propio concepto y sus piezas
(`references/direccion.md`). Josema no quiere que sus vídeos se parezcan al de referencia, así que varios recursos
de la demo de Muse tienen ya su versión propia en el motor: fondo `Cortina` (no el espacio con suelo de rejilla),
`Explorador` + `Arrastre` (no la carpeta con tapa), `RevelarHaces` + `iris` (no el revelado con anillos y confeti) y
nada de titulares genéricos detrás de él («INTELIGENCIA ARTIFICIAL»). Sus reglas, en `references/diseno.md` § 7.

## Contenido

1. Flujo
2. Cómo funciona (capas, recorte, fotogramas)
3. estadoVideo: qué se ve de la grabación en cada instante
4. Recursos: qué dice la voz → qué efecto
5. El montaje en modo combinado
6. Transiciones sin corte
7. Revisar, montar y entregar
8. Rendimiento, disco y errores conocidos

## 1. Flujo

```
anim.py nuevo <Animaciones>/<nombre> --video <toma.mp4> --modo combinado [--tema profundidad --sonido musica ...]
cd <Animaciones>/<nombre>
anim.py transcribir --toma --nombres "..."   → corrige edicion/guion.txt («~» delante de la toma repetida)
anim.py alinear --toma
anim.py cortar                               → voz sin pausas; con capas el punch-in de cada salto es de 1,08 (≤ 9 %)
anim.py alinear                              → trabajo/tiempos.json (palabras de la voz cortada)
anim.py recortar                             → edicion/capas/720 y a la altura de la toma: imagen + silueta por fotograma
anim.py planos                               → palabras con su fotograma; reparte edicion/montaje.json
   (programa las escenas en index.html; revisa con anim.py revisar)
anim.py golpe --en <t del revelado>         → desde qué segundo del tema empezar la música (ESTILO.tramosMusica)
anim.py montar --res 1080                    → borrador con la mezcla de sonido
anim.py montar                               → final a la resolución de la toma
```

Primero las preguntas de estilo (`references/estilos.md`). El recorte tarda ~2 min por cada 40 s de toma 4K en la
RTX 4070 (19 fotogramas/s) y la primera vez descarga el modelo (108 MB).

## 2. Cómo funciona

Capas del escenario, de abajo arriba (`motor/capas.js`):

| Capa | Qué es | Cómo se usa |
|---|---|---|
| `#capaVideo` | la sala: la grabación sin pausas | la pinta el motor; `sala`, `blurSala`, `brSala` en estadoVideo |
| `#fondo` | fondo de la animación: color, rejilla y halos (tema oscuro) o la cortina de luz (`Cortina`, tema profundidad; `Espacio` solo si lo pide) | `fondo` 0..1 tapa la sala (1 = pantalla completa) |
| `#world` | animación **detrás** de la persona | `mk(tag, cls)` por defecto |
| `#capaPersona` | la persona recortada, con halo opcional | `persona`, `halo`, `haloRgb`, `blur`, `br` |
| `#worldF` | animación **delante** de la persona | `mk(tag, cls, WORLDF)`; las piezas de interfaz van aquí por defecto |
| `#vignette`, `#noise`, `#destello` | acabado | el motor los ajusta; `destello(t, t0, fuerza)` |

- `anim.py recortar` escribe por cada fotograma del montaje `edicion/capas/<alto>/v_NNNNNN.jpg` (la imagen) y
  `m_NNNNNN.png` (la silueta en el canal alfa), con Robust Video Matting (ResNet50, GPU). La silueta se calcula una
  vez a la resolución de la toma y se reduce a cada altura: coinciden. El micro y la silla que tiene justo detrás
  salen como parte de la persona (es correcto: están delante de la pared).
- La previsualización y `anim.py revisar` usan el juego de 720 (rápido). El render usa el de su altura
  (`render.mjs --capas=2160`; `anim.py render` y `montar` lo eligen y, si falta, lo crean).
- En el render cada fotograma espera a que su imagen y su silueta estén cargadas (`window.__render` es async). En la
  previsualización se pinta el más cercano que ya llegó.
- El encuadre de la grabación sale de `edicion/montaje.json`: `zooms` en ciclo en cada salto de corte (centro:
  `cerca`), `empuje` (acercamiento lento a lo largo del plano, 0,03–0,05) y `ESTILO.camaraEnMano`.

## 3. estadoVideo: qué se ve de la grabación

`estadoVideo(t)` (en index.html) devuelve cada fotograma:

```js
function estadoVideo(t) {
  if (t < 1.0) return { fondo: 1, sala: 0, persona: 0 };             // la grabación es una ficha que vuela
  const c = iris(t, T_IRIS, { dur: .44, cx: 920, cy: 300 });          // o cuchilla(t, T_CUCHILLA, { dur: .32, ang: 66, haciaAnim: false })
  if (c) return c.est;                                                 // transición en curso
  if (enAnim(t)) return { fondo: 1, persona: 0 };                      // plano de animación a pantalla completa
  const est = { fondo: 0, persona: 1, halo: 0 };
  const g = P(t, T.totalmente - .1, .3) * (1 - P(t, 6.05, .25));       // rótulo con la cámara desenfocada
  est.blur = 14 * g; est.br = 1 - .45 * g;
  est.halo = P(t, T.whatsapp - .1, .5) * (1 - P(t, 10.1, .3)) * .9;   // contorno luminoso mientras orbitan los iconos
  if (t > 13.3 && t < 16.97) { const p = P(t, 13.45, .9); est.fondo = p; est.halo = .85 * p; est.haloRgb = '236,106,94'; }  // la sala se va
  return est;
}
```

| Campo | Efecto | Valores que funcionan |
|---|---|---|
| `fondo` | el fondo de la animación tapa la sala (con la persona delante si `persona` = 1: **fondo sustituido**) | 0; 1 en pantalla completa; rampa de 0,6–0,9 s para que la habitación se desvanezca |
| `persona` | la persona recortada | 1 en cara; 0 en pantalla completa |
| `sala` | la habitación | 1 (0 cuando la grabación se ve en una ficha) |
| `blur`, `br` | desenfoque y brillo de sala **y** persona | rótulo grande delante: blur 12–16, br .55–.65 |
| `blurSala`, `brSala` | solo la habitación (tú nítido: falsa profundidad de campo) | blurSala 8–12, brSala .7 |
| `halo`, `haloRgb` | contorno luminoso | .8–.95; acento por defecto; rojo `236,106,94` para un problema |
| `zoom` | acercamiento extra sobre el encuadre del montaje | 1 (no lo uses para golpes cortos: se ven como un tambaleo; Josema, 29/09/2026) |
| `clipAnim`, `clipVideo` | recortes de una transición (los pone `cuchilla`) | — |

## 4. Recursos: qué dice la voz → qué efecto

Además del catálogo de siempre (`references/diseno.md` § 5, que ahora incluye estas filas con su sonido):

| La voz… | Efecto | Pieza | Sonido |
|---|---|---|---|
| dice una palabra que es justo lo que se ve («añadir estos títulos») | titular gigante **detrás** de la cabeza (a 240 px asoma por arriba y por los lados). No para conceptos genéricos como «inteligencia artificial»: Josema lo quitó | `TituloGigante` | golpe, aire-salida |
| «lo ha hecho la IA», un proceso automático | línea de escaneo que le recorre y panel de tareas reales que se marcan hasta «✓ COMPLETA», junto a la cabeza (nunca corchetes sobre su cara) | `Escaneo` + `PanelTareas` | barrido; aire, tick suave por tarea, nota |
| la edición, «este vídeo que estás viendo» | la grabación empieza como ficha con la línea de tiempo de un editor debajo (los clips se colocan solos) y vuela a pantalla completa | `videoFicha` + `LineaTiempo` | tick por etiqueta, transición |
| «he tenido que grabar» | visor de cámara (esquinas, ● REC, código de tiempo); si la grabación se encoge a ficha, el visor sigue dentro | `VisorREC({ ficha })` | bip |
| nombra la empresa o la marca de la que habla («Meta acaba de lanzar») | su logo grande detrás de la cabeza (asoma por los lados) | logo en WORLD, z1 | golpe corto |
| presenta el producto o el modelo («Claude Opus») | revelado a pantalla completa: el logo sale de donde estaba (un archivo, una tarjeta) girando con estela, estalla en haces de luz, el nombre se barre con un filo de luz y la empresa debajo; la cortina acelera y se enciende; vuelve a su cara con un iris | `RevelarHaces` + `FONDOK` vel 150 + `iris()` (el `Revelado` de anillos y confeti recuerda al vídeo de referencia) | swell + golpe grave + brillo + barrido (automático) |
| una frase que tiene que quedarse («totalmente gratis») | rótulo en bloques que se levantan, cámara desenfocada y apagada detrás | `Rotulo` + estado blur/br | golpe corto + tick (automático) |
| se conecta con apps, «cada logotipo que ves» | iconos de app que orbitan alrededor de la cabeza, pasando por delante (a la altura del pecho, no de la boca: `cy` ≈ 445, `ry` ≈ 205) y por detrás; contorno luminoso | `Orbita` + halo | tick suave por icono, aire-salida |
| dos conceptos seguidos («efectos y sonidos») | un panel a cada lado de la cabeza con marca o icono sobrio (FX, altavoz), nombre grande y ejemplos reales (chips) o la forma de onda de su voz con un cabezal que avanza | `PanelConcepto` ×2 | aire, nota, aire-salida |
| «pídele cualquier cosa», un prompt, una búsqueda | barra que se escribe al ritmo de la voz, con esfera de puntos de cargador | `Buscador` | aire + tecleo |
| «busca referencias», fuentes, documentación | tarjetas de fuente (logo, dominio, título) alrededor de la cara con una línea que las escanea | `tarjetaFuente` / `pintarFuente` | tick por tarjeta |
| un problema, una limitación («solo en Estados Unidos») | la habitación se desvanece a un espacio casi quieto, halo rojo, rótulo | estado fondo + halo rojo + `Rotulo` | transición (whoosh largo) al irse la sala, barrido al volver |
| la solución, «lo más potente», velocidad | fondo sustituido con la cortina acelerando y encendida, halo del acento | `FONDOK` vel 150, brillo 1,35 + halo (con `Espacio`: hiper 1) | swell que termina en la palabra |
| subir, publicar, «envía» | tarjeta con miniatura y barra de progreso que pasa a «Publicado» | `TarjetaProgreso` | aire + dos notas al terminar |
| «te avisa», «te lo manda para revisión» | notificación que baja con botón que se pulsa | `Notificacion` (+ `Cursor`) | aviso + clic |
| guardar, «colocar en una carpeta», subir a Drive | la grabación se encoge a ficha; se abre la ventana del explorador (la carpeta real, con lo que tenga) y un cursor la agarra y la suelta en el hueco: «1 elemento» → «2 elementos»; la ventana se centra y de ella puede salir lo siguiente (el logo del revelado) | `videoFicha` + `Explorador` + `Arrastre` (la `carpeta` con tapa recuerda al vídeo de referencia) | transición; aire, clic, clic + golpe corto |
| enumera casos, una lista | la grabación se encoge a un lado (ficha con etiqueta) y las tarjetas se rellenan al otro | `videoFicha` + `tarjetaFuente` | transición al encogerse, tick por tarjeta |
| «paso a paso», cómo lo ha hecho | la grabación a un lado y una ruta vertical de pasos con línea de luz, uno por palabra; completa ≥ 2 s; puede volver a encender un paso con una etiqueta («DE REGALO») | `videoFicha` + `RutaPasos` | transición, tick por paso, nota |
| «te regalo la skill», «móntalo hoy mismo» | tarjeta DE REGALO junto a su cara que se instala con la voz (~3 s) | `TarjetaRegalo` | aire, aire, nota doble |
| un porcentaje | cuadrícula de 100 que se llena; la cifra entra con golpe al final | `Cuadricula100` | aire + golpe corto |
| algo que desaparece o ya no importa | la palabra se deshace en polvo | `Polvo` | descarte |
| «la IA», un agente, algo abstracto | esfera de puntos que gira y se convierte en un logo o icono | `EsferaPuntos` | aire + brillo |
| su nombre al presentarse | rótulo de nombre y cargo abajo a la izquierda | `RotuloNombre` | aire |

Las piezas de interfaz (buscador, tarjetas, notificación, rótulos) van **delante** (WORLDF); los titulares y logos
que tienen que quedar detrás de la cabeza, **detrás** (WORLD). Pon lo de detrás a la altura de la cabeza para que
la tape de verdad (la cabeza de Josema en su estudio: x ≈ 885, y ≈ 120–480 en el lienzo de 1920×1080).

## 5. El montaje en modo combinado

`edicion/montaje.json` igual que en el modo cara, pero los planos «cara» llevan capas encima y los «anim» son
pantalla completa (la grabación puede seguir dentro de una ficha):

```json
{ "fps": 60, "cerca": {"cx": 1771, "y0": 0},
  "planos": [
    {"tipo": "cara", "f0": 0,    "f1": 106,  "zooms": [1.0]},
    {"tipo": "anim", "f0": 106,  "f1": 180,  "id": "muse"},
    {"tipo": "cara", "f0": 180,  "f1": 1340, "zooms": [1.0, 1.08]},
    {"tipo": "anim", "f0": 1340, "f1": 2124, "id": "casos", "asentar": false},
    {"tipo": "cara", "f0": 2124, "f1": 2278, "zooms": [1.0], "empuje": 0.04} ] }
```

- En capas puro, todo es «cara» y los efectos van por tiempo.
- Punch-ins de 1,08 (≤ 9 %): los de 1,16–1,22 del modo cara quedan exagerados con capas encima (lo que va detrás de
  la cabeza se descoloca).
- Un plano que acaba en una ficha de vídeo: la ficha arranca con el zoom de la grabación en ese instante
  (`zoomVideo(t)`) y termina en el zoom del plano siguiente, para que el paso no salte.
- `"asentar": false` en un plano de animación que empieza **sin corte** (la grabación se encoge a ficha): si no, la
  cámara de la animación hace su asentamiento 1,06 → 1 y la ficha arranca más grande que la grabación (salto).
  Los planos que empiezan con corte seco o cuchilla sí lo llevan.

## 6. Transiciones sin corte

- **La grabación como ficha** (`videoFicha` / `pintarFicha`): a `s: 1` ocupa la pantalla exactamente como la
  grabación; mientras se ve, `estadoVideo` apaga sala y persona (`fondo: 1, sala: 0, persona: 0`). Al empezar un
  vídeo: entra pequeña e inclinada en el espacio y vuela a pantalla completa en ~0,8 s. Para una lista: se encoge a
  un lado (s ≈ .44, ry 14) y vuelve al final. Suena `transicion` (su pico, cuando la ficha llega).
- **Cuchilla** (`cuchilla(t, t0, {dur, ang, haciaAnim})`): una línea del acento cruza en diagonal y descubre la
  animación (o la cara) detrás. 0,3–0,35 s. Suena `corte`. Tiene que acabar dentro del plano de animación (si no,
  un fotograma de animación sin recorte asoma).
- **Iris** (`iris(t, t0, {dur, cx, cy, haciaAnim})`, en estadoVideo): un círculo con aro del acento se abre desde su
  cara y descubre la grabación (o al revés con `haciaAnim: true`). 0,4–0,45 s, más suave que la cuchilla; tiene que
  acabar justo donde acaba el plano de animación. Suena `aire` hacia el 70 %. Nació en «editado por IA», de vuelta del
  revelado.
- **Arrastrar y soltar** (`Explorador` + `Arrastre`): la grabación en ficha viaja en arco hasta el hueco de una
  ventana llevada por un cursor. Antes de que la agarre, la ficha flota con sus fotogramas clave; después,
  `arrastre.pos(t, hueco)`. Plano de animación sin asentamiento (`"asentar": false`), igual que el siguiente si la
  animación continúa sin corte (si no, la cámara salta al cambiar de ventana).
- **Fundido del fondo**: `fondo` en rampa; la persona se queda y la habitación desaparece.
- **Destello** (`destello(t, t0, .5)`): nunca blanco total; solo en un revelado.

## 7. Revisar, montar y entregar

- `anim.py revisar t1 t2 …` (juego de 720): mira las transiciones en 2–3 instantes, lo de detrás de la cabeza (que
  la cabeza lo tape de verdad) y que ningún texto quede bajo la persona si tiene que leerse.
- Mira 2–3 fotogramas a tamaño real: el contorno (sin halos raros en el pelo), el desenfoque y los subtítulos.
- `anim.py montar --res 1080` para el borrador (hace la mezcla de sonido) y `anim.py montar` para el final.
  Después `anim.py comprobar out/<x>.mp4 --palabras`.
- Entrega: MP4 final + 1080p, y di dónde están las pistas sueltas (trabajo/pistas/) por si quiere remezclar.
- Al terminar, borra los juegos grandes de fotogramas: `anim.py recortar --borrar 2160` (se regeneran si hace falta).

## 7 bis. Reel vertical (1080×1920)

`anim.py nuevo ... --vertical` deja `CONFIG` a 1080×1920. Todo lo demás es igual. Diferencias:
- **Encuadre:** `marcoVertical()` en `motor/capas.js`. La toma ocupa `vertical.alto` px de alto, abajo del todo y centrada en
  `vertical.cx`. Los zooms del montaje se anclan en la cara (`vertical.fy`) y el hueco de arriba se rellena estirando la
  primera fila de la toma. Con la cara a y ≈ 700, 1,14 en un corte se nota bien sin salirse (en «¿Ves este zoom?»).
- **Ficha de vídeo:** vertical (a `s: 1` es la pantalla). En el `Explorador`, haz el hueco vertical por CSS
  (`.expl .slot .mini{width:150px;height:267px}`) para que la ficha quepa entera.
- **Visor REC:** sube sus esquinas y rótulos a la zona segura por CSS en el propio index (ver `ejemplos/reel-editado-por-ia.html`).
- **Montaje:** `anim.py montar` sale a 1080×1920 con el juego de capas de la altura de la toma (2160 en 4K: ~4 GB en disco,
  ~7 min de recorte). Para revisar basta el de 720.

## 8. Rendimiento, disco y errores conocidos

- Disco: ~0,24 MB por fotograma a 720, ~0,45 MB a 1080, ~1,4 MB a 2160 (40 s a 60 fps en 4K ≈ 3,3 GB).
  `recortar` avisa si no hay espacio.
- Render: todo el vídeo pasa por el navegador (no solo las ventanas de animación como en el modo cara).
- **Un plano «anim» que empieza mientras la cuchilla aún corre**: un fotograma de animación sin recortar. Haz que la
  cuchilla termine exactamente donde acaba el plano de animación.
- **Algo pintado en WORLD durante una cuchilla** se recorta con la animación: lo que pertenece a la cara (un
  titular detrás de la cabeza) tiene que empezar después de la cuchilla.
- **El logo detrás de la cabeza no se ve**: si es más pequeño que la cabeza queda tapado entero; tiene que ser más
  ancho (asoma por los lados) o estar más arriba.
- **Texto sobre el acento ilegible**: el motor elige negro o blanco según el acento (`--sobre-acento`); no pongas
  `color:#111` fijo en una pieza nueva.
- **Dos planos «anim» seguidos** (la animación continúa sin corte): pon `"asentar": false` también en el segundo; si
  no, el asentamiento 1,06 → 1 empieza en mitad de un movimiento y la escena salta.
- **Un nombre largo en un revelado se corta con la transición de vuelta**: calcula cuándo termina de verse entero y
  alarga el plano de animación hasta ~0,5 s después (en «editado por IA» se alargó hasta justo antes de «de crear»).
