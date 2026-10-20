# Diseño: cómo tiene que verse y cómo se cuenta

Las animaciones se intercalan con su cara: cuando entra una, ocupa toda la pantalla mientras su voz sigue. El
espectador **oye** la explicación: la animación no la repite en texto, la hace **visible** (qué es el producto, con
qué se compara, con qué se conecta, cuánto cuesta, dónde está disponible). Lo que más valora Josema: limpia, clara,
los conceptos bien entendidos, los **nombres** de cada herramienta bien visibles, logos oficiales y **sincronía
exacta** con la voz. Y que el conjunto se sienta como una intro de YouTube natural: la cara y la animación se turnan
sin que se note el montaje.

## Contenido

1. Estética base
2. Color
3. Legibilidad
4. Ritmo y sincronía
5. Catálogo de recursos: qué dice la voz → qué se ve
6. Cámara
7. Qué evitar
8. Lista de revisión

## 1. Estética base (la de Muse, Hermes y Astra vs Opus)

- Fondo casi negro `#0a0c10` con rejilla de puntos tenue, halos de color muy difuminados, viñeta y 4 % de ruido.
- Tipografía: **Outfit** (titulares 800, nombres de producto o modelo 84 px) y **JetBrains Mono** (etiquetas, chips,
  cifras de apoyo).
- Tarjetas oscuras con borde fino; al protagonista se le "enciende" el borde y un brillo en su color. Una app nueva
  se presenta como su icono (ficha blanca redondeada) con el logo que se escribe a mano.
- Chips en forma de píldora con icono de línea (Lucide) para el tema de cada momento; iconos de escritorio y de uso
  real (ventanas, cursores, relojes, candados, nubes, portátiles). Para «IA» o «agente», el logo o la ficha del producto.
- Líneas discontinuas para relaciones («=», «≈», «VS», flujos, conexiones) con rayas que avanzan despacio.
- Movimiento con curvas suaves: entradas `out4` de 0,4–0,6 s, salidas `in3` de 0,3–0,4 s con algo de desenfoque.
- La pista es solo su voz: sin música ni efectos (él mezcla el audio en su edición).

## 2. Color

- Base neutra y **un color por protagonista**, el mismo durante todo el vídeo, en tarjeta, halo, barra y detalles.
  En Muse, `.lado-n` = azul del icono de Muse `#2F86FF`; lo descartado, en gris.
- En comparativas: bando A a la izquierda, bando B a la derecha (`.lado-a`, `.lado-b`).
- **Dos modelos de la misma marca** llevan el mismo logo, así que los separa el color: el que más importa en el
  argumento, con el color de la marca; el otro, con un tono frío neutro (`#7C9CFF`), y el nombre siempre grande.
- Usa el color de marca (ver `datos-y-logos.md`). Si las dos marcas son parecidas o monocromas (OpenAI y Vercel son
  blanco/negro), da a una un color frío neutro (azul `#7C9CFF`) y a la otra su color.
- Colores con significado, solo cuando hacen falta: dorado `#E9C46A` = "lo mejor / tope de gama";
  verde = sí/incluido/gratis/correcto; rojo = no/error. Gris (escala de grises) = descartado, "sin color".
- El azul del canal (`#3e6ef2`) para piezas neutras cuando el protagonista no tiene color propio.

## 3. Legibilidad (se ve mucho en el móvil)

- Nombres de herramientas/modelos: **≥ 60 px** en pantalla a 1080p (84 px en la tarjeta a tamaño 1).
- Textos que hay que leer (chips, etiquetas de barras, notas): ≥ 28 px. Etiquetas mono pequeñas (19 px) solo
  para información secundaria (la empresa en la tarjeta).
- Si una tarjeta se escala a 0,6, su texto también: comprueba que el nombre sigue siendo legible. En las ventanas
  cortas (2–3 s) las tarjetas van grandes (escala ≥ 0,88): da tiempo a leer solo lo grande.
- Como mucho 3 focos de atención a la vez; márgenes de ~100 px a los bordes.
- Revisa 2–3 fotogramas **a tamaño real** (las hojas de contactos engañan: todo parece pequeño).

## 4. Ritmo y sincronía

- **Una idea visual por frase** de la voz; cada elemento entra 0,02–0,05 s antes de la palabra que lo motiva.
  Un visual que llega tarde se nota muchísimo más que uno que llega un pelo antes.
- **El primer fotograma de cada ventana ya tiene contenido** (la entrada empieza 0,1–0,45 s antes del corte): un fondo
  vacío justo después de su cara parece un fallo.
- **Nunca un hueco vacío** entre dos ideas: lo siguiente entra mientras sale lo anterior (la ficha de Muse entra
  justo cuando salen las tarjetas descartadas; «de momento» llena la columna mientras llega «gratis»).
