# El motor de animación (plantilla/index.html)

Un único HTML donde **cada fotograma es una función pura del tiempo**: `render(t)` coloca todas las piezas
para el instante `t` sin depender del fotograma anterior. Por eso se puede:
- renderizar con varios navegadores en paralelo (cada uno pinta fotogramas sueltos);
- saltar a cualquier instante para revisar (`anim.py revisar 12.4`, o `?t=12.4` en la previsualización);
- repetir el render y obtener exactamente lo mismo.

Consecuencia práctica: nada de `setTimeout`, `requestAnimationFrame`, transiciones CSS, `Math.random()` ni
`Date.now()` dentro de las escenas. Todo sale de `t`.

## Contenido

1. Estructura del archivo
2. Colocar piezas: `put()`
3. Tiempo y curvas
4. Fotogramas clave: `norm()` + `KF()`
5. Cómo se escribe una escena
6. Piezas incluidas
7. Cámara y halos
8. `layout()` y arranque
9. Errores que ya nos han pasado
10. Motor nuevo: estilo, sonido, dos mundos, capas de vídeo y piezas de `motor/`

## 1. Estructura del archivo

| Bloque | Qué es | ¿Se toca? |
|---|---|---|
| CSS | paleta (`:root`, `.lado-a/.lado-b/.lado-n`), fondo, piezas | colores de los bandos y piezas nuevas |
| `CONFIG` | duración, audio, tamaño, montaje y capas (lo rellena `anim.py nuevo`) | solo para cambiar el formato |
| `ESTILO` | modo, tema, acento, sonido, música, densidad, subtítulos (una línea JSON; `anim.py estilo`) | con `anim.py estilo` |
| `sfx()` | efectos de sonido declarados una vez (§ 10) | **sí, si el estilo lleva sonido** |
| `T` | inicio de las palabras clave de la voz | **sí: siempre** |
| utilidades, `put`, `KF`, `Wire`, piezas | el motor | no (añadir, sí) |
| ELEMENTOS / FOTOGRAMAS CLAVE / escenas | marcado como DEMO | **se sustituye entero** |
| `layout()`, `render()` | maquetación con fuentes cargadas y fotograma | se adapta a las escenas |
| arranque y previsualización | fuentes, logos, ruido, controles | no |

Todo lo que se mueve con la cámara se crea dentro de `#world` (lo que hace `mk()` por defecto).

## 2. Colocar piezas: `put(el, {...})`

`put` es la única forma de posicionar un elemento de primer nivel (con clase `.L`). Propiedades:

| clave | efecto | por defecto |
|---|---|---|
| `x`, `y` | punto de anclaje en px del lienzo 1920×1080 | obligatorio |
| `ax`, `ay` | anclaje dentro del elemento en % (50/50 = centro; `ax:0` = borde izquierdo) | 50, 50 |
| `o` | opacidad; ≤ 0,002 lo oculta del todo (`visibility:hidden`) | 1 |
| `s`, `sx`, `sy` | escala uniforme / por eje | 1 |
| `r` | giro en grados | 0 |
| `ry` | giro 3D en Y (volteo de carta), con perspectiva | 0 |
| `b` | desenfoque en px (entradas y salidas) | 0 |
| `g` | escala de grises 0..1 ("pierde el color") | 0 |
| `br` | brillo (0,7 = apagado) | 1 |

Los hijos de un elemento (textos de una tarjeta) se animan con `style.opacity/transform` directamente
(`rise()`, `slam()`).

## 3. Tiempo y curvas

- `P(t, t0, dur, curva)` → progreso 0..1 que empieza en `t0` y dura `dur`. Es la herramienta básica.
  Entrada: `const p = P(t, T.opus - .04, .5, E.out4)`; salida: `const q = P(t, 13.4, .35, E.in3)`, y luego `o: p * (1 - q)`.
- Curvas `E`: `out3/out4` (entradas), `in2/in3` (salidas), `io3/io4` (movimientos de un sitio a otro),
  `back` (entrada con un poco de rebote, para insignias), `spring` (muelle), `outExpo`, `ioSine` (derivas lentas de cámara).
