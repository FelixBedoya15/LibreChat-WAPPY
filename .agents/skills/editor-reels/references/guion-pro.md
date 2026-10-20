# guion_pro.json: formato y catálogo de piezas (modo pro)

El guion vive en `trabajo/<reel>/guion_pro.json`. Todos los tiempos van en **segundos del vídeo base limpio** y salen de la tabla que imprime `reel.py alinear` (inicio exacto de cada palabra), no de Whisper. Guion real completo: `ejemplos/guion_pro_ejemplo.json` (con su `ejemplos/guion_alinear_ejemplo.txt`).

## Índice

1. Campos generales
2. Lo que tienen todas las piezas
3. Piezas del plano de cara
4. Escenas a pantalla completa
5. Sonidos
6. Subtítulos
7. Encuadres (zooms)
8. Portada
9. Piezas propias
10. Reglas de tiempos

## 1. Campos generales

```json
{
 "zooms": [[1.0, 1.035], [1.0, 1.0], [1.07, 1.09], [1.17, 1.2, "cara"]],
 "imagen": {"filtro": "contrast(1.06) saturate(0.93) brightness(1.01)", "vineta": 0.3, "abajo": "oscuro"},
 "logos": {"google": "Google", "gemini": "Gemini", "propio": "logos/mi-logo.png"},
 "secciones": [{"i": 12.36, "f": 19.0, "titulo": "Programación"}],
 "subtitulos": {"max_linea": 18, "grande": [[10.24, 12.36]], "textos": {"121": "¿Y"}, "partir_antes": [12, 18]},
 "portada": {"t": 61.6, "titular": {"marca": "GOOGLE", "logo": "google", "lineas": [{"texto": "GEMINI 4"}, {"texto": "ARGON", "caja": true}]}},
 "piezas": [],
 "sonidos": [["bip", 26.54, 0.9]]
}
```

| Campo | Qué hace |
|---|---|
| `piezas` | Lo que se ve, una detrás de otra (apartados 3 y 4). |
| `zooms` | Un encuadre por tramo del vídeo base (apartado 7). |
| `secciones` | Capítulos de arriba a la izquierda («01 PRECIO», «02 ACCESO»): `i`, `f` y `titulo`. Corto, de 8–9 letras: con más (caben 14), la pastilla roza el pelo en los planos cercanos. El número se pone solo (`num` lo cambia). Si uno empieza donde acaba otro, la pastilla se queda y cambia el texto. |
| `logos` | Clave que usas en las piezas → nombre con el que se buscó en `reel.py logos`, o una ruta dentro de `editor/public/`. |
| `marca` | Logo propio arriba a la derecha. Por defecto, el de `marca.json` (`"logo"`). `{"logo": "clave", "desde": 5.4}` lo cambia o lo retrasa; `false` lo quita. |
| `imagen` | Retoque de la grabación: `filtro` (CSS suave: contraste, saturación), `vineta` (0–0,5) y `abajo` (`oscuro` o `reflejo`). |
| `subtitulos` | Apartado 6. |
| `sonidos`, `sonidos_auto` | Apartado 5. |
| `portada` | Apartado 8. |
| `desplazarY` | Px que sube (negativo) la cara respecto al encuadre calculado. Por defecto −60: cabeza en y≈305, barbilla en y≈831, 85 px por encima de la pieza. |
| `video`, `relleno`, `anclaY` | Opcionales, como en el modo clásico. |

## 2. Lo que tienen todas las piezas

```json
{"tipo": "lista", "i": 12.4, "f": 18.9, "...": "sus datos"}
```

