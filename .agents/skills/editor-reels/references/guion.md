# guion.json: formato y catálogo de piezas (modo clásico)

Este es el guion del **modo clásico**: clips de móvil a pantalla completa y grabaciones dobles de pantalla y cámara. Para una persona hablando a cámara, el normal es el modo pro (`guion-pro.md`). Las piezas de un modo no valen en el otro.

El guion vive en `trabajo/<reel>/guion.json` (lo crea `reel.py cortar <reel> --tramos "…" --clasico`). Todos los tiempos van en **segundos del vídeo base limpio**, el que genera `reel.py cortar`. Son los tiempos de la lista de palabras que imprime ese comando, no los del vídeo original. Tienes un guion real completo en `ejemplos/guion_ejemplo.json`.

## Índice

1. Campos generales
2. Capítulos
3. Piezas (elementos)
4. Iconos disponibles
5. Sonidos automáticos
6. Reglas de tiempos

## 1. Campos generales

```json
{
 "correcciones": {"convierte": "conviertes", "video": "vídeo"},
 "destacar": [["google", 0, 1], ["gratis"], ["cerebro"]],
 "partir_subtitulos_en": [2.24, 13.76],
 "zooms": [[1.0, 1.02], [1.05, 1.06], [1.0, 1.025]],
 "logos": {"google": "Google", "gemini": "Gemini", "stitch": "Google Stitch"},
 "capitulos": [],
 "elementos": [],
 "musica": {"archivo": "", "volumen": 0.1},
 "relleno": "estirar"
}
```

| Campo | Qué hace |
|---|---|
| `correcciones` | Arregla palabras mal transcritas en los subtítulos. No distingue mayúsculas ni tildes al buscar. |
| `destacar` | Palabras en el color de acento. `["palabra"]` marca todas las apariciones; `["palabra", desde, hasta]` solo las de ese intervalo. Cuenta con una por frase, más o menos. |
| `partir_subtitulos_en` | Fuerza un salto de página de subtítulos antes de la palabra que empieza más cerca de cada tiempo. Úsalo para agrupar frases con sentido ("PASO A PASO" junto). |
| `zooms` | Uno por tramo del vídeo base: `[escala al empezar, escala al acabar]`. Alterna 1,0 y 1,05; no pases de 1,06. |
| `logos` | Clave que usas en las piezas → nombre con el que se buscó en `reel.py logos`. |
| `musica` | Pista opcional (ruta relativa al proyecto). Se funde sola al empezar y al acabar. Volumen 0,08–0,12. |
| `relleno` | Cómo se rellena el lienzo alrededor del vídeo. `estirar` (por defecto) prolonga el fondo hacia arriba y va bien con paredes o fondos lisos. `oscuro` usa el color de fondo. `desenfoque` usa una copia desenfocada y va bien con fondos con objetos o vídeos verticales estrechos. |
| `encuadre` | Opcional. `"completo"` deja el vídeo vertical a pantalla completa, tal cual se grabó con el móvil, sin reducir a la persona. Para ediciones sencillas (subtítulos, portada y llamada a comentar): la cara ocupa más, así que no caben piezas en la zona de gráficos salvo sobre planos de pantalla. |
| `anclaY` | Opcional. Altura (0–1) en la que se anclan los zooms; por defecto la de la cara, o 0,4 con `"encuadre": "completo"`. |
| `video` | Opcional. Por defecto `reels/<reel>/base.mp4`. |

Los subtítulos, los zooms en cada corte, el encuadre y los sonidos se calculan solos. Tú solo decides lo creativo.

## 2. Capítulos

Es la etiqueta de arriba a la izquierda, con el logo, el número y el título. Úsala cuando el vídeo recorre varias cosas: herramientas, pasos, errores…

```json
{"i": 7.9, "f": 15.4333, "num": "01", "titulo": "Conocimiento", "logo": "gemini", "logoDesde": 10.0}
```

- **`i` y `f`:** normalmente coinciden con los puntos de corte que imprime `cortar`.
- **`titulo`:** 14 caracteres como mucho. Se pasa a mayúsculas solo.
- **`num`:** opcional. Sin número queda bien para un resumen ("TODO JUNTO").
- **`logoDesde`:** cuándo aparece el logo en la etiqueta. Si el logo llega volando desde una pieza `logo` con `acoplar`, pon `acoplar + 0,45`. Hasta entonces el hueco queda vacío, esperándolo.
- **`icono`:** opcional, para capítulos sin logo de herramienta (`"icono": "server"`). Sin logo ni icono sale `sparkle`.

## 3. Piezas (elementos)

