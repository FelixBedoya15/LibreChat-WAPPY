# Dirección de arte: cada vídeo, el suyo

Josema (30/09/2026): «la skill está muy lograda pero si la uso con otros vídeos hace exactamente lo mismo. Quiero que
se adapte muy bien a cada vídeo, que utilice las guías pero que NO sea siempre igual, que haya variedad y sobre todo
se adapte al vídeo, al audio y al caso concreto».

La regla de oro: **las guías dicen cómo hacerlo bien; lo que se ve sale de este vídeo.** La sincronía, la legibilidad,
los datos reales, el sonido y lo que Josema ya ha rechazado (`diseno.md` § 7) no cambian nunca. El concepto, el fondo,
la paleta, la tipografía, el acabado, las transiciones, las piezas, el ritmo y la música se deciden **para cada vídeo**
a partir de lo que dice, cómo lo dice y cómo es su plano. Los `ejemplos/` son el listón de calidad y un almacén de
piezas: nunca una plantilla que copiar (el reel de «editado por IA» repitió casi todas las piezas de la intro, y es
justo lo que no hay que hacer).

## Contenido

1. Leer el vídeo (`anim.py lectura`)
2. Proponer y escribir el concepto (`trabajo/concepto.md`)
3. El menú: qué cambia de un vídeo a otro
4. No repetirse (`anim.py historial`)
5. Cómo inventar la pieza firma
6. Lo que no cambia nunca

## 1. Leer el vídeo

Después de transcribir (y mejor aún, de alinear): `anim.py lectura` → `trabajo/lectura.md`. Mide y resume:

- **La voz**: palabras por minuto, pausas, dinámica (cuánto sube y baja la energía) y las palabras que remarca (más
  energía que las de alrededor). Un ritmo rápido y expresivo pide golpes secos y seguidos; uno pausado, movimientos
  largos y pocos elementos que respiran. Las palabras remarcadas son candidatas a los golpes visuales (no solo los
  nombres propios).
- **El guion**: cifras, nombres propios (protagonistas y logos), estructura (lista, contraste, comparación, datos,
  promesa, pregunta, novedad) y la frase más larga.
- **El plano** (si hay grabación): sus colores dominantes. La paleta puede casar con la sala (cálidos con la madera)
  o contrastar a propósito (un frío que la separe).
- **Pistas** de fondo por el tema y **el historial**: lo que llevaron los últimos vídeos.

Léelo entero y añade lo que la máquina no ve: el tono (épico, didáctico, íntimo, polémico, con humor), qué tiene que
quedar al final y los gestos a cámara que merece la pena acompañar.

## 2. El concepto

Antes del guion visual rellena `trabajo/concepto.md` (lo trae cada proyecto): idea central, lectura en tres líneas,
dirección de arte (fondo, acabado, tipografía, acento, movimiento, transiciones, subtítulos, música), pieza firma,
piezas de la biblioteca y qué no repites.

**La idea central es una metáfora que ordena todo el vídeo**, sacada de su tema, no un estilo genérico. Ejemplos del
tipo de salto que se busca:

| El vídeo va de… | Una idea central posible |
|---|---|
| un agente que automatiza el correo | una centralita: cada correo es una llamada que el agente enruta a su cable |
| comparar tres modelos | un podio o una carrera: cada dato mueve a los corredores |
| un lanzamiento de producto | la caja que se abre: todo sale de dentro, capa a capa |
| precios o límites de uso | un ticket o una factura que se imprime línea a línea |
| instalar algo paso a paso | un mapa de metro: cada paso es una parada |
| una opinión o una reflexión | una revista: titular editorial, citas, mucho aire |
| programación, terminal | una consola: todo entra tecleado, cursores, líneas de log |
| cómo se hizo este vídeo | un editor de vídeo que se monta solo (la de «editado por IA») |

**Proponlo en la tanda de preguntas** (`estilos.md` § 2): 2–3 conceptos distintos para ESTE vídeo, cada uno con su
fondo, acabado, tipografía y acento en la descripción; el que mejor encaja, primero y «(Recomendado)». Si Josema dice
«solo ejecuta», elige tú y cuéntalo al final.

## 3. El menú: qué cambia de un vídeo a otro

Elige una opción por ranura **por lo que pide el contenido**, no por costumbre. Todas conviven con las capas y con
el formato vertical.

**Fondo** (`ESTILO.fondo`, `anim.py nuevo/estilo --fondo`; tema profundidad):

| Fondo | Qué es | Pega con |
|---|---|---|
| `cortina` | hebras de luz con paralaje, polvo, barridos (opciones: `direccion` 0 / 90 / −20…20, `paleta`) | tecnología, noche, «editado por IA» (vertical); código (diagonal); datos que fluyen (horizontal) |
| `aurora` | cintas de color suaves que ondulan | producto nuevo, creatividad, diseño, algo que ilusiona |
| `malla` | líneas de relieve que se tapan unas a otras | datos, cifras, mercado, señal, sonido, análisis |
| `constelacion` | nodos que derivan y se unen con líneas y paquetes de luz | agentes, redes, automatizaciones, integraciones, comunidad |
| `liso` | degradado oscuro con halos de la paleta y grano | opinión, reflexión, historia personal, cuando manda la tipografía |
| `puntos` | rejilla de puntos y halos por bando (el tema oscuro de siempre) | comparativas limpias con dos protagonistas |
| `espacio` | estrellas y suelo de rejilla | **no**: recuerda al vídeo de referencia; solo si Josema lo pide |

