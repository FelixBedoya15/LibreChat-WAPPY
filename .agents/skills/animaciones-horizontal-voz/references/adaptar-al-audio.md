# Adaptar la animación al audio

La animación no se elige de un catálogo: se deduce del audio. Esta guía es el método para hacerlo y la forma de que
cada vídeo salga distinto sin perder calidad ni identidad.

## Contenido

1. Escuchar antes de dibujar
2. Qué dice → qué se dibuja
3. Cómo está contado → cómo se organiza
4. Cómo suena → cuándo cambia y dónde golpea
5. Con qué tono → cómo se mueve
6. El concepto visual
7. Variedad sin perder identidad
8. Casos resueltos: la intro y los escenarios
9. Preguntas de control antes de programar

## 1. Escuchar antes de dibujar

Antes de pensar en piezas:
1. Lee el guion corregido de principio a fin, dos veces.
2. Abre `trabajo/escucha.md` y mira `trabajo/escucha.png` (ritmo, pausas, énfasis, energía).
3. Escribe tres líneas: **qué tiene que quedar** (la idea con la que el espectador se va), **cuál es el giro**
   (el momento en que algo cambia: «pero…», «la realidad es que…»), **cuál es el tono** (confesión, análisis,
   entusiasmo, ironía, tutorial).
4. Subraya en el guion: protagonistas, cifras, relaciones («frente a», «igual que», «mejor que», «conecta con»),
   enumeraciones, frases hechas y metáforas, y las palabras de estructura («primero», «además», «por lo que», «en resumen»).

Con eso ya sabes más de la animación que con cualquier plantilla.

## 2. Qué dice → qué se dibuja

| En el audio | Se convierte en |
|---|---|
| Protagonistas (modelos, herramientas, empresas) | una pieza con logo y nombre grande que viaja por todo el vídeo; su color es el de su marca |
| Relación entre dos cosas | la composición: enfrentadas («frente a»), en escalones («mejor que», «un nivel por debajo»), unidas por «=» («equivalente a»), una dentro de otra («incluido en»), unidas por cables («se conecta con»), en fila temporal («después», «antes») |
| Cifras | magnitudes que se ven con los valores reales: barras, medidores, cuadrículas, líneas de referencia; nunca un número suelto sin escala |
| Enumeraciones | estructura que se completa al ritmo de la voz: huecos que se rellenan al nombrarlos, lista que crece, rejilla que se enciende |
| Opiniones, sentimientos, cambios de idea | algo que los encarne: un bocadillo con la cita, una balanza, un sello, una pieza que pierde o gana color |
| **Frases hechas y metáforas del propio audio** | literalízalas cuando aclaran: son lo más propio de cada locución y lo que hace que la animación no se parezca a ninguna otra |

Frases hechas que ya se han dibujado bien (y la idea para otras):

| La voz dice | Se dibujó / se puede dibujar |
|---|---|
| «me tengo que comer mis palabras» | su cita antigua en un bocadillo que se tacha y se arruga |
| «no hay color» | el perdedor pierde el color (escala de grises) |
| «pega un salto importante» | la tarjeta salta hacia arriba con líneas de velocidad |
| «es tan bestia» / «juega en otra liga» | la pieza se carga de luz, tiembla y sube de nivel |
| «el mejor de…» | un hueco con corona donde aterriza el protagonista |
| «a años luz», «cuello de botella», «de la mano», «sobre la mesa», «punto de partida» | inventa el dibujo con el mismo lenguaje (tarjetas, líneas, luz): distancia que se estira, embudo que se estrecha, dos piezas unidas, cartas boca arriba, línea de salida |

Lo que la voz no dice no se dibuja como si lo dijera (ni cifras, ni nombres, ni resultados); si hace falta un apoyo
que no está en el audio, que sea neutro y verdadero.

## 3. Cómo está contado → cómo se organiza

- **Gancho** (primeros 2–3 s de voz): lo más potente de la primera frase ya en pantalla en el primer segundo de voz.
  Si la voz empieza hablando de algo concreto, dibújalo directamente; el titular solo si anuncia un tema o sección.
- **Giros** («pero», «sin embargo», «la realidad es que», «en cambio», «por lo que»): cambio de estado visible,
  mejor transformando lo que ya está (se tacha, se apaga, se enciende, cambia de sitio) que borrando y empezando.
