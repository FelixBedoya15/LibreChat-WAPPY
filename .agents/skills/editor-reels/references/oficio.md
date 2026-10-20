# El oficio: cómo se integra la voz con las animaciones

Lo que hace bueno un reel del modo pro no son las piezas, sino que **la imagen cuenta lo que dice la voz en el momento exacto en que lo dice**. Esta guía explica cómo se consigue. Léela antes de escribir el primer guion pro.

## Índice

1. La idea
2. Los tres planos
3. El plan del reel, frase a frase
4. Qué pieza pide cada frase
5. Construir con la voz
6. Datos y material real
7. Ritmo y variedad
8. Sonido
9. Revisión antes de entregar
10. Errores que ya se han cometido

## 1. La idea

- **Quien manda es la voz.** El espectador oye una frase y, en ese instante, ve aparecer justo eso: el nombre, la cifra, el logo. Si llega medio segundo tarde parece un vídeo con rótulos; si llega en la sílaba, parece que la persona «hace aparecer» las cosas al hablar.
- **La imagen explica; el subtítulo ya repite.** Una pieza que dice con otras letras lo mismo que la voz no aporta. Aporta la que enseña el mecanismo (qué es «entrada» y qué es «salida»), la proporción (cinco monedas frente a una) o la prueba (la página oficial).
- **Nada en pantalla va por delante de la voz ni dice otra cosa.** Lo que aún no se ha dicho no está, o espera apagado.

## 2. Los tres planos

Se alternan durante todo el reel; el cambio de uno a otro es lo que da ritmo.

| Plano | Qué es | Cuándo |
|---|---|---|
| **Cara + pieza** | La persona a cámara y, sobre el pecho, una pieza que se construye con la voz | opiniones, avisos, datos sueltos, llamadas a la acción |
| **Escena** | Pantalla completa oscura (la voz sigue): la página real de la fuente, un esquema, una lista | lo que se entiende mejor viéndolo; cada 10–15 s, para romper |
| **Primer plano** | La persona más cerca, sin pieza, con el subtítulo grande | frases directas al espectador («te cuento lo que te interesa») |

Dentro del plano de cara hay tres tratamientos, para que no sea siempre «la misma tarjeta»: **tarjeta** (datos), **texto suelto** en letra grande (frases a cámara) y **piezas que se encienden** (preguntas y cierres).

## 3. El plan del reel, frase a frase

Antes de tocar el guion, con la tabla de `reel.py alinear` delante, escribe un plan: una fila por frase. Es el paso que más mejora el resultado; guárdalo en el `README.md` del reel.

| Tiempo | Frase | Plano | Pieza | Qué entra en qué palabra |
|---|---|---|---|---|
| 0,0–2,2 | Google acaba de soltar una bomba | cara | `titular` | completo desde el fotograma 0; golpe en «bomba» (1,64) |
| 2,2–5,4 | …acaba de anunciar Gemini 4 Argon | escena | `revelado` | la web oficial; «GEMINI» (3,68), «4» (4,24), «ARGON» (4,92) |
| 5,4–10,2 | …competir con Anthropic y OpenAI | cara, más cerca | `presentacion` | tarjeta en «Su nuevo modelo»; pastillas en «Anthropic» y «OpenAI» |
| 10,2–12,4 | Te cuento lo que a ti te interesa | primer plano | ninguna | subtítulo grande |

Para cada frase pregúntate, por este orden:

1. **¿Qué es lo importante de la frase?** Una cosa. Si hay tres, es una lista, o son tres frases.
2. **¿Qué se pregunta el espectador al oírla?** («¿cuánto cuesta?», «¿y yo puedo usarlo?»). Esa pregunta es el titular de una escena.
3. **¿Cómo se ve eso sin leer?** Una proporción, un antes y un después, un sitio real, un estado (sí, no, aún no).
4. **¿En qué palabra entra cada parte?** Apunta el tiempo de esa palabra: será su `en`.
5. **¿Qué plano toca?** No repitas el mismo tres veces seguidas.

Comprueba el plan: el fotograma 0 ya tiene el gancho entero; el primer cambio de plano llega antes del segundo 3; hay un cambio visual cada 1–2 s (una pieza que entra, algo que se enciende, un corte); hay al menos una escena cada 15 s; el cierre tiene su propia pieza.