- `bump(t, t0, d)` → 0→1→0: golpes de escala (`s: 1 + .08 * bump(...)`).
- `flash(t, t0)` → sube rápido y cae: destellos, brillos que se apagan.
- `blink(t)` → cursor que parpadea.
- `step(t - t0, w, z)` y `impulse(t - t0, w, z)` → física de muelle (la balanza de Astra):
  `ángulo = -17 * step(t - T.humillar, 9, .34) + 27 * step(t - T.astra, 7.5, .38)` suma escalones en cada evento
  y el rebote sale solo. `w` = rapidez, `z` = amortiguación (0,3 rebota; 0,6 casi no).
- `mix([r,g,b], [r,g,b], p)` → color intermedio (para SVG, donde `filter` no siempre vale).

## 4. Fotogramas clave: `norm()` + `KF()`

Para piezas que viajan entre escenas (una tarjeta que empieza a la izquierda, sube a una escalera y acaba
arriba en la escena de precios):

```js
const OPK = norm([
  [4.58, { x: 390, y: 570, s: 1, o: 0, b: 10 }],   // el primero lleva TODAS las propiedades
  [5.14, { x: 480, o: 1, b: 0 }, E.out4],            // entra
  [22.86, {}],                                       // se queda quieta hasta aquí
  [23.62, { x: 820, y: 740, s: .8, o: .5 }, E.io4],  // pasa a la escalera, atenuada
]);
put(cOpus, KF(t, OPK));
```

`KF` interpola solo las propiedades presentes en cada fotograma; `norm()` copia las que faltan del anterior.
Sin `norm()` las propiedades omitidas desaparecen (la pieza salta a 0). Un fotograma `{}` = "mantener".
`ringCard(t0, OPK, rgb)` usa esos mismos fotogramas para poner un anillo donde está la tarjeta en `t0`.

## 5. Cómo se escribe una escena

```js
function escenaCoste(t) {
  if (t < T.ademas - .1) { [barO, barA, nota].forEach(off); wHalf.draw(0, 0, 0); return; }  // fuera de rango: todo oculto
  const X = P(t, T.cierre, .4, E.in3);                  // salida común de la escena
  crecer(barA, t, { x: 1280, base: 944, alto: 470, t0: T.tener });
  ...
  put(nota, { x: 960, y: 709, s: lerp(.6, 1, E.back(hc)), o: clamp(hc * 2.2) * (1 - X) });
}
```

Reglas:
- **Cada escena pone TODOS sus elementos en todas las ramas** (visible con `put` u oculto con `off`).
  Si una rama se olvida de un elemento, al saltar hacia atrás se queda "colgado" en pantalla.
- Las escenas se solapan en el tiempo: la entrada de la siguiente empieza mientras sale la anterior.
- Una pieza que continúa de una escena a otra (misma tarjeta) no se destruye: se mueve con `KF`.
- `render(t)` llama a todas las escenas en cada fotograma y al final pinta los anillos (`PULSES`).

## 6. Piezas incluidas

