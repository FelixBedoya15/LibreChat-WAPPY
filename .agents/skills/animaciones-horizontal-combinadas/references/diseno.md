# Diseño: cómo tiene que verse y cómo se cuenta

Estas animaciones van montadas encima de la explicación de Josema en YouTube (en español), como apoyo
visual. El espectador **oye** la explicación: la animación no la repite en texto, la hace **visible**
(quién es quién, qué se compara, qué cambia, cuánto cuesta). Lo que más valora Josema:
limpia, clara, los conceptos bien entendidos, los **nombres** de cada herramienta o modelo bien visibles,
logos reales y **sincronía exacta** con la voz.

Hay dos temas (se eligen al empezar, `references/estilos.md`): **oscuro** (el de Hermes, Astra vs Opus y Muse:
un color por protagonista) y **profundidad** (cortina de luz, paneles de cristal y un color de acento; el de las capas
sobre el vídeo). Y, si el estilo lleva sonido, cada recurso suena al entrar y al salir (columna «Sonido» del § 5).

## Contenido

1. Estética base (tema oscuro y tema profundidad)
2. Color
3. Legibilidad
4. Ritmo y sincronía
5. Catálogo de recursos: qué dice la voz → qué se ve
6. Cámara
7. Qué evitar
8. Lista de revisión

## 1. Estética base

### Tema oscuro (Hermes, Astra vs Opus, Muse)

- Fondo casi negro `#0a0c10` con rejilla de puntos tenue, halos de color muy difuminados, viñeta y 4 % de ruido.
- Tipografía: **Outfit** (titulares 800, nombres de modelo 84 px) y **JetBrains Mono** (etiquetas, chips, cifras de apoyo).
- Tarjetas oscuras con borde fino; al protagonista se le "enciende" el borde y un brillo en su color.
- Chips en forma de píldora con icono de línea (Lucide) para el tema de cada momento.
- Líneas discontinuas para relaciones ("=", "VS", flujos) con rayas que avanzan despacio.
- Movimiento con curvas suaves: entradas `out4` de 0,4–0,6 s, salidas `in3` de 0,3–0,4 s con algo de desenfoque.

### Tema profundidad (capas sobre el vídeo; también vale a pantalla completa)
- Fondo: **el del concepto de cada vídeo** (`ESTILO.fondo`: cortina, aurora, malla, constelación, liso o puntos;
  `references/direccion.md` § 3). El de «editado por IA», la **cortina de luz** (`Cortina`): hebras verticales de luz en tres
  profundidades con paralaje (un guiño a los listones de su estudio), polvo en suspensión, un barrido de luz periódico
  y ondas que se expanden en los golpes; nunca un fondo plano. Velocidad y brillo por fotogramas clave (`FONDOK`):
  deriva (vel 26) casi siempre; viaje (vel 90–150, brillo 1,25–1,35) solo cuando la ficha vuela o en un revelado; ondas
  (`{ ondas: [t…] }`) en 3–4 golpes del vídeo. El espacio con estrellas y suelo de rejilla (`Espacio`, `ESPACIOK`) se
  parece al vídeo de referencia: solo si Josema lo pide (§ 7).
- Paneles de cristal oscuro (`panel`) con una inclinación 3D muy sutil (rx 3–8°, ry ±8–14°), borde fino claro,
  sombra larga. Los bloques de rótulo, en el acento o en cristal.
- Un solo color de acento (`ESTILO.acento`, por defecto el azul del canal) para lo que hay que mirar: la palabra
  clave, el halo de la persona, la línea de la cuchilla, el escaneo de una tarjeta, la palabra que suena en los
  subtítulos. Los logos mantienen sus colores de marca.
- Tipografía: Outfit 800 en mayúsculas para titulares gigantes (170 px), Outfit 700 para subtítulos (52 px con
  sombra), JetBrains Mono para datos de interfaz (dominios, cifras de apoyo).
- Entradas con golpe: escala 1,25 → 1 con desenfoque que se aclara en 0,35–0,5 s; las salidas necesitan tiempo para
  verse (≥ 0,3 s con desenfoque), nunca desaparecer de golpe.
- Detrás y delante: lo que tiene que sentirse «en la habitación» va detrás de la persona (titulares, logos);
  lo que es interfaz, delante (tarjetas, buscador, notificaciones).

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

