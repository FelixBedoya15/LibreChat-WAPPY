# Sonido: efectos, música y mezcla

Con `ESTILO.sonido` en `efectos` o `musica`, cada cosa que entra o sale de pantalla suena, hay música de fondo
bajo la voz y se entrega una mezcla a −14 LUFS (lo que pide YouTube). Estilo: **minimalista y de intriga**
(golpes graves, aire, ticks, notas suaves, swells); nada de «pops» de dibujos animados ni efectos exagerados.
Con `sonido: voz` todo sigue como antes (la pista es solo la voz y Josema mezcla en su edición).

## Contenido

1. Cómo se declara un sonido
2. La biblioteca de efectos
3. Qué suena cuando algo entra o sale
4. Música de fondo
5. La mezcla
6. Reglas y errores conocidos

## 1. Cómo se declara un sonido

```js
sfx(T.opus - .02, 'golpe');                 // el golpe del sonido cae en ese instante
sfx(T.vs, 'tick', { vol: .7 });             // vol 1 = nivel por defecto; .5 ≈ −6 dB
sfx(2.1, 'aire', { pan: -.4 });             // pan −1 izquierda … 1 derecha (una tarjeta que entra por la izquierda)
```

- Se declaran **una vez**, fuera de `render()`: arriba junto a la pieza, o en `layout()` si dependen de las
  ventanas `V` del montaje (`sfx(V.casos.a, 'transicion')`).
- Cada sonido tiene un punto de golpe (`pico` en `sonidos/sonidos.json`): cae exactamente en t. El `swell` tiene
  el ancla al final (termina en t: anticipa un revelado).
- Las piezas de `motor/piezas.js` declaran solas su sonido de entrada y de salida (con `sonido: false` se callan).
  Las de siempre (tarjeta, chip, nodo, barra, título…) llevan `sfx()` a mano: tabla del § 3.
- `anim.py sonido --lista` enseña la biblioteca con su descripción.

## 2. La biblioteca de efectos (`<skill>/sonidos/`)

| Familia | Sonidos | Para |
|---|---|---|
| golpe | `golpe`, `golpe-corto`, `golpe-grave`, `impacto` | un nombre, logo o cifra que entra con fuerza; revelados |
| aire | `aire`, `aire-salida`, `barrido`, `transicion` | piezas que entran, salen o viajan; la grabación que se convierte en ficha |
| tick | `tick`, `tick-suave`, `click`, `bip`, `descarte`, `pop` | chips, etiquetas, iconos en serie, botones, un contador, algo que se descarta |
| nota | `nota`, `nota-doble`, `campana`, `ping`, `brillo` | aciertos, «gratis», «listo», un mapa que se enciende |
| aviso | `notificacion` | una notificación o un mensaje que entra |
| tecla | `tecla`, `tecleo` | un prompt o un buscador que se escribe |
| subida | `swell`, `subida` | anticipación (el swell termina en el golpe; el riser largo, 4,8 s) |
| corte | `corte` | la transición de cuchilla |
| glitch / error | `glitch`, `glitch-fuerte`, `fallo` | cambio digital, algo que falla (poco) |

Sintetizados (sin derechos) y de Pixabay (uso comercial sin atribución): `sonidos/CREDITOS.md`. Para añadir uno:
cópialo a la biblioteca de media-use o edita `scripts/biblioteca_sonidos.py` y ejecútalo (normaliza, mide el
golpe y calcula la ganancia de su familia).

## 3. Qué suena cuando algo entra o sale

| Momento | Sonido | vol |
|---|---|---|
| entra la pieza principal de una escena (tarjeta, panel, ficha) | `aire` (el pico cuando llega a su sitio) | 1 |
| sale una pieza o se cierra una escena | `aire-salida` (o nada si salen varias a la vez: uno solo para el grupo) | .5–.7 |
| un nombre, un logo o una cifra entra con golpe (`slam`) | `golpe-corto`; el protagonista principal, `golpe` | .8–1 |
| título o titular gigante | `golpe` en la primera palabra, `golpe-corto` en la segunda | 1 / .8 |
| chip, etiqueta, insignia VS, icono de una lista, hueco que se rellena | `tick` | .6–.9 |
| elementos pequeños en serie (iconos, casillas) | `tick-suave` (uno por elemento, nunca más de 3 en 0,3 s) | .7–.8 |
| algo se descarta, se tacha, pierde el color | `descarte` | .8 |
| check, «gratis», algo positivo | `nota`; «listo», «publicado» | `nota-doble` | .8–.9 |
| una barra crece o un contador sube | `aire` al empezar + `golpe-corto` al llegar | .7 / .9 |
| el mapa se enciende, algo brilla | `brillo` | .6–.8 |
| cursor que pulsa, botón | `click` | 1 |
| un prompt o buscador que se escribe | `tecleo` al empezar | .8 |
| notificación | `notificacion` | .9 |
| revelado de un producto | `swell` (termina en t0) + `golpe-grave` en t0 + `brillo` | .8 / 1 / .7 |
| la grabación se encoge a ficha o vuelve a pantalla completa | `transicion` (pico cuando llega) | .8 |
| la habitación se desvanece (fondo sustituido) | `transicion` | .5–.6 |
| corte seco de cara a animación (modo cara) | `barrido` | .6–.8 |
| cuchilla | `corte` | .9 |