Todas se colocan en la zona de gráficos, por debajo de la barbilla. Si dos piezas coinciden en el tiempo, se pisan: encadénalas.

### `logo`: la herramienta que se nombra

```json
{"tipo": "logo", "i": 7.98, "f": 10.2, "logo": "gemini", "nombre": "Gemini Notebook", "acoplar": 9.55}
```

- Salta con un rebote y un anillo al nombrar la herramienta.
- **Con `acoplar`:** en ese momento vuela a la etiqueta del capítulo. Pon `f` ≈ `acoplar + 0,65`.
- **Sin `acoplar`:** se desvanece en `f`. Déjala al menos 1,2 s.

### `ecosistema`: un centro unido a varias herramientas

```json
{"tipo": "ecosistema", "i": 4.82, "f": 6.9, "centro": "google", "logos": ["gemini", "stitch", "antigravity", "flow"], "entradas": [5.1, 5.3, 5.5, 5.7]}
```

- Admite hasta 6 herramientas. Las líneas son discontinuas y fluyen.
- Si justo antes hay un `logo` del mismo centro que termina en `i + 0,18`, el logo encoge y se convierte en el centro sin que se note el cambio.

### `destacado`: una palabra que tiene que quedarse grabada

```json
{"tipo": "destacado", "i": 6.85, "f": 8.05, "texto": "Gratis", "color": "green", "icono": "check"}
```

- Palabra grande y recta. Las letras suben una a una, el icono salta y se dibuja un subrayado.
- **Texto:** 12 caracteres como mucho. Duración: 1 s como mínimo.
- **Colores:** `blue` (acento), `green` (positivo), `amber` (aviso), `red` (negativo).
- El subtítulo que repite la palabra se oculta solo.

### `lista`: ventajas o requisitos con checks

```json
{"tipo": "lista", "i": 46.3, "f": 49.5, "color": "green", "items": [{"texto": "Muy sencillo", "en": 46.32}, {"texto": "Sin conocimientos", "en": 47.5}]}
```

- Lleva de 2 a 3 líneas de 18 caracteres como mucho.
- Cada línea entra cuando se dice y su check se dibuja solo.

### `chips`: enumeración con iconos

```json
{"tipo": "chips", "i": 36.1, "f": 40.3, "columnas": 2, "items": [
 {"texto": "Imágenes", "icono": "image", "en": 36.17},
 {"texto": "Vídeos", "icono": "video", "en": 36.8}
]}
```

- Lleva de 2 a 6 tarjetas de 1 a 2 palabras.
- `columnas`: 2 (o 3 si los textos son muy cortos).

### `convergencia`: muchas cosas que se convierten en una

```json
{"tipo": "convergencia", "i": 10.25, "f": 15.43, "iconos": ["file", "mail", "msg", "image", "chart", "folder", "db", "calendar"], "unir": 13.85, "final": {"icono": "brain", "texto": "EL CEREBRO DE TU NEGOCIO", "en": 14.45}}
```

- Sirve para ideas como desorden → orden, datos → conocimiento o muchas apps → una.
- Los iconos tiemblan dispersos y en `unir` vuelan al centro. En `final.en` aparece el resultado.

### `mockup`: una web o app que pasa de boceto a funcional

```json
{"tipo": "mockup", "i": 23.75, "f": 31.97, "appEn": 24.9, "titulo": "tunegocio.com", "totalEn": 30.95,
 "resaltes": [{"en": 27.32, "k": 0}, {"en": 28.2, "k": 1}, {"en": 30.92, "k": 2}],
 "contenido": {"titular": "Tu presupuesto", "destacado": "en 1 minuto", "texto": "Rellena el formulario y recibe tu precio",
  "boton": "Calcular →", "campos": ["Nombre", "Metros²"], "total": 1250, "moneda": "€", "menu": "Inicio · Servicios · Contacto",
  "tarjetas": [{"icono": "form", "texto": "Formulario"}, {"icono": "git", "texto": "Lógica"}, {"icono": "euro", "texto": "Presupuesto"}]}}
```

- **`appEn`:** cuándo el boceto se convierte en app, con un barrido de luz. Con `999` se queda en boceto (para la fase de "diseño").
- **`resaltes`:** qué tarjeta de abajo (`k`, de 0 a 2) se ilumina y cuándo. Úsalo para que se encienda al decir su nombre.
- **`totalEn`:** arranca el contador hasta `contenido.total`.
- **`contenido`:** todos sus campos son opcionales. Adáptalo al tema del vídeo y no te inventes cifras reales.
- **Para enseñar el diseño y luego la app,** usa dos `mockup` seguidos: el primero con `appEn: 999` y el segundo que se convierte.