| Pieza | Crear | Pintar en cada fotograma |
|---|---|---|
| Tarjeta de herramienta/modelo (500×300) | `tarjeta({lado, logo \| icono, empresa, familia, nombre, version})` | `card(el, KF(t, K), resalte)`; textos: `rise(el._fam, t, t0)`, `slam(el._nm, t, t0)`, `slam(el._ver, t, t0, 1.5)` |
| Nodo de flujo (132×132, etiqueta debajo) | `nodo({lado, logo \| icono, etiqueta})` | `put(el, ...)` + `nodoEstado(el, {relleno, h, dibujo})`: relleno 0 = hueco punteado con "+", 1 = lleno |
| Chip de cabecera que se escribe | `new ChipEscrito([{t0, icono, textos, tachar, borrar:[a,b]}])`; `textos` = `[[a,b,'texto']]` o `escribirPalabras('frase', [inicios], fin)` | `chip.pintar(t, {x, y, o})` (ancho fijo: no se desplaza al escribirse) |
| Insignia "VS" / "=" | `insignia()` | `put(el, ...)`; `badgeState(el, vsP)` (0 = "=", 1 = "VS") |
| Barra de métrica | `barra(lado, '$10 / $50', 'entrada / salida')` | `crecer(el, t, {x, base, alto, t0, dur})`; marca interna `el._mark` |
| Título letra a letra | `letters(texto, 'L title z5', 'palabraConDegradado')` + `letterTimes(texto, [inicio de cada palabra])` | `lettersIn(el, t, tiempos)` y `put(el, ...)`; `gradLetters(el)` en `layout()` |
| Cable discontinuo | `new Wire([[x,y], ...], {color, dash})` | `w.draw(desde, hasta, opacidad, flujo)`; si sus extremos siguen a piezas que se mueven, `w.set([[x,y], ...])` antes de dibujar |
| Paquete de luz | `new Dot()` | `travel(dot, wire, t, t0, t1)` |
| Pieza que viaja por un cable (un sobre, una píldora "resumen") | cualquier elemento `.L` | `viajar(el, wire, t, t0, t1, {o, s})` |
| Texto que se escribe (eyebrow, etiqueta) | `mk(...)` | `anchoFijo(el, 'TEXTO COMPLETO')` en `layout()` para que no se desplace; luego `el.innerHTML = texto.slice(0, n)` |
| Anillo que se expande | `pulse(t0, dur, x, y, w, h, radio, 'r,g,b', escalaFinal)` o `ringCard(...)` (en `layout()`) | automático |
| Icono Lucide | `icon('rocket', 40, 2)` (~100 incluidos, ver `ICON`; más con `anim.py iconos nombre-en-lucide`, nunca de memoria) | `drawStrokes(svg, p)` si se creó con `dibujable = true` |
| Logo | `logo('claude', 54)` → `<img data-logo>`; el archivo sale de `assets/logos/logos.json` | filtros con `put` (`g`, `br`) |

Ejemplo de flujo con nodos (correo → agente → Telegram; el destino es un hueco "+" hasta que se nombra):

```js
const nCorreo = nodo({ icono: 'mail', etiqueta: 'correo' }), nAgente = nodo({ lado: 'a', logo: 'claude', etiqueta: 'cerebro' });
const nDestino = nodo({ logo: 'telegram', etiqueta: 'Telegram' });
const w1 = new Wire([[0, 0], [0, 0]]), w2 = new Wire([[0, 0], [0, 0]]);
function escenaFlujo(t) {
  const a = KF(t, CORREO_K), b = KF(t, AGENTE_K), c = KF(t, DESTINO_K);           // posiciones con fotogramas clave
  put(nCorreo, a); nodoEstado(nCorreo, { relleno: P(t, T.correo, .4), dibujo: P(t, T.correo, .7) });
  put(nAgente, b); nodoEstado(nAgente, { relleno: P(t, T.claude, .4), h: P(t, T.cerebro, .3) });
  put(nDestino, c); nodoEstado(nDestino, { relleno: P(t, T.telegram - .04, .4) });   // hasta entonces, hueco "+"
  w1.set([[a.x + 70, a.y], [b.x - 70, b.y]]); w1.draw(0, P(t, T.correo + .3, .4, E.io3), a.o * b.o, t * 14);
  w2.set([[b.x + 70, b.y], [c.x - 70, c.y]]); w2.draw(0, P(t, T.resumen, .4, E.io3), b.o * c.o, t * 14);
}
```

Piezas más elaboradas ya resueltas en `ejemplos/` (copiar y adaptar): balanza con física (`balanza`,
`beamAngle`), carta que gira (`QK`/`AK` con `ry`), escalera de gamas (`ladder`), móvil con chat,
tarjetas de capacidades con iconos que se dibujan, fila de huecos numerados que se rellenan al nombrarlos
con el último convertido en carta "?" (ver `ejemplos/README.md`).

Para una pieza nueva: CSS con clase propia + creación con `mk()` + una función que la pinte a partir de `t`.
Nombra en español y comenta el porqué, como el resto del motor.

## 7. Cámara y halos

- `CAMK`: fotogramas clave de `{x, y, s}` = punto al que mira la cámara y zoom. Movimientos suaves
  (1,00–1,07), un "golpe" corto (1,02–1,03 en 0,15 s) en las palabras fuertes y vuelta a 1,00 en las transiciones.
  Comprueba que ningún elemento importante se sale del cuadro con el zoom.