- **`i` y `f`:** cuándo entra y cuándo se va. Una pieza de cara entra 0,1–0,3 s antes de su primera palabra; una escena, en el corte.
- **Cada cosa de dentro tiene su `en`:** el instante en que se enciende, que es el inicio de la palabra que la nombra (o 0,02 s antes). Es lo que hace que la animación «vaya con la voz».
- **Lo que aún no se ha dicho espera apagado** (gris, logo atenuado) y se enciende en su `en`: la estructura se ve entera desde que entra la pieza y da tiempo a leerla.
- **`salida`:** segundos de fundido al irse. No hace falta ponerlo: si la pieza llega hasta una escena, `edl` lo pone a 0 y la deja entera hasta que la tapa la cortina.
- **`sonidos`:** sustituye a los sonidos automáticos de esa pieza (`[]` la deja en silencio).
- **`subtitulos`:** `false` esconde los subtítulos mientras dura; `true` los mantiene en las piezas que los esconden solas (titular, sentencia y el nombre de un revelado, porque ya son el texto).

Dos piezas de cara no pueden coincidir en el tiempo (se pisan). Una escena sí puede empezar donde acaba una pieza de cara.

## 3. Piezas del plano de cara

Van sobre el pecho (x 80–1000, y 916–1376), por debajo de la barbilla. Tres tratamientos para que no sea siempre «la misma tarjeta»: **tarjetas** para datos, **texto suelto** para frases a cámara y **piezas que se encienden** para llamar a la acción.

### `titular`: el gancho

```json
{"tipo": "titular", "i": 0, "f": 2.16, "logo": "google", "marca": "GOOGLE", "fecha": "30 SEP 2026", "marcaEn": 0.08, "golpe": 1.64,
 "lineas": [{"texto": "ACABA DE SOLTAR"}, {"texto": "UNA BOMBA", "caja": true}]}
```

- Con `i: 0` está completo desde el primer fotograma (sirve de portada del vídeo en reproducción).
- `lineas`: una o dos, de 2–3 palabras. `caja` mete la línea en la caja de acento. Si el texto es lo que se dice, cada palabra se enciende sola al sonar.
- `marca`, `logo` y `fecha` (opcionales): píldora clara con el protagonista y píldora oscura con la fecha. `marcaEn`: la píldora da un pulso al nombrarla.
- `golpe`: la caja recibe un pulso y un anillo en esa palabra.
- `tamMax` (138) y `placa` (0,72, la sombra de detrás) se suben en la portada.

### `presentacion`: el protagonista y lo que le rodea

```json
{"tipo": "presentacion", "i": 5.47, "f": 10.2,
 "propio": {"logo": "gemini", "rotulo": "NUEVO MODELO DE GOOGLE", "nombre": "GEMINI 4", "acento": "ARGON", "en": 5.63},
 "nexo": {"texto": "RIVALES", "en": 7.3},
 "items": [{"logo": "anthropic", "nombre": "ANTHROPIC", "en": 8.51}, {"logo": "openai", "nombre": "OPENAI", "en": 9.57}]}
```

- Tarjeta con logo, rótulo y nombre (`acento` va en el color de acento). `nexo` e `items` son opcionales: una banda debajo («RIVALES», «FUNCIONA CON», «INCLUYE») con 1–3 pastillas que esperan apagadas y se encienden al nombrarlas (`icono` en vez de `logo` vale).

### `columnas`: comparar de 2 a 4 valores

```json
{"tipo": "columnas", "i": 13.1, "f": 18.94, "lineaEn": 14.15, "pie": "Tareas de programación resueltas (DeepSWE v1.1) · Google",
 "columnas": [
  {"logo": "gemini", "nombre": "GEMINI 4\nARGON", "valor": 77.9, "texto": "77,9 %", "en": 13.39, "propio": true},
  {"logo": "openai", "nombre": "GPT-6\nASTRA", "valor": 74.1, "texto": "74,1 %", "en": 14.99}]}
```

- Cada columna sube al nombrarla y su cifra (`texto`) aparece al llegar arriba. `valor` da la altura.
- `lineaEn`: una línea de nivel a la altura de la columna `propio` («a la altura de…», «llega hasta aquí»).
- `pie`: qué se mide y de dónde sale, en una frase de 56 letras como mucho.

