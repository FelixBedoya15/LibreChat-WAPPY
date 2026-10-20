# Sistema visual y preferencias

## Índice

1. Principios
2. Zonas del lienzo en el modo pro
3. Zonas del lienzo en el modo clásico
4. El aspecto del modo pro (estilo DominIA)
5. Subtítulos
6. Movimiento
7. Sonido
8. Marca propia
9. Preferencias ya decididas (no repetir errores)

## 1. Principios

- **Limpio y oscuro, con un único color de acento** (DominIA por defecto). Las tarjetas son sólidas y oscuras, con borde fino. No hay efecto cristal.
- **Una sola tipografía** (Inter) en 800–900 y mayúsculas para subtítulos, títulos y etiquetas. Nada de letra monoespaciada «de código».
- **Iconos lineales** dentro de cuadrados redondeados con un fondo tenue del color de acento.
- **Verde, ámbar y rojo solo marcan estados** (sí, aviso, no). No son decoración.
- **Todo recto.** Nada inclinado, ni sacudidas de cámara, ni destellos blancos, ni nada que parpadee.
- **Poco a la vez.** El protagonista es la persona que habla.
- **El aspecto es de la marca del usuario, no de un reel de referencia.** De las referencias se aprende el oficio (ritmo, cómo entran las cosas); el diseño sale de aquí.

## 2. Zonas del lienzo en el modo pro (1080×1920)

| Zona | Píxeles | Qué va |
|---|---|---|
| Interfaz de Instagram arriba | y 0–220 | Nada que leer |
| Capítulo (izquierda) y logo de la marca (derecha) | y 234–318 | Dos pastillas oscuras |
| Cara | y 305–831 | La persona. Aquí no va nada |
| Pieza sobre el pecho | y 916–1376, x 80–1000 | Una cada vez. Lo que hay que leer, hasta x≈940 |
| Subtítulos | y 1400–1540 | Una o dos líneas de 56 px |
| Interfaz de Instagram abajo | y 1560–1920 | Nada que leer (usuario, texto, audio) |
| Botones de Instagram | x > 950, y 1000–1560 | Nada que leer: el borde de una tarjeta puede quedar debajo; su contenido, no |

- **Escenas a pantalla completa:** titular en y 344; contenido hasta y 1340, entre x 72 y 1008 (lo que hay que leer por debajo de y 1000, hasta x≈925).
- **Texto grande suelto** (titular, sentencia): centrado y de 800 px de ancho como mucho (llega a x 940).
- **Tamaño mínimo de letra: 26 px.** Por debajo no se lee en un móvil. Rótulos, 28 px.
- **Portada en Instagram:** en el perfil se ve recortada a 3:4 (y 240–1680). El título tiene que caber ahí.
- Las constantes están en `plantilla/src/pro/sistema.ts` (`ZONA`, `ESCENA`, `SUBS`, `SEGURO`, `TXT`). `reel.py revisar … --zonas` las pinta sobre los fotogramas.
- **La cara sube 60 px** respecto al encuadre que calcula `encuadre.py` (`desplazarY`), para dejar 85 px entre la barbilla y la pieza. Con pieza, el zoom se ancla en la barbilla: la cara crece hacia arriba.

## 3. Zonas del lienzo en el modo clásico

| Zona | Altura (px) | Qué va |
|---|---|---|
| Interfaz de Instagram arriba | 0–220 | Nada importante, solo el fondo |
| Etiqueta de capítulo | 236–328, a la izquierda | Logo, número y título |
| Cara | 365–891 | La persona. Aquí no va nada |
| Gráficos | 925–1265 | Una pieza cada vez |
| Subtítulos | 1292–1480 | Dos líneas |
| Interfaz de Instagram abajo | 1560–1920 | Nada importante |
| Botones de la derecha | x > 960, y 1000–1700 | Nada importante |