- `GAK`/`GBK`: posición e intensidad de los halos de color de cada bando; siguen a su protagonista y bajan
  cuando pierde protagonismo. `glowN` es el halo neutro del principio.
- La rejilla se desplaza despacio (paralaje con la cámara): da vida aunque no pase nada.
- `render()` pide la cámara a `camara(t)` = `KF(t, CAMK)` más, en intros con cara, el asentamiento de cada ventana.
- Rótulo que debe quedarse fijo en pantalla aunque la cámara se mueva: `put(el, { ...fijo(t, x, y, s), o })`.

**Intros con cara** (`references/intro-con-cara.md`): si existe `edicion/montaje.json`, el arranque lo lee
(`cargarMontaje`) y `V.<id> = {a, b}` es la ventana en segundos de cada plano de animación; sin ese archivo todo
funciona como siempre. `dentro(t, V.id)` dice si t cae en la ventana (con 0,2 s de margen antes) y `ventanaDe(t)`
en cuál; cada escena apaga todas sus piezas fuera de la suya. `camara(t)` añade un asentamiento 1,06 → 1 en 0,55 s
al entrar en cada ventana. En la previsualización, los planos de cara muestran `edicion/cara_proxy.mp4` con el
mismo encuadre que tendrá el montaje (etiqueta «CARA · zoom» / «ANIM · id» arriba a la derecha).

## 8. `layout()` y arranque

El index.html se divide en dos `<script>`: el motor base (utilidades, `put`, `KF`, piezas de siempre) y, tras
cargar `motor/capas.js` y `motor/piezas.js`, las escenas (ELEMENTOS … FIN DE LA DEMO). Las variables de uno se ven
en el otro (scripts clásicos). `layout()` se ejecuta una vez, con las fuentes y los logos cargados: mide textos (`offsetWidth`),
calcula posiciones que dependen de ellos, prepara degradados (`gradLetters`) y crea los anillos.
El arranque (`window.__ready`) espera fuentes → logos (`cargarLogos`) → montaje (`cargarMontaje`) → capas
(`cargarCapas`) → recursos (`cargarRecursos`: palabras y nivel de voz si alguna pieza los pide) → ruido →
`layout()` → `render(0)`. `render.mjs` lee `window.__CONFIG` y llama a `window.__render(t)` en cada fotograma
(async: con grabación espera a que la imagen de ese fotograma esté cargada).

## 9. Errores que ya nos han pasado

- **Espacios que desaparecen** en títulos letra a letra: cada letra es `inline-block`; el espacio tiene que ser ` ` (`letters()` ya lo hace).
- **`KF` sin `norm()`**: una propiedad omitida en un fotograma se pierde y la pieza salta.
- **Elementos colgados** al revisar fuera de orden: una rama de la escena no los ocultaba.
- **Degradado de texto por letras**: `background-clip:text` en cada letra necesita `background-size/position`
  calculados en `layout()` (`gradLetters`); si no, cada letra repite el degradado entero.
- **Texto medido antes de cargar la fuente**: todo lo que dependa de anchos va en `layout()`.
- **Números intermedios** en un contador (`$3 / $14` mientras sube la barra): si una pausa del vídeo los
  muestra, parecen datos. La barra muestra el valor final cuando cabe (`crecer` ya lo hace).
- **`filter: grayscale` en elementos internos de un SVG** no siempre funciona: cambia los colores con `mix()`.
- **Zoom que corta**: con la cámara en 1,07 desplazada, la tarjeta del borde se salía 7 px. Revisa los extremos.
- **Anillos en una tarjeta que se mueve**: `ringCard` toma la posición en `t0`; ponlos cuando la tarjeta esté quieta.
- **Hoja de contactos sin tiempos en Windows**: `drawtext` de ffmpeg necesita `fontfile` (ya resuelto en `stills.mjs`).
- **Texto centrado que se escribe letra a letra** se desplaza a la izquierda mientras crece: fija su ancho con el
  texto completo (`anchoFijo`; `ChipEscrito` ya lo hace) y escribe alineado a la izquierda.
- **Chip a velocidad fija**: las palabras aparecen antes o después de decirse; usa `escribirPalabras`.
- **Golpe (`slam`) en un texto centrado de ancho completo**: `slam` escala desde la izquierda; después de llamarlo
  pon `el.style.transformOrigin = '50% 75%'`.
