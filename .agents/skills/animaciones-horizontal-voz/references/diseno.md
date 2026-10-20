# Diseño: cómo tiene que verse y cómo se cuenta

Estas animaciones acompañan la explicación del usuario en YouTube (en español). El espectador **oye** la
explicación: la animación no la repite en texto, la hace **visible** (quién es quién, qué se compara, qué cambia,
cuánto cuesta). Lo que más se valora: limpia, clara, los conceptos bien entendidos, los **nombres** de cada
herramienta o modelo bien visibles, logos reales y **sincronía exacta** con la voz.

Todo lo de esta guía son **guías**: fijan el listón (legibilidad, color con significado, ritmo) y recogen ideas que ya
funcionaron. Qué se dibuja y cómo se mueve lo decide cada audio (`references/adaptar-al-audio.md`); lo que aquí es
fijo es la identidad del canal y la calidad, no la composición ni los recursos.

## Contenido

1. Estética base
2. Color
3. Legibilidad
4. Ritmo y sincronía
5. Catálogo de recursos: qué dice la voz → qué se ve
6. Cámara
7. Criterios de limpieza
8. Lista de revisión

## 1. Estética base (la identidad del canal)

- Fondo casi negro `#0a0c10` con halos de color muy difuminados que siguen a los protagonistas, viñeta y 4 % de ruido;
  la rejilla de puntos tenue es la opción por defecto, pero el fondo puede cambiar con el vídeo (sin rejilla, líneas,
  luz que acompaña el tono), siempre oscuro y sin competir con las piezas.
- Tipografía: **Outfit** (titulares 800, nombres de modelo 84 px) y **JetBrains Mono** (etiquetas, chips, cifras de apoyo).
- Tarjetas oscuras con borde fino; al protagonista se le "enciende" el borde y un brillo en su color.
- Chips en forma de píldora con icono de línea (Lucide) para el tema de cada momento.
- Líneas discontinuas para relaciones ("=", "VS", flujos) con rayas que avanzan despacio.
- Movimiento con curvas suaves: entradas `out4` de 0,4–0,6 s, salidas `in3` de 0,3–0,4 s con algo de desenfoque.

## 2. Color

- Base neutra y **un color por protagonista**, el mismo durante todo el vídeo, en tarjeta, halo, barra y detalles.
  En comparativas: bando A a la izquierda, bando B a la derecha (`.lado-a`, `.lado-b`).
- **Dos modelos de la misma marca** (Sonnet 5 frente a Opus 5.5): llevan el mismo logo, así que los separa el color.
  El que más importa en el argumento, con el color de la marca; el otro, con un tono frío neutro (`#7C9CFF`), y el
  nombre del modelo siempre grande.
- Usa el color de marca (ver `datos-y-logos.md`). Si las dos marcas son parecidas o monocromas
  (OpenAI y Vercel son blanco/negro), da a una un color frío neutro (azul `#7C9CFF`) y a la otra su color.
- Colores con significado, solo cuando hacen falta: dorado `#E9C46A` = "lo mejor / tope de gama";
  verde = sí/incluido/correcto; rojo = no/error. Gris (escala de grises) = descartado, "sin color".
- El azul del canal (`.lado-n`, `#3e6ef2`) para piezas neutras o para un único protagonista.

## 3. Legibilidad (1080p que muchos ven en el móvil)

- Nombres de herramientas/modelos: **≥ 60 px** en pantalla (84 px en la tarjeta a tamaño 1).
- Textos que hay que leer (chips, etiquetas de barras, notas): ≥ 28 px. Etiquetas mono pequeñas (19 px) solo
  para información secundaria (el nombre de la empresa en la tarjeta).
- Si una tarjeta se escala a 0,6, su texto también: comprueba que el nombre sigue siendo legible.
- Como mucho 3 focos de atención a la vez; márgenes de ~100 px a los bordes.
- Revisa 2–3 fotogramas **a tamaño real** (las hojas de contactos engañan: todo parece pequeño).

## 4. Ritmo y sincronía

- **Una idea visual por frase** de la voz; cada elemento entra 0,02–0,05 s antes de la palabra que lo motiva.
  Un visual que llega tarde se nota muchísimo más que uno que llega un pelo antes.
- Nombres compuestos: la tarjeta/familia entra con la primera palabra ("GPT") y el nombre grande con la
  segunda ("Astra"); la versión, con el número ("5.5").
- Acentos en las palabras fuertes: anillo que se expande, destello, golpe de cámara corto, balanza que se vence.
- Nada completamente quieto más de ~2 s: halos que respiran, rayas que fluyen, deriva lenta de cámara.
- Transiciones por transformación: la misma tarjeta viaja de una escena a otra (se reduce, cambia de sitio)
  en lugar de desaparecer y volver a aparecer. Da continuidad y el espectador no pierde quién es quién.
- Cuando la voz termina, la última composición se mantiene quieta (con vida ambiental) hasta el final del audio.

## 5. Ideas que ya funcionaron: qué dijo la voz → qué se vio

Inspiración, no receta: úsalas cuando el audio las pida de verdad, combínalas, transfórmalas o inventa otras con el
mismo lenguaje. Antes de repetir una, mira `registro.md`.