### `cambio`: antes → después

```json
{"tipo": "cambio", "i": 26.44, "f": 32.9, "titulo": "PRECIO DE LANZAMIENTO", "simbolo": "$", "ahora": "AHORA",
 "despues": {"texto": "DESPUÉS", "en": 28.82},
 "filas": [{"nombre": "ENTRADA", "ahora": "2", "despues": "4", "en": 29.86}, {"nombre": "SALIDA", "ahora": "10", "despues": "20", "en": 30.5}],
 "nota": {"texto": "EL DOBLE", "en": 31.14}, "pie": "Por millón de tokens · Datos: Google"}
```

- Primero solo la columna de ahora; al decir «después» la tabla se abre y cada cifra nueva llega cuando se dice. 1 o 2 filas, cifras de hasta 4 caracteres.
- `estado` da el color (`amber` por defecto: un aviso; `green` si el cambio es bueno; `red`), `icono` el de la cabecera, `simbolo` va delante de cada cifra, `unidad` arriba a la derecha, `nota` es una pastilla que resume el cambio.

### `sentencia`: una frase a cámara en letra grande

```json
{"tipo": "sentencia", "i": 32.98, "f": 35.86, "caja": {"texto": "AÚN NO", "en": 33.12}, "cierraEn": 33.42,
 "linea": {"texto": "DISPONIBLE", "en": 33.72}, "pie": {"gris": "PARA EL", "blanco": "PÚBLICO GENERAL", "en": 34.41}}
```

- Sin tarjeta: una caja de color con icono, una línea enorme y un pie. **Cada parte entra en su palabra**; nunca enseña una palabra antes de que suene.
- `estado`: `red` (no, por defecto), `amber` (ojo), `green` (sí), `blue`. `icono`: `candado` (por defecto; se cierra en `cierraEn`), el nombre de otro icono (`aviso`, `check`, `nube`…) o `""`.
- **Solo la caja** (sin `linea`): el remate de una frase en una palabra, más grande y con un golpe en su palabra. `{"tipo": "sentencia", "i": 5.5, "f": 6.6, "estado": "green", "icono": "check", "top": 990, "caja": {"texto": "GRATIS", "en": 5.64}}`. `top` la baja (por defecto 918). Deja los subtítulos hasta esa palabra (`partir_antes`) y, si la frase siguiente llega enseguida, pon su `f` 0,3 s después del corte para que se lea (no alargues el silencio): los subtítulos vuelven solos en el corte (`"subtitulos_hasta": 6.2` lo fija a mano).

### `campo`: algo pendiente que se resuelve

```json
{"tipo": "campo", "i": 42.93, "f": 50.44, "titulo": "PRÓXIMAMENTE",
 "campo": {"rotulo": "FECHA", "huecos": "– –  /  – –  /  – – – –", "valor": "SIN FECHA", "en": 49.06},
 "vias": {"rotulo": "LLEGARÁ A", "en": 45.4, "items": [{"icono": "codigo", "texto": "API", "en": 45.73}, {"logo": "google", "texto": "PLAN ULTRA", "en": 47.61}]}}
```

- Un campo vacío que espera (`huecos`) y se resuelve (`valor`) cuando se dice. `estado` del resultado: `amber` por defecto, `green`, `red`. `icono` (cabecera) y `campo.icono` (junto al valor).
- `vias` (opcional): la tarjeta crece y aparecen 1–2 pastillas al mismo nivel, que se encienden al nombrarlas.

### `pregunta`: la pregunta al espectador

```json
{"tipo": "pregunta", "i": 50.57, "f": 55.66, "rotulo": "LA PREGUNTA", "rotulo2": {"texto": "¿SE UNE A LA PELEA?", "en": 53.1},
 "grupo": {"fijos": [{"logo": "openai"}, {"logo": "anthropic"}], "nuevo": {"logo": "google", "aparece": 51.88, "seUne": 52.6}},
 "opciones": [{"texto": "SÍ, POR FIN", "en": 53.9, "principal": true}, {"texto": "TODAVÍA NO", "en": 54.2}]}
```