- **`--scale=2` salía a 1080p**: `Page.captureScreenshot` de CDP ignora el `deviceScaleFactor` de la página y captura a
  1x. `render.mjs` ya pasa `clip: {x, y, width, height, scale: SCALE}` (idéntico a `page.screenshot`, 4 veces más rápido).
  Comprueba siempre el tamaño del MP4 con `ffprobe` antes de dar por bueno un render 4K.

## 10. Motor nuevo: estilo, sonido, dos mundos, capas de vídeo y piezas de `motor/`

### Estilo y acento
`ESTILO` (index.html) guarda lo elegido al empezar (`references/estilos.md`). `motor/capas.js` pone `--acento`,
`--acento-rgb` y `--sobre-acento` (negro o blanco según lo claro que sea) en CSS y `ACENTO_RGB` en JS. Una pieza nueva
usa `var(--acento)` / `rgba(var(--acento-rgb), a)` y, para texto sobre el acento, `var(--sobre-acento)`.

### Sonido
`sfx(t, 'nombre', { vol, pan })` — una vez, fuera de `render()` (arriba o en `layout()`). Tabla de qué suena con cada
cosa y biblioteca: `references/sonido.md`. `window.__SFX` lo lee `tools/sonidos.mjs`.

### Dos mundos
`WORLD` (detrás de la persona) y `WORLDF` (delante). Misma cámara: en `render()`,
`WORLD.style.transform = WORLDF.style.transform = ...`. `mk(tag, cls, WORLDF)` crea delante. Una pieza puede
cambiar de mundo con `WORLDF.appendChild(el)` (lo hace `Orbita` al pasar por delante). Sin grabación da igual.

### Capas de vídeo (`motor/capas.js`, modos capas y combinado)
| Función | Qué hace |
|---|---|
| `estadoVideo(t)` (en index.html) | devuelve `{ fondo, persona, sala, blur, br, blurSala, brSala, halo, haloRgb, zoom, clipAnim, clipVideo, iris }` (capas-sobre-video.md § 3; `zoom`, nunca para golpes cortos) |
| `pintarCapas(t, est)` | pinta sala, persona y opacidad del fondo; la llama `render()` al principio |
| `planoEn(t)`, `enAnim(t)` | plano del montaje exacto al fotograma; ¿es de animación? |
| `zoomVideo(t)` | zoom del encuadre del montaje en t (para que una ficha arranque igual que la grabación) |
| `videoFicha({etiquetas, pie})` + `pintarFicha(el, t, k, {zoom, radio, etiquetas, pie})` | la grabación dentro de una ficha de 1920×1080 (a `s: 1` coincide con la pantalla) |
| `cuchilla(t, t0, {dur, ang, haciaAnim})` | transición en diagonal; devuelve `{ est, p }` mientras dura (úsalo en estadoVideo) |
| `iris(t, t0, {dur, cx, cy, haciaAnim, radio})` | transición en círculo que se abre desde (cx, cy) con aro del acento; igual que la cuchilla (`return c.est`) |
| `destello(t, t0, fuerza)` | destello suave sobre todo (≤ 0,55) |
| `crearFondo(ESTILO.fondo, FONDOK, {ondas, paleta, direccion})` + `.pintar(t, {dx, dy})` | el fondo del concepto: `cortina`, `aurora`, `malla`, `constelacion`, `liso` (o `null` con `puntos`); `FONDOK` con `vel` (26 calma, 90–150 viaje) y `brillo`; `ondas`: instantes de los golpes; `paleta`: `paletaDe(rgb)` |
| `new Cortina(FONDOK, {ondas, direccion, paleta})` | hebras de luz; `direccion` 0 (verticales), 90 (horizontales) o −20…20 (diagonales) |
| `new Aurora / Malla / Constelacion / Liso(FONDOK, {ondas, paleta})` | cintas de color / líneas de relieve / nodos unidos / degradado con grano; todos heredan de `FondoBase` (para hacer uno nuevo: `dist(t)`, `preparar()`, `base()`, `polvo()`, `onda(t)`) |
| `paletaDe(rgb)` | cuatro tonos a partir del acento o de la marca: acento, claro, vecino, contrapunto |
| `ESTILO.acabado` / `ESTILO.tipo` | `aplicarAspecto()` pone `--panel-bg`, `--panel-borde`, `--panel-sombra`, `--panel-k` (factor de redondeo), `--panel-filtro` y `--display`, `--display-peso` (y `--sans` con grotesk); las piezas los usan, y las nuevas deben usarlos |
| `new Espacio(ESPACIOK, {horizonte, fuga})` + `.pintar(t, {dx, dy})` | fondo espacio 3D con suelo de rejilla; `ESPACIOK` con `vel`, `hiper`, `suelo`, `estrellas`. Recuerda al vídeo de referencia: solo si Josema lo pide |
| `nivelVoz(t)` | 0..1 del volumen de la voz (para vúmetros; pon `NECESITA.voz = true`) |
| `PALABRAS` | trabajo/tiempos.json (con `NECESITA.palabras = true`) |

