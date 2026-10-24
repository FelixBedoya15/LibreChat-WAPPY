---
name: animaciones-horizontal-cara
description: "Monta vídeos horizontales para YouTube (4K o 1080p a 60 fps) desde una grabación de Josema hablando a cámara: quita las pausas y las tomas repetidas y alterna planos de su cara con animaciones a pantalla completa (nunca encima de él), sincronizadas palabra a palabra con su voz, que suena continua. Transcribe la toma, alinea cada palabra, corta en fotogramas exactos, reparte los planos (intro con gancho, o explicación de conceptos con ~65 % de animación), verifica los datos en fuentes oficiales y usa logos oficiales, logos que se escriben a mano y mapas en puntos. Úsala SIEMPRE que pase un vídeo suyo a cámara (mp4) y pida quitar pausas e intercalar animaciones con su cara, una intro de YouTube «natural» o algo «como la intro de Muse» o «como la explicación de Muse», aunque no diga cómo; también para retocar o volver a montar algo hecho con ella. Con capas encima de su vídeo, efectos o música: animaciones-horizontal-combinadas; solo audio: animaciones-horizontal-voz; reels verticales: editor-reels."
---

# Cara ↔ animación: grabación a cámara sin pausas con animaciones intercaladas

Josema (canal de YouTube en español sobre IA, agentes y herramientas) se graba hablando a cámara en su estudio
(4K 60 fps) y te pasa el MP4: la intro de un vídeo o la parte que explica los conceptos. Le entregas ese tramo
montado: **sin pausas ni tomas repetidas**, alternando **planos de su cara** con **animaciones a pantalla completa**
(nunca encima de su cara), con **su voz continua** de principio a fin y cada animación clavada a la palabra que la
dispara, con los logos oficiales de lo que nombra y los datos comprobados. «Tipo intro de YouTube, de forma natural».

Dos entregas aprobadas marcan el listón (`ejemplos/`): la intro de Muse (38 s, «está perfecto») y la explicación que
va justo después (75 s, «está espectacular»). Son el listón, no una plantilla: de ellas se reutilizan el método, el
ritmo y las piezas, pero cada vídeo lleva sus propias escenas, sacadas de lo que dice. Lo que valora, por este orden:
que **cada animación vaya exacta con su voz**, que el ritmo sea natural, que se entiendan los conceptos y **los
nombres de cada herramienta**, y que logos y datos sean los reales. Quiere el vídeo terminado: decide tú (reparto de planos, recursos, colores, tiempos), no le
preguntes nada técnico y explica tus decisiones al final. Pregunta solo si falta la grabación o si de verdad no se
entiende qué hay que mostrar.

`<skill>` es la carpeta de esta skill. Los comandos se lanzan desde la carpeta del proyecto (salvo `entorno` y `nuevo`).

## Flujo

```
python <skill>/scripts/anim.py nuevo <Animaciones>/<nombre> --video <grabación.mp4>      (y cd a esa carpeta)
python <skill>/scripts/anim.py transcribir --nombres "Muse, Meta, WhatsApp"   → corrige edicion/guion.txt
python <skill>/scripts/anim.py alinear --toma      → palabras de la grabación original (edicion/tiempos.json)
python <skill>/scripts/anim.py cortar              → voz sin pausas, cortes, proxy 720p, encuadre del plano corto
python <skill>/scripts/anim.py alinear             → palabras de la voz cortada (trabajo/tiempos.json) → T
python <skill>/scripts/anim.py planos              → fotograma de cada palabra; reparte cara/animación en edicion/montaje.json
   (datos y logos · guion visual · escenas en index.html · revisar)
python <skill>/scripts/anim.py montar --res 1080   → borrador: ritmo, cortes y sincronía
python <skill>/scripts/anim.py montar              → final a la resolución de la toma (4K 60 fps)
```

Todo lo del montaje vive en `edicion/`; la animación, en `index.html` + `assets/` + `trabajo/`. Detalle de cada paso,
reglas de corte y de reparto y errores ya resueltos: `references/montaje.md`.

## 0. Entorno

`python <skill>/scripts/anim.py entorno` comprueba ffmpeg, Node 18+, Chromium de Playwright, faster-whisper,
torch/torchaudio, OpenCV, Pillow y la GPU. Si falta algo: `anim.py entorno --instalar` (dile antes qué vas a instalar
y para qué; Whisper large-v3 pesa ~3 GB y el modelo de alineación 1,2 GB, se descargan la primera vez). `logo-trazo`
y `mapa` usan además scipy, scikit-image y matplotlib (opcionales; `--instalar` los pone).

## 1. Crear el proyecto