- Dos respuestas que esperan apagadas y se encienden al final: invitan a comentar. Una respuesta larga se parte en dos líneas.
- `rotulo2` (opcional): el rótulo cambia a la pregunta resumida cuando se dice (su `en`, en la palabra en que acaba de decirse, no antes). `grupo` (opcional): logos en fila a los que llega uno nuevo y se une.

### `comenta`: «déjamelo en los comentarios»

```json
{"tipo": "comenta", "i": 55.76, "f": 57.48, "texto": "Yo creo que…", "escribirEn": 55.94}
```

- Una caja de comentario en la que se escribe el arranque de la respuesta o la palabra que hay que comentar. `boton` («Publicar») y `cps` (14 letras por segundo).

### `acciones`: el cierre

```json
{"tipo": "acciones", "i": 57.6, "f": 62.4, "items": [
 {"icono": "corazon", "texto": "ME GUSTA", "en": 58.98, "estado": "red", "relleno": true},
 {"icono": "enviar", "texto": "COMPARTE", "en": 59.62}, {"icono": "seguir", "texto": "SÍGUEME", "en": 60.96}]}
```

- 2 o 3 tarjetas que esperan en gris y se encienden al decirlas. `f` puede pasar del final del vídeo.

### `lista`: ventajas, pasos o requisitos

```json
{"tipo": "lista", "i": 2.0, "f": 5.9, "titulo": "LO QUE NECESITAS", "icono": "llave", "items": [
 {"icono": "reloj", "texto": "Diez minutos", "sub": "Sin instalar nada", "en": 2.6},
 {"icono": "dinero", "texto": "Cuenta gratuita", "en": 3.4}]}
```

- De 2 a 4 filas que se ven desde el principio y se encienden con su visto bueno. `sub` y `titulo` opcionales; `logo` en vez de `icono` vale, en cada fila y en la cabecera (`"logo": "muse"` junto a `titulo`); `"numeros": true` pone 1, 2, 3 (pasos). Con 4 filas y título, las filas son más bajas y no cabe `sub`.

### `logos`: herramientas en fila

```json
{"tipo": "logos", "i": 10.0, "f": 13.9, "rotulo": "FUNCIONA CON", "items": [
 {"logo": "claude", "nombre": "Claude", "en": 10.6}, {"logo": "openai", "nombre": "ChatGPT", "en": 11.3}]}
```

- De 2 a 4 huecos vacíos; cada logo salta al nombrarlo. `nombre` y `rotulo` opcionales.

## 4. Escenas a pantalla completa

La voz sigue y la cara desaparece: un fondo oscuro con algo que se entiende mejor viéndolo. Entran con una cortina que tapa el corte; pon `i` y `f` en puntos de corte.

### `revelado`: la fuente real y el nombre

```json
{"tipo": "revelado", "i": 2.2, "f": 5.44, "etiqueta": "ANUNCIO OFICIAL", "logoEtiqueta": "google",
 "captura": {"src": "reels/<reel>/media/fuente.jpg", "ancho": 1800, "alto": 2226, "dominio": "blog.google", "ruta": "/…/gemini-4-argon", "scrollEn": 3.15, "scrollDur": 1.5},
 "logo": "gemini", "linea1": [{"t": "GEMINI", "en": 3.68}, {"t": "4", "en": 4.24}], "linea2": {"t": "ARGON", "en": 4.92}}
```

- La página oficial en una ventana de navegador (la barra de direcciones es la fuente) con un desplazamiento suave, y debajo el nombre, que entra palabra a palabra. `linea2` (opcional) es la palabra grande con brillo.
- La captura se hace con `reel.py captura <reel> <url>` (imprime `ancho` y `alto`).