| La voz… | Recurso | Dónde está resuelto |
|---|---|---|
| anuncia un tema o una sección ("lo primero, las reglas…", "5 escenarios") | eyebrow mono + titular letra a letra con la palabra clave en degradado | plantilla (`escenaTitulo`), astra `scene1` |
| describe algo concreto desde el principio ("hoy montamos un agente que…") | nada de titular: dibuja la cosa (nodos, flujo) desde el primer segundo | plantilla (`nodo`, `Wire`) |
| enumera partes o pruebas ("5 escenarios: reels, animaciones, webs…") | fila de huecos numerados que se rellenan al nombrarlos (logo o icono + nombre); el último puede ser una carta "?" | astra-vs-opus-2 `escenarios` |
| compara dos cosas ("X frente a Y") | dos tarjetas enfrentadas + "VS" | plantilla (`escenaVersus`) |
| habla de justicia/equilibrio/quién pesa más ("comparación justa", "no hay color", "humillar") | balanza entre las tarjetas: equilibrada, se vence, vuelve al equilibrio | astra `balanza`, `beamAngle` |
| descarta algo ("no hay color", "no vale", "olvídate de") | el descartado se encoge, pasa a gris y sale; el chip se tacha | astra `SOK` (g, br), `strike` del chip |
| crea expectación ("algo aún más interesante", "¿y sabes qué?") | carta "?" con borde que avanza; zoom lento hacia ella; gira y revela | astra `QK`/`AK` |
| gamas/equivalencias ("el tope de", "equivalente a", "de la misma gama") | escalera: franjas por nivel con etiqueta, columnas por empresa, "=" entre equivalentes | astra `ladder` |
| sube de categoría ("es tan bestia que…", "juega en otra liga") | la tarjeta se ilumina, anillos, temblor corto, sube a la fila de arriba; "=" pasa a "VS" | astra `OPK`, `bTop` |
| precios, porcentajes, benchmarks, tiempos | barras con los **valores reales** dentro, línea de referencia (½, media, récord) | plantilla (`escenaCoste`), astra `cost` |
| dónde se instala/ejecuta | nodo "instalar" y cables hacia tarjetas de dispositivo (portátil, servidor) | hermes `scene1` |
| lista de capacidades | tarjetas con icono que se dibuja y se encienden al nombrarlas | hermes `scene2` |
| se conecta con apps/herramientas | huecos punteados que se rellenan con los logos al nombrarlos + cables con paquetes | hermes `scene3` |
| se usa desde el móvil/chat | móvil que sube, mensaje que se escribe, "escribiendo…", respuesta | hermes `phone` |
| pasos de un proceso, automatizaciones (n8n, Make, Zapier) | fila de nodos (`nodo()`) unidos por cables; un paquete o una pieza (`viajar()`) recorre el camino según avanza la voz; los huecos "+" se rellenan con la herramienta al nombrarla | plantilla (`nodo`, `viajar`), ver `motor.md` |
| una cifra que tiene que quedarse | número grande que se escribe, con la unidad en mono al lado | `letters` o `slam` |
| conclusión/resumen | vuelta a la composición principal (VS o titular) con el dato clave | — |
| recuerda una opinión suya anterior («decía que no era para tanto», «me tengo que comer mis palabras») | bocadillo gris con su cita antigua y la etiqueta de cuándo lo dijo; al llegar el giro se tacha, se arruga y cae | intro `bocadillo`, `recuerdo()` |
| algo mejora de golpe («pega un salto», «esta vez sí») | la pieza recupera el color y salta hacia arriba con líneas de velocidad, flechas y anillos | intro `salto()`, `OPK` |
| presenta al rival o al mejor de una categoría («el mejor modelo de…») | hueco punteado con el logo tenue y una corona dorada con la etiqueta; el protagonista aterriza en él | intro `rival()`, `hueco`, `corona` |
| «casos reales», «probado», «funciona» | marca verde de validación que recorre las tarjetas en cadena | intro `.scard .ok` |
| niega algo («no se trata de una simple…») | el chip con esa idea se escribe y se tacha | `ChipEscrito` con `tachar` |

Si ninguno encaja, inventa uno con el mismo lenguaje (tarjetas, chips, líneas, halos) antes que meter
texto: la pregunta es "¿qué dibujo haría que esto se entienda sin leer?".

## 6. Cámara

- Zoom entre 1,00 y 1,07; acércate a lo que genera expectación o a la fila que importa y vuelve a 1,00
  para las transiciones.
- Golpes cortos (1,02–1,03 en 0,15 s) solo en 2–4 palabras fuertes de todo el vídeo.
- Nunca muevas la cámara mientras el espectador tiene que leer un nombre que acaba de aparecer.

## 7. Criterios de limpieza

- Texto justo: nombres y chips de 3–5 palabras como mucho; la frase completa ya la dice la voz.
- Datos: los de la fuente oficial, tal cual (ver `datos-y-logos.md`).
- Acentos contenidos y del mismo lenguaje que el resto (anillo, brillo del borde, golpe de cámara de 1,02–1,03):
  el acento señala una palabra y la pantalla sigue limpia.
- Pista: la voz del usuario tal cual; la música y los efectos los mezcla él en su edición.
- Cifras: entran ya con su valor final (`letters`, `slam`), así cualquier fotograma pausado muestra un dato real.
- Logos nítidos y bien visibles sobre el fondo oscuro; si no hay uno de calidad, el nombre solo.

## 8. Lista de revisión (antes del render final)

- [ ] Cada nombre de herramienta/modelo se lee bien y es el oficial (mayúsculas, guiones, versión).
- [ ] Cada logo es el correcto y se ve sobre el fondo.
- [ ] Cada elemento aparece con su palabra (ni antes de que se mencione ni tarde).
- [ ] Ningún texto se corta ni se sale del cuadro, tampoco con el zoom de cámara.
- [ ] No hay elementos superpuestos por accidente (etiquetas que tocan tarjetas, pies con cabeceras).
- [ ] Cifras = fuente oficial; si la voz redondea, la pantalla no la contradice ni miente.
- [ ] Las transiciones se ven limpias en fotogramas intermedios (revisa 2–3 instantes dentro de cada una).
- [ ] El último plano aguanta hasta el final del audio.