Cada vídeo tiene su carpeta `Animaciones/` dentro de `Videos Canal YouTube/<Vídeo>/` (la de Muse:
`Videos Canal YouTube/Muse_Meta/Animaciones/`); cada tramo grabado es un proyecto dentro (`muse-intro`,
`muse-explicacion`). Si no existe, créala junto al resto del material del vídeo.

`anim.py nuevo <carpeta> --video <grabación>` copia la plantilla (motor, renderizador, fuentes, herramientas), guarda
la toma en `edicion/fuente.json` (tamaño, fps exactos) y su audio en `edicion/toma.wav`, e instala playwright-core.

## 2. Qué dice

`anim.py transcribir --nombres "..."` deja el texto de la toma en `edicion/guion.txt` (la última transcripción queda
siempre en `guion_whisper.txt`). **Corrígelo** antes de seguir:
- una frase por línea, con los nombres y cifras como deben verse en pantalla («Muse Spark», «Claude Code», «3 %»);
  Whisper se equivoca en nombres propios: contrasta con el contexto del vídeo y con la web;
- **tomas repetidas o arranques fallidos**: se quedan en el guion (se dicen, y el alineador necesita el texto real),
  cada uno en su línea, con `~` al principio de la línea que sobra; la buena suele ser la última;
- borra un «Gracias.» final si no lo dijo (Whisper se lo inventa en el silencio) y la palabra duplicada en el cambio
  de segmento («se integra con | con tu trabajo»): si al alinear una sale con puntuación ≈ 0 y muy corta, no se dijo.

Después lee el guion entero y entiende el argumento: qué presenta, qué compara, qué promete, qué conclusión deja.

## 3. Tiempos y pausas

- `anim.py alinear --toma` mide cada palabra en la toma original (alineación forzada; Whisper va 0,2–0,45 s adelantado:
  **nunca uses sus tiempos para sincronizar**). Palabras con `?` en una frase normal = el guion no coincide ahí.
- `anim.py cortar` deja cada frase como un bloque de voz con márgenes (0,09 s antes, 0,13 s después), respeta las
  pausas de menos de 0,55 s, corta en fotogramas exactos con fundidos de 8 ms y calcula el encuadre del plano corto
  (cara). Si al final se gira o alarga la mano, `--fin <segundo de la toma>`. Muse: 144 s → 75 s.
- `anim.py alinear` sobre la voz cortada → `trabajo/tiempos.json`. Copia al objeto `T` del `index.html` los inicios de
  las palabras que disparan algo (`T.openclaw = 5.04`). `anim.py envolvente <palabra|índice>` comprueba anclas dudosas.
Pronunciaciones raras (`WhatsApp{guasap}`), puntuaciones y la última palabra: `references/sincronia.md`.

## 4. Datos y logos

- Lista las entidades (productos, empresas, modelos con versión, precios, límites, países) y **verifícalas en fuentes
  oficiales** con WebSearch/WebFetch (abre el anuncio o la documentación, no te quedes con el resumen). Si la voz
  redondea, muestra el dato real sin contradecirla; si dice algo falso, no lo pongas como hecho y avísale. Si una cifra
  no es fiable, dibújala sin números («casi al nivel de los mejores»). Apunta las fuentes con fecha.
- Logos: `anim.py logos "WhatsApp" "Instagram" "Gmail"` → `assets/logos/` listos para fondo oscuro; revísalos con
  `anim.py ver-logos`. Ya preparados en la skill: el icono de Muse vectorizado y el logotipo completo de Meta
  (`anim.py recursos muse metalockup`). En la animación: `logo('slug', tamaño)`, `tarjeta({logo: 'slug', ...})`.
- Logo de un trazo que se escribe a mano (la «m» de Muse): `anim.py logo-trazo icono.png`. Mapa del mundo en puntos
  («solo en Estados Unidos», «desde cualquier país»): `anim.py mapa --marcar USA,ESP`. Iconos de Lucide que falten:
  `anim.py iconos nombre-en-lucide` (nunca de memoria).
Detalles, colores de marca y trampas conocidas: `references/datos-y-logos.md`.

## 5. Repartir los planos

`anim.py planos` imprime cada palabra de la voz cortada con su fotograma y los saltos de la toma. Escribe los planos en
`edicion/montaje.json` (`{"tipo": "cara", "f0", "f1", "zooms": [1.0, 1.22]}` / `{"tipo": "anim", "f0", "f1", "id"}`,
seguidos de 0 al total) y vuelve a lanzar `planos` para que avise de cortes dentro de palabras, planos cortos o huecos.
- **Intro**: empieza en cara con el gancho y corta a la animación **en el nombre del producto** («Meta acaba de lanzar»
  → corte → «Muse»); ~60 % animación, media ~4 s por plano; termina en cara.