## 4. Qué pieza pide cada frase

| La frase… | Pieza |
|---|---|
| es el gancho | `titular` (2–5 palabras, una en la caja de acento) |
| da una noticia con fuente oficial | `revelado` (la página real + el nombre) |
| presenta algo o a alguien | `presentacion` |
| nombra varias herramientas | `logos`, o la banda de `presentacion` |
| compara cifras | `columnas`; si la gracia es «N veces», `escena` con `monedas` |
| explica cómo funciona algo | `escena` con `flujo` |
| dice que algo cambia | `cambio` |
| afirma o niega algo importante | `sentencia` |
| enumera ventajas, pasos o requisitos | `lista`, o `escena` con `filas` si son más de 3 o responden a una pregunta |
| deja algo pendiente (fecha, precio) | `campo` |
| enseña una web o una app | `escena` con `ventana` |
| habla directamente al espectador | primer plano, sin pieza |
| pregunta al espectador | `pregunta` |
| pide comentar | `comenta` |
| pide me gusta, compartir, seguir | `acciones` |
| pide algo que no está aquí | una pieza propia (ver `guion-pro.md`, apartado 9) |

**El catálogo es un punto de partida, no una plantilla.** Cada reel debería tener al menos una imagen pensada para su tema: una metáfora que solo vale ahí. Cambia también los rótulos, los iconos y el orden de los planos de un reel a otro; lo que se mantiene es el sistema (colores, tipografía, zonas) y la sincronía.

## 5. Construir con la voz

- **Cada elemento tiene su palabra.** Su `en` es el inicio de esa palabra según la alineación (o 0,02–0,05 s antes). Nunca a ojo, nunca con los tiempos de Whisper.
- **La pieza entra 0,1–0,3 s antes** de lo primero que enseña, para no aparecer vacía y no llegar tarde.
- **Lo que espera, apagado.** Una lista, unas pastillas o unas respuestas se ven enteras desde que entra la pieza, en gris, y cada una se enciende cuando se nombra: da tiempo a leer y el ojo sabe dónde mirar.
- **Apagado no es «bloqueado».** Bajo una pregunta como «¿quién puede usarlo?», un candado en una fila que todavía no se ha nombrado se lee como «este no». Mientras espera: gris y sin símbolo.
- **Una frase a cámara se escribe con la voz.** En una `sentencia`, «AÚN NO» entra en «aún» y «DISPONIBLE» en «disponible». Un «DISPONIBLE» esperando en pantalla diría lo contrario durante un segundo.
- **No añadas orden, causas ni cifras que la voz o la fuente no dan.** Si la fuente no dice qué llega primero, las dos cosas van al mismo nivel y con un rótulo neutro («LLEGARÁ A», no «PRIMERO»).
- **Lo último que entra tiene que poder leerse:** al menos 1 s en pantalla, y una lista completa, 2 s. Si la frase siguiente llega antes, pre-dibuja la estructura o acorta el texto; no dejes la pieza encima de otra frase.
- **La pieza anterior a una escena no se funde:** se queda entera hasta que la tapa la cortina (lo hace `edl`).

`reel.py edl` imprime la **tabla de sincronía** (cada cosa que entra y la palabra que suena en ese instante) y los avisos de tiempo de lectura. Léela entera: es la comprobación de que el plan se ha cumplido.

## 6. Datos y material real

- **Todo dato que no dice la voz se comprueba** en la fuente oficial antes de ponerlo. Si es una comparación (precios de otros, puntuaciones), en dos fuentes más: una sola puede equivocarse o confundir dos productos.
- **Apunta cada dato y su fuente** en el `README.md` del reel, y díselo al usuario al entregar.
- **La fuente también va en pantalla,** pequeña y en frase normal («Datos: Google»), no como rótulo.
- **Nombres como son, no como suenan.** Si la persona pronuncia mal un nombre, en pantalla va el correcto; avísale.
- **Material real mejor que una maqueta:** la página oficial (`reel.py captura`), el logo oficial (`reel.py logos`). Mira la captura antes de usarla y recorta el aviso de cookies.
- **Subtítulos:** corrige en `textos` lo que se comió al hablar («de seguirme» donde dijo «seguirme») y pon los signos que cambian el sentido («¿», «?», la coma de «Ojo,»). Sin coma entre sujeto y verbo («¿Y tú crees…?»), aunque al hablar haga una pausa.