### `escena`: un titular y uno o varios cuerpos

```json
{"tipo": "escena", "i": 19.0, "f": 26.4, "titulo": "¿CUÁNTO *CUESTA*?",
 "sub": {"gris": "Precio de la API", "blanco": "por millón de tokens", "blancoEn": 23.6},
 "cuerpos": [
  {"tipo": "monedas", "pie": "Datos: Google, OpenAI y Anthropic", "pilas": [
    {"logo": "openai", "nombre": "GPT-6\nASTRA", "n": 5, "en": 20.42}, {"logo": "gemini", "nombre": "GEMINI 4\nARGON", "n": 1, "en": 19.66, "propio": true}]},
  {"tipo": "flujo", "en": 22.34, "simbolo": "$", "pie": "Datos: Google",
   "entrada": {"icono": "lapiz", "titulo": "ENTRADA", "desc": "Lo que tú le escribes", "valor": "2", "en": 22.74},
   "nodo": {"logo": "gemini", "nombre": "GEMINI 4 ARGON"},
   "salida": {"icono": "respuesta", "titulo": "SALIDA", "desc": "Lo que te responde", "valor": "10", "en": 25.32}}]}
```

- **`titulo`:** la pregunta que se hace el espectador o el marco de lo que viene («EL *RESULTADO*»), en una o dos líneas (`\n`); entre asteriscos, la palabra en el color de acento. No las palabras que está diciendo la voz: repetiría el subtítulo y se adelantaría a ella.
- **`sub`** (opcional): una línea de apoyo; la parte `blanco` se enciende en `blancoEn`.
- **`cuerpos`:** lo que hay debajo. Si hay varios, se relevan: cada uno entra en su `en` y el anterior se va; el titular se queda. Cada cuerpo puede llevar su `pie` (la fuente).

| Cuerpo | Para qué | Datos |
|---|---|---|
| `monedas` | Una proporción que se ve contando (5 monedas frente a 1) | `pilas` (2–3): `logo`, `nombre`, `n`, `en`, `propio`; `paso` (0,11 s entre monedas) |
| `flujo` | Un mecanismo: lo que entra → el protagonista → lo que sale | `entrada` y `salida`: `icono`, `titulo`, `desc`, `valor`, `en`; `nodo`: `logo` o `icono` y `nombre`; `simbolo` |
| `filas` | Responder a la pregunta con 2–4 filas que se encienden | `filas`: `logo` o `icono`, `titulo`, `sub`, `en`; `"bloqueado": true` marca en rojo lo que se queda fuera |
| `ventana` | Enseñar una web o una app real | `captura` (como en `revelado`) |

## 5. Sonidos

Un sonido discreto por cada cosa que entra, y golpes graves solo en lo importante. **`edl` los pone solos** según la pieza:

| Pieza | Sonidos automáticos |
|---|---|
| `titular` | golpe en `golpe` |
| `revelado` | barrido al entrar, tick por palabra, swell + golpe grave + brillo en `linea2` |
| `presentacion` | aire al entrar la tarjeta y la banda, tick por pastilla |
| `columnas` | aire, tick suave y golpe corto por columna, barrido en la línea |
| `cambio` | aire al entrar y al abrirse, tick por cifra, tick suave en la nota |
| `sentencia` | aire, clic y descarte al cerrarse el candado, golpe corto en la línea, tick suave en el pie |
| `campo` | aire, tick por vía, descarte al resolverse |
| `pregunta` | aire, tick al aparecer el nuevo, golpe corto al unirse, tick por respuesta |
| `comenta` | aire y tecleo mientras se escribe |
| `acciones` | aire, tick por acción y clic + nota doble en la última |
| `lista`, `filas` | tick + nota por fila |
| `logos` | tick por logo |
| `escena` | barrido al entrar, aire al relevar un cuerpo, aire de salida; `monedas`: dos ticks y golpe corto en la última; `flujo`: golpe corto en cada cifra |