Todos aceptan `{ ondas: [t…] }` (se encienden en los golpes; pon 3–4 en los momentos fuertes de ESTE vídeo) y
`FONDOK` (`vel` 26 calma → 90–150 viaje; `brillo`). Si ninguno encaja con la idea central, **haz uno nuevo** con
la misma interfaz (`FondoBase` en `motor/capas.js`): un fondo propio es la forma más rápida de que el vídeo sea otro.

**Acabado de los paneles** (`ESTILO.acabado`): `cristal` (translúcido, redondeado, el de la v3), `solido` (bloque
opaco con barra del acento arriba, esquinas de 10 px: directo, editorial, datos), `contorno` (línea fina del acento
sobre transparente, esquinas casi rectas: técnico, plano, consola). Todas las piezas lo toman solas.

**Tipografía de titulares** (`ESTILO.tipo`): `outfit` (redonda, amable, la de siempre), `grotesk` (Space Grotesk,
técnica y precisa; también el texto), `editorial` (Instrument Serif en titulares: premium, reflexivo, revista).

**Acento y paleta**: el color de la marca protagonista si la hay (Claude coral, n8n rosa, Gemini violeta,
WhatsApp verde… `datos-y-logos.md`), o el del tono del vídeo; `paletaDe(rgb)` saca cuatro tonos para fondos y
detalles. El azul del canal `#3E6EF2` no es obligatorio: úsalo cuando no haya un color con más sentido y no dos
vídeos seguidos.

**Movimiento**: seco y rápido (entradas de 0,25–0,35 s con `out4`, cortes en la palabra), fluido y elástico
(`back`, `spring`, piezas que viajan de escena en escena), o pausado y editorial (fundidos de 0,6–0,9 s, poca cámara).
Que salga del ritmo de la voz de la lectura.

**Transiciones** (elige una o dos familias y mantenlas todo el vídeo): corte seco en la palabra, `cuchilla`, `iris`
(desde su cara), la grabación que se encoge a ficha y vuelve, fundido del fondo (la sala se va). Una transición nueva
que cuente algo (la grabación que entra en una ventana, en un móvil, en una casilla) vale más que las de siempre.

**Listas y pasos**: ruta vertical (`RutaPasos`), rejilla de tarjetas (`tarjetaFuente`), fila de huecos numerados que
se rellenan (astra-vs-opus-2), checklist (`PanelTareas`), carrusel horizontal, mapa de metro, ticket que se imprime…
El que mejor dibuje la estructura de ESTE contenido; siempre con tiempo para leer (`diseno.md` § 7).

**Revelados**: haces de luz (`RevelarHaces`), logo que se escribe a trazo (`anim.py logo-trazo`), esfera de puntos
que forma el logo (`EsferaPuntos`), nombre gigante letra a letra, carta que gira (astra), caja que se abre, cortina que
se descorre. Cambia de revelado entre vídeos.

**Subtítulos**: palabra a palabra con la que suena en el acento, por frases, arriba o abajo, o ninguno (si ya hay
mucho texto en pantalla o la voz va en off).

**Música**: por el tono (`sonido.md` § 4). En intros, épica que pegue, con un golpe del tema en el momento clave
(`anim.py golpe`) y un `desde` distinto al del último vídeo; si el tema de siempre ya se ha usado dos veces seguidas,
busca otro en Mixkit con licencia «Free License» y añádelo a `musica/musica.json`.

**Densidad y ritmo**: de la lectura (`estilos.md` § 5), no fija. Varía la duración de los planos: una intro no son
bloques iguales de 3 s.

## 4. No repetirse

`anim.py historial` enseña los últimos vídeos con su fondo, acabado, tipografía, acento, música, transición y piezas
(`~/.animaciones/historial.json`, con los vídeos anteriores ya apuntados). Reglas:

- Respecto al último vídeo, cambia **al menos 3** de {fondo, acabado, tipo, acento, música, transición principal}.
- No reutilices **más de la mitad** de sus piezas, y nunca en el mismo orden.
- Inventa **al menos una pieza firma** (§ 5).
- Antes de renderizar: `anim.py historial --comprobar` (avisa si se parece demasiado). Al entregar:
  `anim.py historial --anotar --titulo "…"`.

Excepción: si Josema pide «como la de X», parte de X a propósito y cambia solo lo que él no ha nombrado; apúntalo igual.

## 5. Cómo inventar la pieza firma

Una pieza que solo tiene sentido en este vídeo: sale de la idea central o de una frase concreta. La «m» de Muse que se
escribe a mano, la ventana del explorador donde se suelta la grabación, el bocadillo que se arruga («me tengo que comer
mis palabras»)… Pregúntate: ¿qué objeto del mundo real explica esta frase sin leer? Constrúyela con el lenguaje del
motor (`panel`, `put`, `KF`, CSS con `var(--panel-bg)`, `var(--display)`, el acento) para que tome el acabado y la
tipografía del vídeo. Si sale muy bien, pásala a `motor/piezas.js` y documéntala (`motor.md` § 10).

## 6. Lo que no cambia nunca

Sincronía exacta con la voz (`sincronia.md`), una idea por frase, nombres y logos reales y legibles, datos
verificados, nada quieto más de ~2 s, nada sobre su cara, nada que parpadee, nada de zooms cortos sobre su grabación,
listas con tiempo para leer, sonido en cada golpe y mezcla a −14 LUFS, y todo lo de `diseno.md` § 7.