- Nombres compuestos: la tarjeta/familia entra con la primera palabra («Claude») y el nombre grande con la
  segunda («Code»); la versión, con el número.
- Acentos en las palabras fuertes: anillo que se expande, golpe de escala en la pieza, cifra que entra con golpe.
- Nada completamente quieto más de ~2 s: halos que respiran, rayas que fluyen, deriva lenta de cámara.
- Transiciones por transformación: la misma tarjeta viaja de una idea a otra (se reduce, cambia de sitio) en lugar
  de desaparecer y volver a aparecer. Da continuidad y el espectador no pierde quién es quién.
- Listas y pasos: cada entrada ≥ 0,5 s después de la anterior y la lista completa ≥ 2 s en pantalla antes de salir.
  Lo que se mueve con la voz, suavizado: nada cambia de golpe de un fotograma al siguiente.
- Lo que la voz niega no desaparece: se apaga (gris) y se tacha, y así se entiende el «no es esto, es esto otro».

## 5. Catálogo de recursos: qué dice la voz → qué se ve

| La voz… | Recurso | Dónde está resuelto |
|---|---|---|
| presenta un producto o una app nueva («Meta acaba de lanzar Muse») | icono de la app (ficha blanca redondeada) cuyo logo se escribe a mano + nombre letra a letra + logo de la empresa encima | muse-intro `museFicha`, `museDibujo` (`anim.py logo-trazo`) |
| «es gratis», «incluido», «sin coste» | píldora verde «GRATIS» con check que entra con golpe (nunca «100 %» si hay planes de pago) | muse-intro `gratis` |
| se conecta con apps/herramientas («conectarse a tu WhatsApp, Instagram o correo») | huecos «+» con cables en árbol que se rellenan con los logos al nombrarlos; un paquete sube hasta el producto, que late | muse-intro `HUB`, `APPS`, `wRamas`; hermes `scene3` |
| dónde está disponible («solo en EE. UU.», «en todo el mundo», «desde cualquier país») | mapa del mundo en puntos: el país se enciende con un alfiler; para «en todas partes», la luz se extiende en onda | muse-intro `pintarMapa` (`anim.py mapa`) |
| casos de uso, «vamos a ver varias cosas que puede hacer» | fila de tarjetas numeradas que se rellenan al nombrarlas, cada una con una mini ilustración viva (app que se monta, diana con flecha, apps conectadas, imagen que se genera) | muse-intro `CASOS`, `caso*` |
| «es como X o Y» (familia de productos) | tarjetas en fila con «≈» entre ellas; el protagonista en el centro | muse-explicacion `escenaTrio` |
| «no se trata de X, Y o Z; más bien…» | las tarjetas de X, Y, Z entran al nombrarlas, pierden el color y se tacha su rótulo; entra el protagonista justo cuando salen (sin hueco vacío) | muse-explicacion `escenaNoes` |
| límites, uso, consumo («solo me ha gastado un 3 %») | medidor con pista y días de la semana; se llena lo que dice y la cifra grande entra con golpe | muse-explicacion `medidor()`, `escenaUso` |
| «su punto clave es…», un ecosistema | rótulo «PUNTO CLAVE» + las apps de la marca en arco bajo el producto, con cables y paquetes; logo de la empresa | muse-explicacion `escenaEco`, `APPS_META` |
| «a base de clic», «conectas tu cuenta» | panel de la app con filas y botón «Conectar»; el cursor viaja, pulsa y el botón pasa por «cargando» a «Conectado» | muse-explicacion `panel`, `CURK` |
| «vive en la nube», «no tienes que instalar nada» | nube que se dibuja con una máquina «en línea» dentro; portátil con descarga tachado | muse-explicacion `nube`, `vm`, `tachon` |
| «casi al nivel de los mejores» (sin una cifra fiable que dar) | barras sin números: el protagonista se queda un poco por debajo de la línea de «los más potentes», con la etiqueta «casi» | muse-explicacion `escenaModelos` |
| anuncia un tema o una sección («lo primero, las reglas…», «5 escenarios») | eyebrow mono + titular letra a letra con la palabra clave en degradado | plantilla (`escenaTitulo`), astra `scene1` |
| describe algo concreto desde el principio («hoy montamos un agente que…») | nada de titular: dibuja la cosa (nodos, flujo) desde el primer segundo | plantilla (`nodo`, `Wire`) |
| enumera partes o pruebas («5 escenarios: reels, animaciones, webs…») | fila de huecos numerados que se rellenan al nombrarlos (logo o icono + nombre); el último puede ser una carta «?» | astra-vs-opus-2 `escenarios` |
| compara dos cosas («X frente a Y») | dos tarjetas enfrentadas + «VS» | plantilla (`escenaVersus`) |
| habla de justicia/equilibrio/quién pesa más | balanza entre las tarjetas: equilibrada, se vence, vuelve al equilibrio | astra `balanza`, `beamAngle` |
| descarta algo («no hay color», «no vale», «olvídate de») | el descartado se encoge, pasa a gris y sale; el chip se tacha | astra `SOK` (g, br), `strike` del chip |
| crea expectación («algo aún más interesante», «¿y sabes qué?») | carta «?» con borde que avanza; zoom lento hacia ella; gira y revela | astra `QK`/`AK` |
| gamas/equivalencias («el tope de», «equivalente a») | escalera: franjas por nivel con etiqueta, columnas por empresa, «=» entre equivalentes | astra `ladder` |
| sube de categoría («juega en otra liga») | la tarjeta se ilumina, anillos, temblor corto, sube a la fila de arriba; «=» pasa a «VS» | astra `OPK`, `bTop` |
| precios, porcentajes, benchmarks, tiempos | barras con los **valores reales** dentro, línea de referencia (½, media, récord) | plantilla (`escenaCoste`), astra `cost` |
| dónde se instala/ejecuta | nodo «instalar» y cables hacia tarjetas de dispositivo (portátil, servidor) | hermes `scene1` |
| lista de capacidades | tarjetas con icono que se dibuja y se encienden al nombrarlas | hermes `scene2` |
| se usa desde el móvil/chat | móvil que sube, mensaje que se escribe, «escribiendo…», respuesta | hermes `phone` |
| pasos de un proceso, automatizaciones | fila de nodos (`nodo()`) unidos por cables; un paquete o una pieza (`viajar()`) recorre el camino según avanza la voz | plantilla (`nodo`, `viajar`), ver `motor.md` |
| una cifra que tiene que quedarse | número grande que se escribe, con la unidad en mono al lado | `letters` o `slam` |
| una escena que ya salió y vuelve («sin tener que ser de allí») | la misma escena con un giro (la luz se extiende; el rótulo se tacha y cambia) | muse-intro `mapa2`; el mapa vuelve en muse-explicacion |