Para añadir o cambiar:

- **Extras:** `"sonidos": [["bip", 26.54, 0.9], ["tecleo", 56.0, 0.7, 0.98]]` en la raíz del guion → nombre, instante en que cae el golpe, volumen y, opcional, a los cuántos segundos se corta. Por ejemplo, un `bip` en un «ojo».
- **Otros para una pieza:** `"sonidos": [...]` dentro de ella (sustituyen a los suyos).
- **Sin automáticos:** `"sonidos_auto": false`.
- Nombres disponibles (ficha en `editor/public/sfx2/sonidos.json`): `golpe`, `golpe-corto`, `golpe-grave`, `impacto`, `aire`, `aire-salida`, `barrido`, `transicion`, `tick`, `tick-suave`, `click`, `descarte`, `bip`, `nota`, `nota-doble`, `campana`, `ping`, `brillo`, `swell`, `subida`, `tecla`, `tecleo`, `notificacion`, `fallo`, `corte`, `glitch`, `glitch-fuerte`, `pop` (este último, mejor no: suena a dibujos animados).
- `reel.py sonido <reel>` compara cada efecto con la voz: golpes 6–14 dB por debajo; ticks, 12–20. Si marca uno como fuerte, baja su volumen.

## 6. Subtítulos

56 px, una o dos líneas de hasta 18 letras, siempre en y 1400; la palabra que suena va en el color de acento. Se paginan solos (una página no cruza un corte ni una frase). Para afinar, por **número de palabra** (el `[n]` de la tabla de `alinear`):

| Campo | Qué hace |
|---|---|
| `partir_antes` | Empieza página antes de esas palabras (para que cada página tenga sentido). En una enumeración que una pieza va encendiendo, cada elemento en su página: si no, el subtítulo enseña los nombres antes que la pieza. |
| `no_partir_antes` | Evita el salto de página antes de esas palabras. |
| `textos` | Cambia cómo se escribe una palabra: `{"121": "¿Y", "137": "potentes?", "66": "Ojo,", "155": "de seguirme"}` (signos, comas, una palabra que se comió al hablar: se añade a la palabra siguiente, para que la línea no acabe en «de»). |
| `destacar_idx`, `destacar` | Palabras siempre en el color de acento (por número o por texto). Con cuentagotas. |
| `grande` | `[[10.24, 12.36]]`: tramos con subtítulo grande (78 px), para el primer plano sin pieza. |
| `sin` | `[[a, b]]`: tramos sin subtítulos (además de los que se esconden solos). |
| `max_linea`, `max_dur`, `tam`, `tam_grande` | 18 letras, 2,3 s, 56 px y 78 px. |

`reel.py edl` imprime todas las páginas: léelas una a una.

## 7. Encuadres (zooms)

Uno por tramo: `[escala al empezar, escala al acabar, ancla]`. El encuadre solo cambia en los cortes; dentro del tramo hay un empuje muy lento.

- **Ancla `barbilla`** (por defecto): la cara crece hacia arriba y nunca baja hacia la pieza. Para planos con pieza: 1,0–1,035 (abierto) y 1,06–1,14 (más cerca).
- **Ancla `"cara"`:** el centro de la cara. Solo para el primer plano **sin pieza** (1,17–1,2).
- Alterna abierto y cerca para que cada corte se note como un cambio de plano. Los tramos que tapa una escena, `[1.0, 1.0]`.

## 8. Portada

```json
"portada": {"t": 61.6, "zoom": 1.0, "titular": {"logo": "google", "marca": "GOOGLE", "tamMax": 190, "placa": 0.93,
            "lineas": [{"texto": "GEMINI 4"}, {"texto": "ARGON", "caja": true}]}}
```