## 5. Catálogo de recursos: qué dice la voz → qué se ve

Sonido: entra · sale (solo si el estilo lleva sonido; `references/sonido.md`). «—» = sin sonido propio.

| La voz… | Recurso | Dónde está resuelto | Sonido |
|---|---|---|---|
| anuncia un tema o una sección ("lo primero, las reglas…", "5 escenarios") | eyebrow mono + titular letra a letra con la palabra clave en degradado | plantilla (`escenaTitulo`), astra `scene1` | golpe en la palabra clave · aire-salida |
| describe algo concreto desde el principio ("hoy montamos un agente que…") | nada de titular: dibuja la cosa (nodos, flujo) desde el primer segundo | plantilla (`nodo`, `Wire`) | aire por pieza · — |
| enumera partes o pruebas ("5 escenarios: reels, animaciones, webs…") | fila de huecos numerados que se rellenan al nombrarlos (logo o icono + nombre); el último puede ser una carta "?" | astra-vs-opus-2 `escenarios` | tick por hueco que se rellena; la carta que gira, aire · aire-salida |
| compara dos cosas ("X frente a Y") | dos tarjetas enfrentadas + "VS" | plantilla (`escenaVersus`) | aire por tarjeta, golpe corto en el VS · aire-salida |
| habla de justicia/equilibrio/quién pesa más ("comparación justa", "no hay color", "humillar") | balanza entre las tarjetas: equilibrada, se vence, vuelve al equilibrio | astra `balanza`, `beamAngle` | tick al equilibrarse, golpe corto al vencerse · — |
| descarta algo ("no hay color", "no vale", "olvídate de") | el descartado se encoge, pasa a gris y sale; el chip se tacha | astra `SOK` (g, br), `strike` del chip | descarte · — |
| crea expectación ("algo aún más interesante", "¿y sabes qué?") | carta "?" con borde que avanza; zoom lento hacia ella; gira y revela | astra `QK`/`AK` | swell que termina al girar + golpe · — |
| gamas/equivalencias ("el tope de", "equivalente a", "de la misma gama") | escalera: franjas por nivel con etiqueta, columnas por empresa, "=" entre equivalentes | astra `ladder` | tick por franja, golpe corto en el «=» · aire-salida |
| sube de categoría ("es tan bestia que…", "juega en otra liga") | la tarjeta se ilumina, anillos, temblor corto, sube a la fila de arriba; "=" pasa a "VS" | astra `OPK`, `bTop` | swell + golpe grave · — |
| precios, porcentajes, benchmarks, tiempos | barras con los **valores reales** dentro, línea de referencia (½, media, récord) | plantilla (`escenaCoste`), astra `cost` | aire al crecer, golpe corto al llegar a su valor · aire-salida |
| dónde se instala/ejecuta | nodo "instalar" y cables hacia tarjetas de dispositivo (portátil, servidor) | hermes `scene1` | aire por nodo, tick por cable · — |
| lista de capacidades | tarjetas con icono que se dibuja y se encienden al nombrarlas | hermes `scene2` | tick por tarjeta que se enciende · — |
| se conecta con apps/herramientas | huecos punteados que se rellenan con los logos al nombrarlos + cables con paquetes | hermes `scene3` | tick por logo que rellena un hueco · — |
| se usa desde el móvil/chat | móvil que sube, mensaje que se escribe, "escribiendo…", respuesta | hermes `phone` | aire al subir el móvil, tecleo al escribir, notificacion en la respuesta · aire-salida |
| pasos de un proceso, automatizaciones (n8n, Make, Zapier) | fila de nodos (`nodo()`) unidos por cables; un paquete o una pieza (`viajar()`) recorre el camino según avanza la voz; los huecos "+" se rellenan con la herramienta al nombrarla | plantilla (`nodo`, `viajar`), ver `motor.md` | tick por nodo, aire suave cuando viaja el paquete · — |
| una cifra que tiene que quedarse | número grande que se escribe, con la unidad en mono al lado | `letters` o `slam` | golpe corto · — |
| conclusión/resumen | vuelta a la composición principal (VS o titular) con el dato clave | — | golpe · — |
| presenta un producto o una app nueva («Meta acaba de lanzar Muse») | icono de la app (ficha blanca redondeada) cuyo logo se escribe a mano + nombre letra a letra + logo de la empresa encima | muse-intro `museFicha`, `museDibujo` (`anim.py logo-trazo`) | golpe en el nombre; el trazo del logo, aire · aire-salida |
| «es gratis», «incluido», «sin coste» | píldora verde «GRATIS» con check que entra con golpe (nunca «100 %» si hay planes de pago) | muse-intro `gratis` | nota · — |
| dónde está disponible («solo en EE. UU.», «en todo el mundo», «desde cualquier país») | mapa del mundo en puntos: el país se enciende con un alfiler; para «en todas partes», la luz se extiende en onda | muse-intro `pintarMapa` (`anim.py mapa`) | brillo al encenderse, tick en el alfiler · — |
| «es como X o Y» (familia de productos) | tarjetas en fila con «≈» entre ellas; el protagonista en el centro | muse-explicacion `escenaTrio` | tick por tarjeta · — |
| «no se trata de X, Y o Z; más bien…» | las tarjetas de X, Y, Z entran al nombrarlas, pierden el color y se tacha su rótulo; entra el protagonista justo cuando salen (sin hueco vacío) | muse-explicacion `escenaNoes` | tick por tarjeta, descarte al tacharse, golpe al entrar el protagonista · — |
| límites, uso, consumo («solo me ha gastado un 3 %») | medidor con pista y días de la semana; se llena lo que dice y la cifra grande entra con golpe | muse-explicacion `medidor()`, `escenaUso` | aire al llenarse, golpe corto en la cifra · — |
| «a base de clic», «conectas tu cuenta» | panel de la app con filas y botón «Conectar»; el cursor viaja, pulsa y el botón pasa por «cargando» a «Conectado» | muse-explicacion `panel`, `CURK` | click al pulsar, nota-doble en «Conectado» · — |
| «vive en la nube», «no tienes que instalar nada» | nube que se dibuja con una máquina «en línea» dentro; portátil con descarga tachado | muse-explicacion `nube`, `vm`, `tachon` | aire · descarte en el tachón |
| «casi al nivel de los mejores» (sin una cifra fiable que dar) | barras sin números: el protagonista se queda un poco por debajo de la línea de «los más potentes», con la etiqueta «casi» | muse-explicacion `escenaModelos` | aire al crecer · — |
| casos de uso, «vamos a ver varias cosas que puede hacer» | fila de tarjetas numeradas que se rellenan al nombrarlas, cada una con una mini ilustración viva (app que se monta, diana con flecha, apps conectadas, imagen que se genera) | muse-intro `CASOS`, `caso*` | tick por tarjeta · aire-salida |