- **Parte que explica conceptos**: ~65 % animación, media ~6 s; la cara para las bisagras («Lo primero que tienes que
  saber es que…»), las repeticiones, las promesas («te voy a enseñar…») y el cierre. Dos ideas seguidas en animación
  van en la misma ventana con una transición dentro. Si la parte anterior acabó en plano completo, empieza en corto.
- Animación para lo que se entiende mejor viéndolo: el producto y su logo, comparaciones, conexiones, datos, mapas,
  listas. Cara para lo personal. Cara ≥ 1,5 s; animación nueva ≥ 2,4 s (una que vuelve, 1,7 s).
- Cortes secos en el hueco entre dos palabras (`floor((inicio − 0,03) × fps)` de la palabra que dispara la animación) o
  en un salto de la toma. En los saltos dentro de un plano de cara se alterna plano completo y plano corto (`zooms`).
Tablas de los dos montajes aprobados y el porqué de cada regla: `references/montaje.md` § 3.

## 6. Guion visual

Antes de programar, escribe la tabla (va luego al README y al mensaje final):

| t (s) | Plano | Voz | Pantalla |
|---|---|---|---|
| 4,0–12,2 | **Animación** | «similar a OpenClaw o Hermes…» | tarjeta de Muse; ≈ OpenClaw al decirlo; ≈ Hermes… |

- **Una idea visual por frase**, que entra 0,02–0,05 s antes de su palabra. Nada quieto más de ~2 s.
- **Busca el dibujo del concepto, no el texto**: «es como X o Y» → tarjetas con «≈»; «no se trata de X» → X pierde el
  color y se tacha; límites → medidor; «a base de clic» → cursor que pulsa «Conectar»; «vive en la nube» → nube con la
  máquina dentro; disponibilidad → mapa. Catálogo completo en `references/diseno.md` § 5.
- **Nunca un hueco vacío** entre dos ideas: lo siguiente entra mientras sale lo anterior; la misma tarjeta viaja de
  una idea a otra en vez de desaparecer. Protagonistas como tarjetas con logo y nombre grande (≥ 60 px).
- Nada de subtítulos: chips de 3–5 palabras como mucho. La pista es solo su voz (él mezcla en su edición).

## 7. Construir las escenas

Trabaja en el `index.html` del proyecto: conserva el motor y sustituye todo lo marcado como DEMO. Cada fotograma es
una función pura de `t` (`put()`, `off()`, `P()`, `KF()`/`norm()`); API, piezas incluidas y errores conocidos en
`references/motor.md`. Lo propio de este formato:
- La plantilla lee `edicion/montaje.json`: `V.<id> = {a, b}` es la ventana en segundos de cada plano de animación.
  Cada escena se pinta dentro de la suya y apaga todo fuera: `if (!dentro(t, V.trio)) { ...; return; }`.
- **El primer fotograma de cada ventana ya tiene contenido**: las entradas empiezan 0,1–0,45 s antes del corte.
- `camara(t)` añade sola un asentamiento 1,06 → 1 al entrar en cada ventana; `fijo(t, x, y, s)` deja un rótulo quieto
  en pantalla aunque la cámara se mueva.
- De `ejemplos/muse-explicacion.html` (o `muse-intro.html`) copia la estructura de escenas por ventana y las piezas
  que encajen con lo que dice: ficha de app con logo que se escribe, medidor de uso, tarjetas descartadas que se
  apagan, panel de conectores con cursor, nube, barras «casi», mapa en puntos. Índice en `ejemplos/README.md`.

Previsualización: `node server.mjs` → http://127.0.0.1:5178/ (espacio, flechas, `?t=12.5`). En los planos de cara se
ve la grabación sin pausas (proxy) con el encuadre del montaje; arriba a la derecha, «CARA · 1.22» o «ANIM · id».

## 8. Revisar antes de montar

`anim.py revisar 4.1 5.3 7.4 ...` → hoja de contactos en `trabajo/revision/`. Elige el primer fotograma de cada
ventana, los instantes en que cada escena está completa, 2–3 dentro de cada transición y las palabras clave; mira
además 2–3 fotogramas **a tamaño real**. Repasa la lista de `references/diseno.md` § 8 (nombres oficiales y legibles,
logos correctos, cada cosa con su palabra, nada cortado ni superpuesto, cifras iguales a la fuente).

## 9. Montar y entregar