- `t`: un fotograma en el que salga bien (ojos abiertos, boca cerrada o sonriendo). `titular`: como la pieza, con letra más grande (`tamMax` 190) y sombra más fuerte (`placa` 0,93).
- `reel.py portada <reel>` deja `salida/<reel>_portada.jpg`. Va sin el logo de arriba (queda cortado en el recorte 3:4 del perfil, y 240–1680); `"marca": true` lo mantiene.

## 9. Piezas propias

El catálogo no es una lista cerrada. Si una idea del guion pide otra cosa (un medidor, un mapa, un calendario, una conversación), **diseña una pieza nueva**: así cada reel tiene algo suyo. Van en `editor/src/pro/propias.tsx`, que `preparar` crea una vez y no vuelve a tocar.

```tsx
import React from 'react';
import {useT} from '../componentes/comun';
import {C} from '../tema';
import {Cabecera, Ficha, Pie} from './base';
import {ZONA, clamp01, rampa, sale, titular} from './sistema';

// Medidor: una barra que se llena hasta un porcentaje cuando se dice
const Medidor: React.FC<{i: number; f: number; titulo: string; valor: number; texto: string; en: number; pie?: string; salida?: number}> = ({
	i, f, titulo, valor, texto, en, pie, salida,
}) => {
	const {t} = useT();
	const p = sale(rampa(t, en, en + 0.7));
	return (
		<Ficha i={i} f={f} alto={pie ? 312 : 262} salida={salida}>
			<Cabecera icono="chart" titulo={titulo} />
			<div style={{position: 'absolute', left: ZONA.pad, right: ZONA.padDer, top: 120, height: 56, borderRadius: 28, background: '#0a0e15', border: `1.5px solid ${C.line2}`, overflow: 'hidden'}}>
				<div style={{width: `${valor * p}%`, height: '100%', background: `linear-gradient(90deg, ${C.blue2}, ${C.blue})`}} />
			</div>
			<span style={{position: 'absolute', left: ZONA.pad, top: 192, ...titular(54, {color: C.text}), opacity: clamp01(p * 2)}}>{texto}</span>
			{pie ? <Pie texto={pie} style={{position: 'absolute', left: ZONA.pad, bottom: 18}} /> : null}
		</Ficha>
	);
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const CARA: Record<string, React.FC<any>> = {medidor: Medidor};
export const ESCENAS: Record<string, React.FC<any>> = {};
export const CUERPOS: Record<string, React.FC<any>> = {};
```

Y en el guion: `{"tipo": "medidor", "i": 12.4, "f": 16, "titulo": "PRECISIÓN", "valor": 87, "texto": "87 %", "en": 13.1, "sonidos": [["aire", 12.54, 0.6], ["golpe-corto", 13.8, 0.4]]}`.

- **Bloques** (`./base`): `Ficha` (tarjeta sobre el pecho), `Cabecera`, `IcoCuadro`, `Chip`, `Pastilla`, `Cerrojo`, `Pie`, `Placa` (sombra para texto suelto), `Escena`, `TituloEscena` y `Ventana`. **Ayudas** (`./sistema`): zonas (`ZONA`, `ESCENA`, `SUBS`), `resorte`, `enciende`, `rampa`, `latido`, `vida`, `titular`, `rotulo`, `tituloFicha`, `cuerpo`, `ajustar`, `partir2`. Iconos: `Ico` (`./iconos`).
- **Tres sitios donde apuntarla:** `CARA` (sobre el pecho), `ESCENAS` (pantalla completa: envuelve el contenido en `<Escena i={i} f={f}>` y pon `"pantalla": true` en el guion) y `CUERPOS` (un cuerpo nuevo para `escena`; recibe `y0`, `y1`, `desde` y `logos`).
- **Mismas reglas que las del catálogo:** cada cosa con su `en`; lo que espera, apagado; letra de 26 px o más (`TXT.min`); nada que leer más allá de x≈940 por debajo de y≈1000; nada sobre la cara; nada inclinado ni que parpadee.
- Una pieza propia no tiene sonidos automáticos: ponle `"sonidos"`.
- Si sirve para más reels, pásala a `<skill>/plantilla/src/pro/` (y a este catálogo) y díselo al usuario.
- Un `tipo` que no existe sale en los fotogramas como un aviso rojo «Pieza desconocida».