**Con la grabación (modos capas y combinado)** — detalles y piezas en `references/capas-sobre-video.md` § 4:

| La voz… | Recurso | Pieza | Sonido |
|---|---|---|---|
| una palabra que es justo lo que se ve («títulos») | titular gigante detrás de la cabeza (asoma por arriba y por los lados) | `TituloGigante` | golpe · aire-salida |
| «la IA lo ha hecho», un proceso automático | línea de escaneo que le recorre + panel de tareas reales que se marcan hasta «✓ COMPLETA» (junto a la cabeza, nunca sobre la cara) | `Escaneo` + `PanelTareas` | barrido; aire, tick suave por tarea, nota · aire-salida |
| la edición, el montaje, «este vídeo» | la grabación en ficha con la línea de tiempo de un editor cuyos clips se colocan solos | `videoFicha` + `LineaTiempo` | tick por etiqueta, transición al volar |
| «he grabado», «a cámara» | visor de cámara: esquinas, ● REC, código de tiempo; sigue dentro de la ficha si la grabación se encoge | `VisorREC` | bip · — |
| nombra la empresa («Meta acaba de lanzar») | su logo grande detrás de la cabeza | logo en WORLD | golpe corto · — |
| presenta el producto o el modelo («Claude Opus») | el logo sale de donde estaba (un archivo, una tarjeta) girando con estela, estalla en haces de luz y el nombre se barre con un filo de luz; vuelve a su cara con un iris | `RevelarHaces` + `iris()` (el `Revelado` de anillos y confeti recuerda al vídeo de referencia) | swell + golpe grave + brillo + barrido · aire |
| una frase que tiene que quedarse («totalmente gratis») | rótulo en bloques, cámara desenfocada detrás | `Rotulo` + blur/br | golpe corto, tick · aire-salida |
| se conecta con apps, «cada logotipo» | iconos que orbitan la cabeza (por delante a la altura del pecho, no de la boca: `cy` ≈ 445) + contorno luminoso | `Orbita` + halo | tick suave por icono · aire-salida |
| dos conceptos seguidos («efectos y sonidos») | un panel a cada lado de la cabeza: marca o icono sobrio (FX, altavoz), nombre grande y ejemplos reales en chips o la forma de onda de su voz con un cabezal | `PanelConcepto` ×2 | aire, nota · aire-salida |
| un prompt, «pídele lo que quieras», buscar | barra que se escribe con cargador de esfera de puntos | `Buscador` | aire + tecleo · — |
| referencias, fuentes | tarjetas de fuente alrededor de la cara con escaneo | `tarjetaFuente` | tick · — |
| un problema, una limitación | la habitación se desvanece, halo rojo, rótulo | fondo + halo + `Rotulo` | transicion · barrido al volver |
| «lo más potente», velocidad | fondo sustituido con la cortina acelerando y encendida, halo del acento | `FONDOK` vel 150, brillo 1,35 + halo | swell · — |
| subir, publicar | tarjeta con barra de progreso → «Publicado» | `TarjetaProgreso` | aire · nota-doble |
| «te avisa», «para revisión» | notificación que baja, botón que se pulsa | `Notificacion` + `Cursor` | notificacion, click · aire-salida |
| guardar, «colocar en una carpeta», subir | la grabación se encoge a ficha, se abre la ventana del explorador (la carpeta real) y un cursor la arrastra al hueco: «1 elemento» → «2 elementos» (la `carpeta` con tapa recuerda al vídeo de referencia) | `videoFicha` + `Explorador` + `Arrastre` | transicion; aire, clic, clic + golpe corto |
| una lista de casos | la grabación a un lado en ficha, tarjetas al otro | `videoFicha` + `tarjetaFuente` | transicion, tick por tarjeta · aire-salida |
| «paso a paso», cómo lo ha hecho | la grabación a un lado; ruta vertical de pasos con línea de luz, uno por palabra, que se queda completa ≥ 2 s | `videoFicha` + `RutaPasos` | transicion, tick por paso · aire-salida |
| «te regalo la skill / la plantilla», «móntalo hoy» | tarjeta DE REGALO junto a su cara que se instala con la voz («Instalando…» → «✓ Lista») | `TarjetaRegalo` | aire, aire, nota doble |
| un porcentaje | cuadrícula de 100 que se llena | `Cuadricula100` | aire, golpe corto · — |
| algo que desaparece | la palabra se deshace en polvo | `Polvo` | descarte · — |
| «la IA», algo abstracto | esfera de puntos que se convierte en un logo o icono | `EsferaPuntos` | aire, brillo · — |
| se presenta | rótulo de nombre y cargo | `RotuloNombre` | aire · — |