- **Enumeraciones**: una estructura que se repite con variación y que se completa con la última palabra de la lista.
  Si la voz anuncia un número («5 escenarios»), enséñalo antes de llenarlo.
- **Clímax o revelación**: la pieza más grande, el acento más fuerte y, si toca, la cámara. Solo uno o dos por vídeo.
- **Llamadas atrás**: si la voz retoma algo anterior, lo anterior vuelve a la pantalla.
- **Cierre**: recapitulación visual (la composición principal con lo aprendido encima) o la llamada final («desde ya»),
  y aguanta hasta que acaba el audio.

## 4. Cómo suena → cuándo cambia y dónde golpea

`anim.py escuchar` te da la partitura:

| Lo que mide | Úsalo para |
|---|---|
| Pausas largas (≥ 0,45 s) | cambios de escena grandes y transiciones |
| Pausas cortas (0,25–0,45 s) | pasos dentro de una escena (entra la segunda pieza, se tacha algo) |
| Voz continua, sin pausas | encadenar por transformación, sin cortes |
| Palabras que destacan en la voz | acentos (anillo, golpe de escala, destello, golpe de cámara) **si además importan por significado**; si solo suenan fuerte, un acento ligero |
| Arranques tras pausa | entrada de la escena nueva, con fuerza |
| Ritmo rápido (> 6,6 síl/s) | entradas cortas (0,3–0,4 s), pocas piezas, cambios en bloque |
| Ritmo medio | entradas de 0,4–0,6 s, una idea cada 3–5 s |
| Ritmo pausado (< 5,2 síl/s) | construir por capas, más detalle, cámara lenta |
| Energía alta en una frase | ahí va el clímax visual |
| Energía baja | tono confesional o de transición: menos movimiento, más espacio |

Sin audio (tiempos estimados) solo son fiables el inicio de cada frase y las pausas entre frases: pon ahí lo principal.

## 5. Con qué tono → cómo se mueve

| Tono | Curvas | Rebote | Cámara | Luz y color | Recursos que encajan |
|---|---|---|---|---|---|
| Confesión, primera persona («me tengo que comer…») | suaves (`io3`) | casi nada | quieta y cercana | lo del pasado en gris | bocadillo, cita tachada, antes/después |
| Análisis, comparativa | limpias (`out4`, `io4`) | no | derivas lentas 1,00–1,03 | un color por protagonista | enfrentamientos, «=», escalones, barras reales |
| Entusiasmo, épica («brutal», «tan bestia») | `out4` + `back` | sí | golpes 1,02–1,04 en 2–4 palabras | halos que crecen, dorado para lo mejor | anillos, temblor corto, salto, revelación |
| Ironía, humor | literalizar | con intención | sorpresa | contraste | pierde el color, se encoge, sale de escena |
| Tutorial, paso a paso | lineales, pausadas | no | sigue al foco | neutro | nodos y cables, cursor, checks, pasos numerados |

Un mismo vídeo puede cambiar de tono (la intro pasa de confesión a épica en «la realidad es que»): el cambio de
movimiento también cuenta la historia.

## 6. El concepto visual

- Busca la frase que resume el audio o la imagen que ya usa la voz, y dibújala: eso es el concepto. Ejemplos: la
  balanza de «la comparación justa», los huecos de «5 escenarios», el bocadillo y el salto de «me tengo que comer
  mis palabras… pega un salto importante».
- Una idea central y piezas que la sirven. La idea central aparece pronto, evoluciona con la voz y cierra el vídeo.
- Si el concepto cabe en otro vídeo tal cual, todavía no es de este audio: acércalo a sus frases.
- Prueba mental: sin sonido, ¿se entiende de qué va y cuál es el giro?

## 7. Variedad sin perder identidad

Siempre igual (la identidad del canal y el listón): fondo oscuro, Outfit + JetBrains Mono, protagonistas con logo y
nombre grande, legibilidad, sincronía exacta, datos verificados.