**Ejemplo real de piezas propias:** `ejemplos/propias_muse.tsx` (con su guion, `ejemplos/guion_pro_muse.json`) trae las seis que se hicieron para el reel de Muse, el agente de Meta. Sirven de modelo y se pueden copiar a `propias.tsx` y adaptar; no las repitas tal cual en otro reel.

| Pieza | Dónde | Qué hace |
|---|---|---|
| `contraste` | cara | «No es esto, es esto otro»: dos filas; la que NO es entra en rojo con su aspa y se atenúa al llegar la que SÍ es |
| `pasos` | cara | Tres pasos en fila y una barra de progreso que sigue avanzando sola («lo dejas trabajando») |
| `conexiones` | cuerpo | El protagonista arriba y sus apps debajo: cada una se conecta con un cable al nombrarla; banda «y más» |
| `galeria` | cuerpo | Cuatro cosas en 2×2, cada una con su dibujo, que «se hace» al nombrarla (app, documento, imagen, vídeo) |
| `ranking` | cuerpo | Línea de tiempo entre dos fechas y una lista de tienda en la que el protagonista sube al n.º 1 |
| `mapa` | cuerpo | Mapa de puntos (de América a Europa) en el que solo se enciende un país; necesita `mapa_puntos.json` |

Iconos disponibles (`icono`): `check`, `x`, `escudo`, `gobierno`, `codigo`, `corazon`, `enviar`, `seguir`, `comentario`, `guardar`, `calendario`, `usuarios`, `usuario`, `flecha`, `aviso`, `lapiz`, `respuesta`, `pregunta`, `etiqueta`, `llave`, `reloj`, `rayo`, `mundo`, `buscar`, `descarga`, `enlace`, `dinero`, `regalo`, `play`, `micro`, `sube`, `baja`, `chip`, `ojo`, `avion`, `carrito`, `nube`, `diana`, `trofeo`, `pin`, `apps`, `mas`, `apagar`, `documento`, `girar`, y los del modo clásico (`file`, `form`, `mail`, `db`, `folder`, `chart`, `image`, `video`, `megaphone`, `share`, `euro`, `git`, `brain`, `server`, `monitor`, `smartphone`, `scissors`, `zoom`, `type`, `volume`). Para añadir uno: un icono de Lucide en `plantilla/src/pro/iconos.tsx`. Nada de destellos ni varitas.

## 10. Reglas de tiempos

- **Cada `en` es el inicio de su palabra** (o hasta 0,05 s antes). La tabla de sincronía de `edl` lo comprueba: cada línea dice qué palabra suena en ese instante y cuánto falta. Un «¿suelto?» es un tiempo que no cae en ninguna palabra.
- **Una pieza de cara entra 0,1–0,3 s antes** de lo primero que enseña, para no aparecer vacía.
- **Una escena empieza en un corte.** La cortina arranca 0,1 s antes y tapa el salto. Lo normal es que acabe en otro corte, pero puede alargarse hasta medio segundo sobre el principio de la frase siguiente (un corte en J: se oye «Y lo mejor:» mientras aún se ve la escena): así lo último que entró se lee, y el corte queda tapado.
- **Lo último que entra tiene que verse al menos 1 s** antes de que la pieza se vaya (`edl` avisa). Si no llega, que al menos la estructura se haya visto entera, apagada, desde antes.
- **Entre dos piezas de cara, 0,1 s de aire.** Hay tramos sin pieza a propósito: el primer plano.
- **Si cambias los cortes con el guion ya escrito:** `reel.py recolocar <reel>` mueve todos los tiempos, y después `alinear` y `edl`.