1. `anim.py montar --res 1080` (Muse, 75 s con 48 s de animación: ~8 min) y `anim.py planos --hoja out/<x>.mp4`: hoja
   con el fotograma de antes y el de después de cada corte (`trabajo/revision/cortes.png`): la cara no se corta en el
   plano corto, cada animación ya tiene contenido en su primer fotograma, no hay saltos raros.
2. `anim.py comprobar out/<x>.mp4 --palabras`: un fotograma 0,12 s después de cada palabra de `T`; lo que dispara ya
   tiene que estar entrando.
3. Final: `anim.py montar --nombre <Tema>_<parte>` (a la resolución de la toma; Muse 4K: ~26 min, lánzalo en segundo
   plano). Solo se renderizan las ventanas de animación; la grabación se recorta y se une sin recodificar dos veces.
4. Copia el MP4 a la raíz de `Animaciones/` (`Muse_explicacion_2160p60.mp4`) y haz la versión 1080p reescalando la 4K
   (comando en `references/montaje.md` § 5). Mide el volumen integrado de la voz y dilo (Muse: −19 LUFS).
5. `README.md` en el proyecto: tabla tiempo · plano · voz · pantalla, decisiones, datos con fuentes, logos y cómo
   rehacerlo. Envía la versión 1080p con SendUserFile (más de 30 MB solo le llega en la app de escritorio: díselo).
6. Mensaje final, corto: la tabla, lo que has decidido tú, cualquier discrepancia entre la voz y los datos, y las fuentes.

## Iterar con el feedback

- Cambios de este vídeo (un corte, un plano, un tiempo, un texto): edita `edicion/montaje.json` o `index.html` y vuelve
  a montar. `montar --reusar` no vuelve a renderizar las ventanas que ya tienen su tamaño y largo: úsalo si solo cambian
  planos de cara; si cambias una escena, borra antes su `out/planos/<alto>/anim_<id>_bruto.mp4`.
- Guarda la versión anterior (vídeo e `index.html`) antes de rehacer algo: compara y a veces vuelve atrás.
- Si da feedback sobre el ritmo o el reparto de planos, apúntalo en `references/montaje.md` § 3; si rechaza o pide
  cambiar un recurso visual para siempre, cámbialo en `plantilla/` o en `references/diseno.md`.
- Si un vídeo nuevo sale especialmente bien, añade su `index.html` a `ejemplos/` con su tabla en `ejemplos/README.md`.

## Referencias

- `references/montaje.md`: quitar pausas, repartir planos cara ↔ animación, ventanas, montar, revisar y errores resueltos.
- `references/sincronia.md`: transcribir, corregir, alinear (toma y voz cortada) y usar los tiempos.
- `references/diseno.md`: estética, color, legibilidad, ritmo, catálogo voz → recurso, cámara, lista de revisión.
- `references/motor.md`: el motor de la plantilla, sus piezas, las ventanas del montaje y los errores conocidos.
- `references/datos-y-logos.md`: verificación de datos, buscador de logos, recursos ya preparados y colores de marca.
- `ejemplos/README.md`: las entregas aprobadas, escena por escena, con dónde está cada pieza en su código.


---

## Directrices Cinéticas Obligatorias en Todas las Escenas (Las 5 Leyes de Movimiento)

1. **Curvas con Rebote (`E.spring`, `E.back`, `step(tau, w, z)`):** Toda entrada de tarjetas, chips, nodos, insignias y botones debe usar curvas con rebote elástico y sobreimpulso físico. Nunca uses interpolación lineal para colocar elementos.
2. **Entradas Escalonadas (`Stagger`):** Cuando entren varios elementos (tarjetas, barras, nodos de flujo, listas o botones), haz que entren **uno después de otro** con un desfase de `0.08 s` a `0.15 s` (`t0 + i * 0.12`).
3. **Parallax de 3 Planos (Fondo, Medio y Frente a Distintas Velocidades):** Separa siempre los elementos en 3 capas de profundidad y muévelos a distinta velocidad respecto a la cámara: **Fondo (`0.25x`)**, **Medio (`1.0x`)** y **Frente (`1.45x`)**.
4. **Micro-Movimientos Constantes:** Una vez que una pieza entra en escena, nunca la dejes congelada. Aplícale flotación continua suave (`Math.sin(t * 2.2 + i)`), ligera rotación orgánica y respiración de brillo/escala.
5. **Efecto Sable Láser cuando Haya Manos:** Siempre que en la grabación aparezcan las manos del presentador gesticulando o señalando, traza un efecto de **Sable Láser / Haz de Plasma** (núcleo blanco incandescente `#ffffff` + halo neón con `feGaussianBlur`, vibración rápida `flicker` y chispas en la mano) siguiendo la mano fotograma a fotograma.