### Piezas de `motor/piezas.js`
Todas: se crean una vez con sus tiempos y se pintan con `.pintar(t, {...})` (o la función `pintarX`). Las que
tienen tiempos declaran su sonido (`sonido: false` para callarlas).

| Pieza | Crear | Pintar |
|---|---|---|
| Panel de cristal | `panel({ w, h, clase, html, padre, z })` | `put(el, { ..., rx: 6, ry: -9 })` |
| Icono de app | `iconoApp({ logo \| icono, fondo: '#fff', tam })` | `put` |
| Iconos que orbitan la cara | `new Orbita([{ logo, fondo, t0 } \| { logo, x, y, delante }], { cx, cy, rx, ry, vel, fase, t1, tam })` | `.pintar(t, { o })` |
| Titular gigante (detrás) | `new TituloGigante([{ texto }, { texto, acento: true }], { tiempos, y0, paso, tam, sal, padre })` | `.pintar(t, { o, x, y0 })` |
| Subtítulos palabra a palabra | `new Subtitulos({ y, max, tam, desde, hasta, ocultar: t => … })` | `.pintar(t)` |
| Leyenda de una línea | `new Leyenda('Google *Drive*', { t0, t1, y })` | `.pintar(t, { o })` |
| Rótulo de nombre y cargo | `new RotuloNombre({ nombre, cargo, t0, t1 })` | `.pintar(t)` |
| Buscador / prompt | `new Buscador('texto', { t0, palabras: [inicios], fin, t1, ancho })` | `.pintar(t, { x, y, o, s })` |
| Tarjeta de fuente | `tarjetaFuente({ logo \| icono \| img \| htmlTop, dominio, favicon, titulo, fondo, t0, padre })` | `pintarFuente(el, t, k, t0)` |
| Tarjeta de subida | `new TarjetaProgreso({ logo, cabecera, cabeceraFin, img \| html, titulo, canal, via, t0, t1, tFin, sal })` | `.pintar(t, k)` |
| Notificación | `new Notificacion({ logo, app, titulo, texto, extra, boton, t0, tBoton, t1 })` | `.pintar(t, k)` |
| Carpeta | `carpeta({ logo, etiqueta })` → `{ atras, delante }` | `pintarCarpeta(c, k, abre)` |
| Revelado de marca | `new Revelado({ logo, nombre, t0, t1, rgb, x, y, tam })` | `.pintar(t, { o })` |
| Esfera de puntos → figura | `new EsferaPuntos({ n, radio, forma: { logo \| icono \| texto }, tForma, t0 })` | `.pintar(t, { x, y, o, s })` |
| Palabra que se deshace | `new Polvo('TEXTO', { t0, dur, tam, rgb })` | `.pintar(t, { x, y, o })` |
| Cuadrícula de 100 | `new Cuadricula100({ pct, t0, dur, etiqueta, rgb })` | `.pintar(t, k)` |
| Rótulo en bloques | `new Rotulo(['Totalmente', 'GRATIS'], { acento: [1], tiempos, sal, tam })` | `.pintar(t, { x, y, rx, ry, o })` |
| Cursor que pulsa | `new Cursor(norm([[t, { x, y, o }], …]), { clics: [t] })` | `.pintar(t)` |
| Línea de tiempo de editor | `new LineaTiempo({ t0, t1, sal, pistas: [{ etiqueta, color, clips: [[a, b]] }], cabezal })` | `.pintar(t, { x, y, rx, o })` |
| Visor de cámara (REC) | `new VisorREC({ t0, t1, ficha, finFicha, formato })` | `.pintar(t)` |
| Línea de escaneo | `new Escaneo({ t0, dur })` | `.pintar(t)` |
| Panel de tareas que se completan | `new PanelTareas({ titulo, icono, tareas, tiempos, t0, tFin, sal })` | `.pintar(t, { x, y, rx, ry, o })` |
| Panel de un concepto (FX, sonidos) | `new PanelConcepto({ marca \| icono \| logo, titulo, chips, onda: { a, b }, t0, sal, lado, sonidoEntra })` | `.pintar(t, { x, y })` |
| Ventana del explorador con hueco | `new Explorador({ titulo, ruta, items: [{ icono \| logo, nombre }], hueco, t0, tSuelta })` + `.hueco(x, y, s)` | `.pintar(t, { x, y, s, o, b })` |
| Arrastrar y soltar con cursor | `new Arrastre({ tEntra, tAgarra, tSuelta, desde: { x, y, s }, agarre, cursorDesde })` + `.pos(t, hasta)` | `.pintar(t, obj)` |
| Revelado con haces de luz | `new RevelarHaces({ logo, nombre (html, <b> en c2), sub, t0, tSale, desde, rgb, c2, x, y, yNombre, t1 })` | `.pintar(t)` |
| Ruta vertical de pasos | `new RutaPasos([{ t0, icono \| logo, titulo, sub }], { titulo, entra, sal, destacar: { t, i, etiqueta, icono, pulsos } })` | `.pintar(t, { x, y, rx, ry, o })` |
| Tarjeta de regalo que se instala | `new TarjetaRegalo({ icono, etiqueta, nombre, id, archivos, t0, tInstala, tLista, textoLista, sal })` | `.pintar(t, { x, y, rx, ry })` |
| La toma en bruto como línea de tiempo (sus pausas reales que desaparecen) | `new LineaBruto({ bloques, total, final, t0, tPausas, tLogo, logo, quien, tJuntar, tExpandir, cortes: [{ t, i }], sal })` | `.pintar(t, { x, y, s, rx, ry, o })` |
| Caja de comentario que se escribe sola («comenta EDICIÓN») | `new Comentario({ palabra, etiqueta, t0, tEscribe, tEnvia, textoEnviado, sal })` | `.pintar(t, { x, y, s, rx, ry, o })` |