Cambia de un vídeo a otro, según pida el audio:
- **Apertura**: la cosa misma, un titular, una pregunta, una cita, un número grande, un detalle que se aleja…
- **Recurso central**: enfrentamiento, balanza, escalera, línea temporal, flujo, rejilla, mapa, contenedor, cita…
- **Composición**: centrada, asimétrica (dos tercios), rejilla, fila, diagonal, profundidad (lo lejano pequeño y tenue).
- **Transiciones**: transformación de piezas, barrido, zoom a un detalle que se convierte en la escena siguiente,
  giro de carta, la pieza sale por un lado y entra la nueva por el otro.
- **Cámara, escala tipográfica, acentos de color, fondo** (rejilla de puntos, sin rejilla, halos que siguen a los
  protagonistas, líneas).

Con `registro.md`: mira las tres últimas filas y cambia al menos la apertura y el recurso central (y un tercer eje)
salvo que sea la misma serie. En una serie, mantén colores y tarjetas de los protagonistas para que se reconozca, y
cambia los recursos (la intro y los escenarios comparten tarjetas, pero no su recurso central).

## 8. Casos resueltos: la intro y los escenarios

**Intro sin audio** (41 s, solo transcripción con marcas; `ejemplos/astra-vs-opus-intro.html`). Tres líneas: queda
que Opus 5.5 esta vez sí sorprende y por eso se enfrenta al mejor de OpenAI en 5 escenarios reales; giro en «la
realidad es que»; tono de confesión que pasa a épica.

| La voz | Decisión | Por qué |
|---|---|---|
| «He estado probando… Opus 5.5» | chip «probando durante estos días» palabra a palabra y la tarjeta de Opus grande | gancho: el protagonista desde el primer segundo |
| «…me tengo que comer mis palabras» | la tarjeta se aparta; aparece un bocadillo con «…» | anuncia la frase hecha que se va a literalizar |
| «En vídeos anteriores decía que Opus no me parecía para tanto» | bocadillo gris «vídeos anteriores» con «Opus no es para tanto»; la tarjeta pierde el color | opinión pasada = cita; el pasado, en gris |
| «La realidad es que esta vez sí…» | la cita se tacha en rojo, se arruga y cae; la tarjeta recupera el color | giro del relato + «comerse las palabras» literal |
| «…pega un salto importante» | salto hacia arriba con líneas de velocidad, flechas y anillos | frase hecha literal; cambio a tono épico |
| «…enfrentarlo contra el mejor modelo de OpenAI, GPT-6 Astra» | VS con golpe; hueco con el logo de OpenAI y corona «el mejor de OpenAI»; aterriza Astra | «el mejor» = corona; el rival llena un hueco que ya esperaba |
| «En 5 escenarios completamente diferentes» | el duelo sube a cabecera; «5» y cinco huecos | enumeración anunciada: primero el número |
| «Edición de vídeo, creación de animaciones…» | cada hueco se rellena al nombrarlo | la lista se completa al ritmo de la voz |
| «No se trata de una simple comparación» | chip «una simple comparación» que se tacha | negación = tachado |
| «…casos de uso reales que puedes aplicar desde ya» | marca verde de «real» en cadena por las 5 tarjetas; «aplícalo desde ya» | cierre con la promesa |

**Escenarios** (20 s, con audio; `ejemplos/astra-vs-opus-2.html`): «Para comparar» → los contendientes arriba;
«5 escenarios» → «5» con golpe; «diferentes» → cinco huecos; cada nombre rellena su hueco con su logo (Instagram,
YouTube) o su icono; «veremos qué tal se porta» → el último hueco pasa a carta «?» y gira en «videojuegos»; el
silencio final se usa para una onda de luz que enciende los duelos. Mismas tarjetas que la intro (serie), otro
recurso central.

## 9. Preguntas de control antes de programar

- ¿Tengo escritas las tres líneas (qué queda, giro, tono) y el concepto sale de una frase de este audio?
- ¿Cada fila de la partitura dice qué del audio la pide?
- ¿Los cambios de escena caen en pausas y los golpes en palabras que destacan y además importan?
- ¿El movimiento cambia cuando cambia el tono?
- ¿Se entendería sin sonido?
- ¿Algo podría estar tal cual en otro vídeo? Si sí, acércalo más a este audio.
- ¿La apertura y el recurso central son distintos de las últimas filas de `registro.md` (o es la misma serie)?