Este catálogo son **ideas que ya funcionaron, no una lista cerrada ni un orden que repetir**: cada vídeo necesita al
menos una pieza propia (`references/direccion.md` § 5) y no más de la mitad de las piezas del vídeo anterior. Si
ninguna encaja, inventa una con el lenguaje del motor (paneles, chips, líneas, halos, con `var(--panel-bg)` y
`var(--display)` para que tome el acabado y la tipografía del vídeo) antes que meter texto: la pregunta es «¿qué
dibujo haría que esto se entienda sin leer?».

## 6. Cámara

- Zoom entre 1,00 y 1,07; acércate a lo que genera expectación o a la fila que importa y vuelve a 1,00
  para las transiciones.
- Golpes cortos (1,02–1,03 en 0,15 s) solo en 2–4 palabras fuertes de todo el vídeo.
- Nunca muevas la cámara mientras el espectador tiene que leer un nombre que acaba de aparecer.
- La grabación (capas y combinado) tiene su propio encuadre: punch-ins de 1,08 alternando en cada salto de corte
  (≤ 9 %: los de 16–22 % quedan exagerados con cosas detrás de la cabeza), un acercamiento lento opcional en un
  plano (`empuje` 0,03–0,05). **Nada de golpes cortos de zoom sobre la grabación** (`zoom` en estadoVideo que entra y
  sale): Josema los ve como «un tambaleo, un zoom pequeño raro» (29/09/2026).

## 7. Qué evitar