## 4. Música de fondo (`<skill>/musica/`)

| Clave | Tema | Uso |
|---|---|---|
| `intro-tambores` (por defecto) | Epical Drums 01 — Grigoriy Nuzhny | intros: tambores épicos cinematográficos. Josema la pidió «épica, pero que pegue» y la aprobó (30/09/2026): −15 dB, ducking 3 y un redoble terminando en el revelado |
| `intro-scifi` | Sci-Fi Score — Arulo | electrónica cinematográfica oscura, crece los primeros 15 s. Se le quedó corta en una intro: solo si la quiere más sobria |
| `explicacion-jazz` | Smooth Like Jazz — Ahjay Stelino | partes que explican, disclaimers, cierres |
| `explicacion-tech` | Cyberpunk City — Alejandro Magaña | explicaciones largas donde el jazz no pega |

Mixkit, licencia gratuita (sin atribución, apta para YouTube monetizado): `musica/CREDITOS.md`.

- Nivel: `nivel_db` de musica.json respecto a la voz (−16 a −19); `ESTILO.musicaDb` lo cambia en un proyecto. Baja
  4 dB más mientras habla (`ESTILO.ducking`). Referencia del vídeo analizado: épica solo en la intro, jazz tranquilo
  en el resto.
- Un vídeo con intro y explicación: `ESTILO.tramosMusica = [{ pista: 'intro-tambores', t0: 0, t1: 38 }, { pista: 'explicacion-jazz', t0: 38, t1: 113 }]`
  (cada tramo con su `desde`, `nivel_db`, `entrada`, `salida` opcionales).
- **Cuadra la música con el montaje** (lo que hace que suene «épica, pero que pegue»): `anim.py golpe --en <t del
  revelado> --tambien efectos titulos …` analiza los golpes del tema (platos y bombo, y el redoble que los prepara) y
  propone el `desde` para que uno caiga en ese instante; cuenta además cuántos de los otros momentos (números o nombres
  de `T`) coinciden con un golpe. Pega la línea que imprime en `ESTILO.tramosMusica`, rehaz la mezcla y escucha
  `trabajo/pistas/musica.wav` alrededor del golpe. En «editado por IA»: `desde: 22.665`, `nivel_db: -15`,
  `entrada: .35`, `ESTILO.ducking: 3`; la voz quedó 18 dB por encima de media (nunca menos de 13).
- Si Josema quiere otra música, que la deje en `musica/` y se añade a musica.json (o se descarga de Mixkit un tema
  marcado «Free License», nunca «Restricted»).
- **Varía**: elige el tema por el tono de ESTE vídeo (la lectura y el concepto), empieza en un `desde` distinto al del
  último vídeo (`anim.py historial`) y, si el mismo tema ya ha sonado dos vídeos seguidos, busca otro en Mixkit con el
  mismo carácter y añádelo a la biblioteca.

## 5. La mezcla (`anim.py sonido`; la lanzan `render` y `montar`)

1. `node tools/sonidos.mjs` lee de la página los `sfx()`, el estilo y la voz → `trabajo/sonidos.json`.
2. `scripts/sonido.py`: voz a −16 LUFS (referencia) · efectos en su sitio con su ganancia · música al nivel pedido,
   en bucle si hace falta, con entrada/salida suaves y ducking · limitador de picos · loudnorm lineal a −14 LUFS y
   −1 dBTP → `assets/audio/mezcla.wav` y las pistas sueltas en `trabajo/pistas/` (voz, música, efectos, ya al
   nivel del master).
3. La previsualización (`node server.mjs`) suena con la mezcla si existe (rótulo «· mezcla» en la barra); rehazla
   con `anim.py sonido` después de cambiar un `sfx()`.

El informe avisa de sonidos desconocidos, efectos fuera del vídeo, más de 4 efectos en 0,3 s y si el master no pudo
ser lineal.

## 6. Reglas y errores conocidos

- Cada golpe visual, un sonido; varios elementos que entran juntos = un solo sonido.
- Nunca más de un golpe grave por segundo (se emborrona); los ticks sí pueden ir seguidos.
- Los efectos van debajo de la voz: ninguno pasa de −9 dBFS de pico en la biblioteca y las familias están igualadas.
  Si uno se oye mucho, baja su `vol` en ese `sfx()`, no la biblioteca.
- **Mezcla «DINÁMICA»**: loudnorm no pudo subir por igual (picos). El limitador lo evita; si vuelve a salir, algún
  efecto con vol > 1 coincide con una palabra fuerte.
- Primera versión (29/09/2026): los golpes a nivel de voz tapaban palabras; se bajaron todas las familias 5–8 dB.