**Vertical (reels, CONFIG 1080×1920):** los valores por defecto de las piezas son el centro de la pantalla (`CX`, `CY`) y los
lienzos toman `CONFIG.ancho/alto`, así que casi todo funciona igual. Las piezas pensadas para ir al lado de la cabeza
(`PanelTareas`, `TarjetaRegalo`, `RutaPasos`, `Explorador`) se colocan a mano debajo de la barbilla (y ≈ 1240). El encuadre de
la grabación lo calcula `marcoVertical()` (capas.js) y la ficha de vídeo es vertical (lo mismo que se ve en pantalla).

Ejemplos completos: `ejemplos/editado-por-ia.html` (el de referencia hoy: Cortina, iris y las diez piezas de abajo de
la tabla) y `ejemplos/muse-capas.html` (casi todas las demás; su fondo, su carpeta y su revelado recuerdan al vídeo
de referencia). `codigoTiempo(t)` da el mm:ss:ff de los visores; `sonar(o, t, id, vol, pan)` declara el sonido de una
pieza (respeta `sonido: false`).

### Errores ya vistos con el motor nuevo
- **Copia vieja de `motor/` en un proyecto**: si una función «no está definida» (zoomVideo…), copia otra vez
  `<skill>/plantilla/motor/*.js` al proyecto.
- **Un logo que se usa solo como silueta** (EsferaPuntos) tiene que existir como `<img>` para cargarse: la pieza ya
  crea uno oculto.
- **Piezas de interfaz detrás de la persona**: por defecto van en WORLDF; si las creas con `mk` a mano, pásale WORLDF.