## 7. Ritmo y variedad

- **El encuadre solo cambia en los cortes:** abierto (1,0–1,035) ↔ más cerca (1,10–1,14) ↔ primer plano (1,17–1,2, solo sin pieza). Entre dos planos de cara seguidos, que el salto sea de 0,1 o más: con menos se lee como un fallo, no como un cambio de plano. Dentro del tramo, un empuje muy lento. Nunca zooms cortos de «tambaleo».
- **Capítulos** cuando el vídeo tiene partes («01 PROGRAMACIÓN», «02 PRECIO»): dicen por dónde va.
- **Poco a la vez:** una pieza, el capítulo, el logo y el subtítulo. Nada más.
- **No repitas pieza dos veces seguidas.** Dos tarjetas con cabecera seguidas se sienten iguales aunque el contenido cambie: alterna con una escena, una sentencia o el primer plano.
- **Sin pausas entre frases.** Un reel tiene que ser dinámico: entre el final de una frase y el principio de la siguiente, una décima de segundo, no tres. `cortar` ya deja 0,05 s por lado; no alargues un tramo «para que respire». Después de cortar, mira las pausas que quedan dentro de los tramos (`cortar` las imprime: «··· pausa 0.4s»):
  - si una escena tapa la cara, quítalas partiendo el tramo (`43.36-=45.20,=45.32-=47.12`): el corte no se ve. En una enumeración, deja el mismo hueco entre todos los elementos (unas tres décimas) para que no suene a trompicones;
  - si se ve la cara, quita las de medio segundo o más; las de tres décimas dentro de una frase son su forma de hablar;
  - comprueba con el audio que el hueco es silencio de verdad y no una vocal que se alarga (el nivel baja 30 dB respecto a la voz).
- **Si el remate tiene que leerse, se queda la pieza, no el silencio.** Una palabra que cierra el gancho («…y es totalmente GRATIS») no necesita un respiro en la voz: deja la pieza 0,3 s sobre el plano siguiente (`f` después del corte). Los subtítulos vuelven solos en el corte.
- **Cambio de plano sin corte.** Para pasar a primer plano en una frase a cámara que no tiene pausa («Pero no te preocupes, | he preparado un vídeo»), parte el tramo en dos contiguos (`137.84-=138.84,=138.84-143.60`): no se pierde ni un fotograma y cada mitad lleva su encuadre.
- **Corte en J al salir de una escena.** Si lo último de una escena se ve poco, déjala medio segundo sobre el arranque de la frase siguiente («Y lo mejor:») y vuelve a la cara cuando empieza lo importante. El corte queda tapado y la vuelta, más limpia.
- **Sobre el pecho, nada espera en forma de caja grande vacía.** Dos tarjetas oscuras y vacías delante de la persona durante un segundo se ven como un error. En el plano de cara, lo que aún no se ha dicho o no está todavía o se ve entero y apagado (con su texto en gris). Los huecos pequeños de línea discontinua, donde va a saltar un logo, sí funcionan.

## 8. Sonido

- **Un sonido discreto por cada cosa que entra,** en el mismo instante. Los pone `edl`.
- **Golpes graves, de 4 a 6 en todo el reel:** el gancho, el nombre, la cifra clave. Si hay más, dejan de notarse (`edl` avisa de dos a menos de 1 s).
- **Añade a mano solo los acentos de sentido:** un `bip` en un «ojo», por ejemplo.
- `reel.py sonido` compara cada efecto con la voz. Ninguno debe salir marcado como fuerte.

## 9. Revisión antes de entregar

1. **`reel.py revisar <reel> auto --zonas`** y mira todas las hojas:
   - la cara nunca tapada, y hueco entre la barbilla y la pieza también en los planos cercanos;
   - nada que haya que leer bajo las zonas rojas (interfaz de Instagram, botones);
   - todo legible a tamaño de móvil, sin textos cortados ni encimados;
   - cada fotograma coincide con lo que se dice en ese instante.