### `pipeline`: herramientas en fila unidas por flechas

```json
{"tipo": "pipeline", "i": 40.3, "f": 45.9, "nodos": [{"logo": "gemini", "texto": "CONOCIMIENTO", "en": 41.02}, {"logo": "stitch", "texto": "DISEÑO", "en": 42.26}]}
```

- Lleva de 3 a 4 nodos, con textos de 12 caracteres como mucho.
- Cada nodo se enciende al nombrarlo. Va muy bien para el resumen final de un proceso.
- **Nodo sin herramienta** (tu vídeo, el resultado): `"icono": "video"` en vez de `logo`.
- **`sub` y `subEn`:** segunda línea bajo el nodo que aparece al decirla (`"sub": "OPUS 5.5", "subEn": 39.52`).

### `logos`: varias herramientas en fila

```json
{"tipo": "logos", "i": 22.15, "f": 26.4, "items": [{"logo": "claude", "nombre": "Claude", "en": 22.2}, {"logo": "openai", "nombre": "ChatGPT", "en": 22.95}]}
```

- Para "como X o Y": cada logo salta al nombrarlo, con un pop. De 2 a 4 logos.

### `tiempo`: el vídeo en bruto como línea de tiempo

```json
{"tipo": "tiempo", "i": 6.08, "f": 12.85, "pausasEn": 7.5, "juntarEn": 9.85, "antes": "EN BRUTO", "despues": "SIN PAUSAS"}
```

- Enseña con los datos reales qué se ha quitado: los trozos con voz en azul y las pausas vacías, con la duración en bruto.
- En `pausasEn` las pausas se marcan en ámbar con su duración total ("1:33 DE PAUSAS"). En `juntarEn` desaparecen, los trozos se juntan y el contador baja hasta la duración del reel.
- Los trozos, la duración en bruto y la final los rellena `edl` con `cortes.json`. Para cuando se habla de cortar, quitar silencios o de lo que se tardaba antes.

### `sincronia`: el propio reel como línea de tiempo

```json
{"tipo": "sincronia", "i": 30.05, "f": 33.62}
```

- Un cabezal recorre el reel y el icono de cada pieza del guion se enciende en su sitio. Para "cada cosa va sincronizada con lo que digo".
- Las marcas, los trozos y el barrido del cabezal los rellena `edl` con el guion (se pueden fijar con `marcas`, `barrido` y `titulo`).

### `visor`: esquinas de cámara alrededor de la cara

```json
{"tipo": "visor", "i": 12.97, "f": 13.85, "texto": "ZOOM"}
```

- Se cierran de golpe, como una cámara que enfoca, con una etiqueta arriba. Para señalar un salto de zoom (ponlo en el corte, con un zoom mayor en ese tramo, p. ej. 1,12).
- **Nunca ceñido a la cara:** Josema rechazó los corchetes alrededor de su cara. Usa una `caja` grande que enmarque la pantalla (p. ej. `{"x": 70, "y": 250, "w": 940, "h": 1260}`).
- `caja` cambia la zona e `icono` el de la etiqueta.

### `cta`: llamada a comentar una palabra

```json
{"tipo": "cta", "i": 49.6, "f": 53.83, "etiqueta": "COMENTA", "palabra": "VÍDEO", "escribirEn": 49.94, "sub": "y te enseño a implementarlo paso a paso"}
```

- La palabra se escribe sola, letra a letra, con un cursor.
- Pon `escribirEn` justo cuando se dice la palabra y `f` al final del vídeo.

### `portada`: título de portada en los primeros segundos

```json
{"tipo": "portada", "i": 0.0, "f": 3.04, "antetitulo": "Claude Opus 5.5", "logo": "claude", "titulo": "Edita mis vídeos", "destacar": ["vídeos"], "estilo": "caja", "top": 1282}
```

- Una píldora clara con el logo y el protagonista (`antetitulo`, opcional) y debajo el titular en grande. Sirve de gancho y de portada del reel.
- **Con `i: 0` se ve entera desde el primer fotograma.** Pon `f` en el primer corte. Mientras dura no hay subtítulos.
- **`estilo`:** `marcador` (por defecto; las palabras de `destacar` sobre un recuadro del color de acento), `caja` (todo el titular dentro del recuadro, lo más llamativo) o `texto` (palabras clave en el color de acento y subrayadas).
- **`titulo`:** una línea de hasta ~16 caracteres; el tamaño se ajusta solo. `\n` parte en líneas.
- **`top`:** justo por debajo de la barbilla (mídela con fotogramas) y con el bloque terminado antes de y≈1560. Instagram recorta la portada a 3:4 en el perfil (y 240–1680): todo lo importante tiene que caber ahí.
- Después de renderizar, `reel.py portada <reel> 1.0` guarda ese fotograma en `salida/<reel>_portada.jpg` para subirlo como portada.