- **Con una pieza `pantalla`** (grabaciones dobles): la etiqueta sigue arriba a la izquierda, la cara pasa a una burbuja de 224 px arriba a la derecha (y 236–460), la tarjeta con la pantalla ocupa y 474–1264 (960 px de ancho como mucho) y los subtítulos siguen en su sitio.
- **Con `"encuadre": "completo"`** (clips de móvil): el vídeo ocupa todo el lienzo y la cara suele ir de y≈300 a y≈1250: no caben piezas durante los planos de cara. La `portada` va por debajo de la barbilla (y≈1280–1500).
- Las constantes están en `plantilla/src/tema.ts`.

**El encuadre se calcula solo** en los dos modos (`encuadre.py`): detecta la cara con YuNet y escala y coloca el vídeo para que la cabeza empiece en y≈365 y la barbilla acabe en y≈891. Si la grabación es un plano cerrado, eso reduce a la persona y el hueco se rellena prolongando el fondo. `PELO = 0.25` deja margen para peinados con volumen.

## 4. El aspecto del modo pro (estilo DominIA)

Es el de las presentaciones DominIA llevado a vertical:

- **Fondo de las escenas:** casi negro y limpio, con un resplandor violeta suave arriba a la izquierda. Sin trama de puntos ni cuadrícula.
- **Titulares enormes en mayúsculas:** blanco con la palabra clave en el color de acento. En las escenas, el titular es la pregunta que se hace el espectador.
- **Tarjetas oscuras y sólidas,** con borde fino y el icono (lineal, del color de acento) en un cuadrado redondeado. La tarjeta «encendida» lleva borde y resplandor de acento.
- **Etiquetas de acento en mayúsculas espaciadas** («LA PREGUNTA», «RIVALES»).
- **Pastillas de estado con punto** (azul, verde, ámbar, rojo).
- **Piezas que se encienden:** lo que espera va en gris, sin símbolo; al nombrarlo, borde de acento y visto bueno verde. Lo que se queda fuera, en rojo con candado.
- **Logo de la marca** siempre arriba a la derecha y **capítulo** arriba a la izquierda.
- **La fuente de cada dato,** pequeña (26 px) y en frase normal («Datos: Google»), no como rótulo.

Lo que se mantiene de un reel a otro es este sistema. Lo que cambia: las piezas, las metáforas, los rótulos y el orden de los planos.

## 5. Subtítulos

- **Modo pro:** una o dos líneas de hasta 18 letras, Inter 900 mayúscula de 56 px, siempre en y 1400. La palabra que suena va en el color de acento y da un pequeño salto. En el primer plano sin pieza, 78 px. Se esconden solos mientras una pieza ya es el texto (titular, sentencia, el nombre de un revelado).
- **Modo clásico:** dos líneas de hasta 16 letras, 80 px. Lo que aún no se ha dicho va atenuado y lo dicho, en blanco.
- **En los dos:** una página nunca cruza un corte del vídeo ni termina en una palabra de enlace («de», «la», «y»…).

## 6. Movimiento

- **Entradas:** con resortes, de 0,3 a 0,5 s, con un rebote leve en logos e iconos.
- **Salidas:** fundidos cortos, de 0,15 a 0,2 s. La pieza que precede a una escena no se funde: la tapa la cortina.
- **Escenas:** entran como una cortina que sube con un filo de luz y tapa el corte.
- **Encuadre:** un salto en cada corte y un empuje muy lento dentro de cada tramo. Nunca zooms cortos.
- **Al encenderse algo:** un latido pequeño (3–7 %), sin sacudidas.

## 7. Sonido

- **Voz:** normalizada a −14 LUFS, con el pico por debajo de −1,5 dBFS.
- **Modo pro:** un efecto discreto por cada cosa que entra (ticks 12–20 dB por debajo de la voz; golpes, 6–14) y de 4 a 6 golpes graves en todo el reel. Máster con limitador a −1 dB. Biblioteca en `sonidos/` (sintetizados y de Pixabay, sin atribución).
- **Modo clásico:** efectos con cuentagotas, solo en los momentos fuertes.
- **Música:** el reel sale sin música. El usuario la añade en Instagram.