2. **`reel.py sonido <reel>`.**
3. **Render** y `reel.py tira` en un par de transiciones: sin fotogramas en blanco ni saltos.
4. **Revisión independiente:** lanza un subagente con el vídeo, los tiempos de las palabras, los datos verificados y las reglas del usuario, y pídele que busque errores (datos, ortografía, sincronía, cara tapada, zonas de Instagram, tiempo de lectura, parpadeos). Quien ha hecho el reel ya no ve sus fallos. Su informe es una opinión: comprueba cada punto antes de cambiar nada.
5. **Si el usuario pasó reels de referencia:** compara pieza por pieza con sus fotogramas (ver `referencias.md`). Misma estructura + mismos rótulos + misma composición = copia, aunque cambien los colores.
6. **Entrega:** el vídeo, la portada, qué se ha quitado, qué datos salen y de dónde, y cualquier duda sobre lo que dice (un nombre mal pronunciado, un dato que no cuadra con la fuente).

## 10. Errores que ya se han cometido

- **Copiar una referencia sin darse cuenta.** Con la misma noticia y los mismos datos que un reel de referencia, salieron cuatro piezas con su misma estructura y sus mismos rótulos. El diseño sale de la marca del usuario; de las referencias, solo el oficio.
- **Una pieza que mentía un segundo:** «DISPONIBLE» en pantalla esperando al «AÚN NO».
- **Un orden inventado:** dos opciones dibujadas una detrás de otra, con «PRIMERO», cuando la fuente no daba ningún orden.
- **Candados en lo que sí estaba permitido,** porque esperaban su turno bajo «¿quién puede usarlo?».
- **Un precio mal por fiarse de una sola fuente,** que confundía dos modelos.
- **Letra pequeña que nadie lee** (fuentes y unidades a 20 px) y texto bajo los botones de Instagram.
- **Lo último de una lista, visto un tercio de segundo.**
- **Saltos de un fotograma:** un golpe que crecía un 10 % de golpe y rebotaba, y encendidos demasiado secos para 25 fotogramas por segundo. Ahora `pulso` y `enciende` suben en dos fotogramas y no rebotan.
- **Un subtítulo que se quedaba un fotograma sobre el plano siguiente,** y una ventana que entraba inclinada (todo recto).
- **Una etiqueta que iba por delante de la voz:** «ME GUSTA» encendido en «dale», y la pregunta escrita antes de decirse.
- **Pausas entre frases.** El primer reel hecho entero con la skill salió «espectacular, pero necesito que entre frases haya menos pausa de silencio»: los cortes seguían la cola de cada frase hasta el suelo de ruido y, encima, se había dejado un respiro de tres décimas tras el gancho. Ahora `cortar` aprieta por defecto y los respiros no se añaden.
- **Un titular de escena que repetía el subtítulo y se adelantaba a la voz:** «EN MENOS DE 2 SEMANAS» encima del subtítulo «…en menos de dos semanas», un segundo antes de decirlo. El titular es la pregunta o el marco («EL RESULTADO», «¿DÓNDE FUNCIONA?»), no la frase. Lo mismo con una pastilla que dice lo que el subtítulo en ese instante («AHORA MISMO»): que añada algo («POR AHORA») o que no esté.
- **El subtítulo destripaba la lista:** la página «INSTAGRAM / FACEBOOK CORREO» enseñaba dos nombres antes de que se encendieran sus casillas. En una enumeración, cada elemento va en su página (`partir_antes`).
- **Un subtítulo grande con lo que no se quería agrandar** («Y ES TOTALMENTE» antes de «GRATIS», cuando hay planes de pago). Lo que se decide no destacar tampoco va en `grande`.
- **Un capítulo largo que rozaba el pelo** en los planos cercanos («04 CÓMO USARLO»). Títulos de capítulo cortos: 8–9 letras.
- **Cortes entre planos de cara que se leían como salto:** de 1,03 a 1,07 no se nota, y además la persona se mueve entre tomas. Alterna 1,0–1,03 con 1,10–1,13.
- **Un pulso que parecía un destello** (un país que pasaba a casi blanco ocho fotogramas). Un acento es un latido suave de tamaño, nunca un cambio brusco de color.
- **Tirones en el movimiento:** la cámara grababa «a 60» una imagen de 25 fotogramas por segundo y el reel se montó a 30. Ahora `cortar` mide los fotogramas reales.
- **El reel empezaba con un parpadeo** (`cortar --congelar-inicio`).
- **La pieza rozando la barbilla** en los planos cercanos: el zoom con pieza se ancla en la barbilla.