- Frases largas en pantalla (la voz ya lo dice): máximo 3–5 palabras por chip o rótulo. Los subtítulos palabra
  a palabra solo si el estilo los lleva (`Subtitulos`, capas/combinado), nunca a mano.
- Datos inventados o aproximados que no cuadran con la fuente (ver `datos-y-logos.md`).
- Emojis, sellos inclinados, destellos blancos a pantalla completa (el `destello` llega como mucho a 0,55),
  efectos de "golpe" exagerados.
- Música o efectos si el estilo es «solo voz». Con sonido: «pops» de dibujos animados, más de un golpe grave por
  segundo, efectos que tapan una palabra (`references/sonido.md`).
- Cifras intermedias visibles en contadores (un fotograma pausado parece un dato real).
- Logos que no se ven bien en fondo oscuro o de baja calidad (mejor el nombre solo que un logo pixelado).
- Golpes cortos de zoom sobre su grabación (1,03 que entra y sale en 0,3 s): se ven como un «tambaleo» raro. El
  encuadre de la grabación solo cambia con cortes (punch-in en los saltos) o con un empuje lento (29/09/2026).
- Copiar tal cual los recursos del vídeo de referencia (espacio con suelo de rejilla, carpeta con tapa, revelado con
  anillos y confeti, INTELIGENCIA ARTIFICIAL detrás de la cabeza): Josema no quiere que se relacionen. Mantén la idea y
  cambia la forma (29/09/2026). Las versiones propias ya están en el motor: `Cortina`, `Explorador` + `Arrastre`,
  `RevelarHaces`, `iris` (ejemplo: `ejemplos/editado-por-ia.html`).
- Nada encima de su cara: ni corchetes de reconocimiento facial ni «CARA DETECTADA» («queda feísimo», 29/09/2026). La
  interfaz va a los lados de la cabeza; lo único que la toca es el contorno luminoso.
- Iconos «de IA» (varita mágica, destellos, estrellitas que titilan): «son muy de IA». Usa lenguaje de editor de vídeo
  y de escritorio: sello FX, altavoz, forma de onda, ventanas, cursores (29/09/2026).
- Nada que parpadee: barras que cambian de altura en cada fotograma o destellos rápidos se ven como un parpadeo. Lo que
  se mueve con la voz, suavizado (forma de onda fija + cabezal que avanza).
- Listas o pasos que no dan tiempo a leer: espacia las entradas (≥ 0,5 s) y deja la lista completa ≥ 2 s antes de
  que salga, aunque el plano se alargue sobre la frase siguiente (enlázala, p. ej. encendiendo el paso del que habla).
  Lo que va después puede durar menos (la tarjeta de la skill pasó de 4,4 a 3 s y quedó mejor).

## 8. Lista de revisión (antes del render final)

- [ ] Cada nombre de herramienta/modelo se lee bien y es el oficial (mayúsculas, guiones, versión).
- [ ] Cada logo es el correcto y se ve sobre el fondo.
- [ ] Cada elemento aparece con su palabra (ni antes de que se mencione ni tarde).
- [ ] Ningún texto se corta ni se sale del cuadro, tampoco con el zoom de cámara.
- [ ] No hay elementos superpuestos por accidente (etiquetas que tocan tarjetas, pies con cabeceras).
- [ ] Cifras = fuente oficial; si la voz redondea, la pantalla no la contradice ni miente.
- [ ] Las transiciones se ven limpias en fotogramas intermedios (revisa 2–3 instantes dentro de cada una).
- [ ] El último plano aguanta hasta el final del audio.
- [ ] Con sonido: cada entrada y salida importante suena, nada suena sin que pase algo, y la mezcla sale «lineal».
- [ ] Con capas: lo de detrás de la cabeza queda tapado de verdad por ella, nada que haya que leer queda debajo de
      la persona, el contorno no tiene halos raros y las transiciones (ficha, cuchilla, iris) no saltan.
- [ ] Nada tapa ni enmarca su cara (tampoco un icono de la órbita pasando por su boca); ningún zoom corto sobre la
      grabación; nada parpadea; cada lista se queda completa ≥ 2 s.
- [ ] Nada se parece al vídeo de referencia (fondo, carpeta, revelado, titulares detrás de temas genéricos).
- [ ] Tiene su propio concepto y su pieza firma, y `anim.py historial --comprobar` no avisa de que se parezca al
      último vídeo.