## 8. Marca propia

`marca.json`, en la raíz del proyecto:

```json
{"nombre": "Mi marca",
 "colores": {"fondo": "#06080d", "texto": "#f3f5f9", "suave": "#8a94a6", "tenue": "#566072",
  "acento": "#4b8cf7", "acento2": "#2f6fe8", "acento3": "#a9c6ff",
  "ok": "#34d399", "aviso": "#f5b64a", "error": "#f26d6d",
  "borde": "#1b2230", "borde2": "#273142", "tarjeta": ["#10151e", "#0c1118"]},
 "fuente": "Inter",
 "logo": "logos/mi-logo.png"}
```

- Cambia `acento` y `acento2` (una versión algo más oscura) por el color de la marca, y `acento3` por una más clara. Ejecuta `reel.py preparar`.
- **`logo`:** ruta dentro de `editor/public/` de un PNG o SVG apaisado que se vea bien sobre fondo oscuro (se muestra a 56 px de alto, arriba a la derecha). Sin `logo` no sale.
- La plantilla está pensada para fondos oscuros. Algunos tonos del modo pro (tarjeta encendida, pastillas) están pensados para un acento azul: con otro color, revisa `D` en `plantilla/src/pro/sistema.ts`.
- Para otra tipografía de Google Fonts, cambia el import de `plantilla/src/tema.ts` (por ejemplo, `@remotion/google-fonts/Montserrat`).

## 9. Preferencias ya decididas (no repetir errores)

- **La cara nunca se tapa, ni la frente con la etiqueta ni la barbilla con los gráficos.** Si hace falta, se abre el plano en vez de apretar los gráficos. (Josema, 2026-09-24: «aparezco demasiado grande»)
- **Nada de sellos inclinados.** Para énfasis, texto grande y recto. (Josema, 2026-09-24: «aparece la etiqueta inclinada, no me gusta»)
- **Referencias de otros creadores:** se analizan para entender el tipo de edición y nunca se copian: ni sus colores, ni sus piezas, ni sus rótulos, ni su llamada a la acción. Antes de entregar se compara pieza por pieza. (Josema, 2026-09-24 y 2026-10-01: «quiero que te bases pero NO COPIES»)
- **Nada ceñido a su cara:** ni esquinas de visor ni «cara detectada» alrededor de ella. (Josema, 29/09/2026: «queda feísimo»)
- **Sin iconos «de IA»** (destellos, varitas): usa objetos concretos (candado, calendario, monedas, ventanas). (Josema, 29/09/2026: «son muy de IA»)
- **Nada que parpadee ni zooms cortos de «tambaleo».**
- **Las listas tienen que poder leerse:** completas al menos 2 s, o visibles enteras (apagadas) desde antes.
- **Ritmo sin pausas.** Entre frases, el mínimo silencio posible (una décima); nada de respiros añadidos. (Josema, 2026-10-04, sobre el reel de Muse: «necesito que entre frases haya menos pausa de silencio, al final un reel tiene que ser dinámico para que la gente se quede… tenlo en cuenta en los siguientes»)
- **Lo que más valora:** que las animaciones vayan integradas con lo que dice, cada cosa en su palabra. (Josema, 2026-10-01, sobre el reel de Gemini 4 Argon: «esa gran capacidad de integrar lo que yo digo con las animaciones»). Y que no todos los reels sean iguales: el estilo se mantiene, las piezas cambian.
- **«Le falta animaciones mejores»** (Josema, 30/09/2026, sobre el modo clásico): de ahí sale el modo pro. Para ir todavía más allá (su cara recortada con cosas detrás y delante, fondo sustituido), está la skill animaciones-horizontal-combinadas con `--vertical`.