### `pantalla`: un trozo de la grabación de pantalla (solo grabaciones dobles)

```json
{"tipo": "pantalla", "i": 22.28, "f": 31.43, "empuje": 0.03, "vistas": [
 {"x": 90, "y": 310, "w": 630, "h": 520},
 {"en": 26.3, "dur": 0.8, "x": 765, "y": 335, "w": 735, "h": 477}]}
```

- Para vídeos con la pantalla y la cámara una al lado de la otra (p. ej. 3840×1080 de OBS). `analizar` lo detecta solo y `cortar` genera `pantalla.mp4` con los mismos cortes.
- La tarjeta ocupa la franja de la cara y de los gráficos; la cara pasa a una burbuja arriba a la derecha (`"cara": false` la quita). Mientras dura no pongas otra pieza.
- **`vistas`:** zonas de la pantalla en píxeles de `pantalla.mp4` (1920×1080). La primera se ve al entrar; cada siguiente es un movimiento de cámara que empieza en `en` y dura `dur` (0,7 s por defecto). La tarjeta toma la forma de la zona.
- **Que se lea:** en el móvil, una zona de más de ~1000 px de ancho deja el texto pequeño. Mejor zonas de 550–800 px (un bloque, una tarjeta, una lista) y moverse de una a otra cuando se nombran.
- Revisa con fotogramas qué se ve en cada momento: si en la grabación cambias de diapositiva o se ve algo que no toca, empieza la pieza después.
- **`empuje`:** zoom muy lento durante toda la pieza (0,04 por defecto; 0 lo quita).
- Dos piezas `pantalla` seguidas (menos de 0,1 s entre ellas) no se animan entre sí: la tarjeta se queda y cambia el contenido.

## 4. Iconos disponibles

`file`, `form`, `msg`, `mail`, `db`, `folder`, `calendar`, `chart`, `image`, `video`, `megaphone`, `share`, `users`, `euro`, `git`, `brain`, `check`, `x`, `sparkle`, `server`, `monitor`, `smartphone`, `scissors`, `zoom`, `type`, `volume`.

Para añadir más, edita `<skill>/plantilla/src/iconos.tsx` y luego ejecuta `preparar`. Usa el mismo estilo lineal: 24×24, trazo de 2 y extremos redondeados (por ejemplo, un icono de Lucide).

## 5. Sonidos automáticos

`reel.py edl` pone los efectos solos. No hace falta escribirlos.

| Pieza | Sonido |
|---|---|
| `logo` | pop al aparecer y whoosh al acoplarse |
| `ecosistema` | pop por cada herramienta |
| `destacado` | whoosh y acorde de éxito |
| `lista` | check por cada línea |
| `chips`, `pipeline` | blip por cada tarjeta o nodo |
| `convergencia` | whip al unirse y pop del resultado |
| `mockup` | whoosh al entrar, "switch" al pasar a app, blip por resalte y ding al terminar el contador |
| `cta` | whoosh, un clic por letra y ding final |
| `pantalla` | whoosh suave al entrar (no en los relevos entre pantallas) |
| `portada` | ninguno (el reel empieza limpio) |
| `logos` | pop por cada logo |
| `tiempo` | whoosh al entrar, blip al marcar las pausas y whip al juntar los trozos |
| `sincronia` | whoosh al entrar y un blip suave por cada pieza que enciende el cabezal |
| `visor` | whoosh suave al cerrarse |

Para cambiar los de una pieza, ponle `"sonidos": [["sfx/tijera.wav", 15.0, 0.6]]` (archivo, segundo y volumen): sustituyen a los automáticos. Hay `tijera.wav` para marcar un corte.

## 6. Reglas de tiempos

- **Anticipación:** cada pieza entra entre 0,05 y 0,15 s antes de la palabra que la motiva.
- **Una sola pieza en la zona de gráficos a la vez.** Deja 0,1–0,2 s de aire entre una y la siguiente. La excepción es el relevo `logo` → `ecosistema`.
- **Duraciones mínimas:** 1 s para que se lea un `destacado`; 1,2 s para un `logo` sin acoplar; 0,4 s de separación entre las líneas de una `lista` o las tarjetas de unos `chips`.
- **Dónde terminar:** `f` en un punto de corte o justo antes del `i` de la pieza siguiente.
- **Huecos:** algunos segundos sin gráfico están bien. El vídeo respira y lo siguiente se nota más.