Si ninguno encaja, inventa uno con el mismo lenguaje (tarjetas, chips, líneas, halos) antes que meter
texto: la pregunta es «¿qué dibujo haría que esto se entienda sin leer?».

## 6. Cámara

- `camara(t)` añade sola un asentamiento 1,06 → 1 (0,55 s) al entrar en cada ventana: acompaña el corte desde la cara.
- Dentro de la ventana, zoom entre 1,00 y 1,07: acércate a lo que genera expectación o a la fila que importa y vuelve
  a 1,00 para las transiciones.
- Golpes cortos (1,02–1,03 en 0,15 s) solo en 2–4 palabras fuertes de todo el vídeo.
- Nunca muevas la cámara mientras el espectador tiene que leer un nombre que acaba de aparecer; si un rótulo tiene
  que leerse mientras la cámara se acerca a otra cosa, déjalo fijo en pantalla con `fijo()`.
- Planos de cara: el encuadre solo cambia con los cortes (plano completo 1,0 ↔ plano corto 1,22 en los saltos).

## 7. Qué evitar

- Subtítulos o frases largas en pantalla (la voz ya lo dice). Máximo 3–5 palabras por chip.
- Datos inventados o aproximados que no cuadran con la fuente (ver `datos-y-logos.md`).
- Emojis, sellos inclinados, destellos blancos a pantalla completa, efectos de «golpe» exagerados.
- Cifras intermedias visibles en contadores (un fotograma pausado parece un dato real).
- Logos que no se ven bien en fondo oscuro o de baja calidad (mejor el nombre solo que un logo pixelado).

## 8. Lista de revisión (antes del montaje final)

- [ ] Cada nombre de herramienta/modelo se lee bien y es el oficial (mayúsculas, guiones, versión).
- [ ] Cada logo es el correcto y se ve sobre el fondo.
- [ ] Cada elemento aparece con su palabra (ni antes de que se mencione ni tarde).
- [ ] El primer fotograma de cada ventana tiene contenido; no hay huecos vacíos dentro de una ventana.
- [ ] Ningún texto se corta ni se sale del cuadro, tampoco con el zoom de cámara.
- [ ] No hay elementos superpuestos por accidente (etiquetas que tocan tarjetas, pies con cabeceras).
- [ ] Cifras = fuente oficial; si la voz redondea, la pantalla no la contradice ni miente.
- [ ] Las transiciones se ven limpias en fotogramas intermedios (revisa 2–3 instantes dentro de cada una).
- [ ] Hoja de cortes (`anim.py planos --hoja`): la cara entera en el plano corto, cortes entre palabras, sin saltos raros.
- [ ] El último plano (normalmente su cara) aguanta hasta el final de la voz.
