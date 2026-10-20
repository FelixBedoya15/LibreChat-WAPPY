---
name: editor-reels
description: Edita reels verticales (Instagram, TikTok, Shorts) de una persona hablando a cámara, con motion graphics profesionales hechos con Remotion y sincronizados palabra a palabra con la voz. Quita pausas y tomas repetidas, reencuadra a 9:16 sin tapar nunca la cara, alterna plano de cara con pieza, escenas a pantalla completa y primer plano, hace aparecer cada dato, logo o cifra en la sílaba en que se dice, enseña la fuente real de una noticia, verifica los datos, pone subtítulos, capítulos, efectos de sonido y portada. Úsala SIEMPRE que el usuario quiera editar un reel o un vídeo corto o vertical ("edita este vídeo", "hazme el reel", "móntalo con animaciones", "subtítulos animados", "motion graphics", "quita los silencios"), cuando deje un vídeo en bruto o en brutos/ o pase una grabación para redes, aunque no mencione Remotion, y también para retocar un reel hecho con ella. Antes de empezar comprueba e instala lo que falte (ffmpeg, Node.js, Python, faster-whisper, OpenCV, PyTorch).
---

# Editor de reels con motion graphics

Convierte una grabación a cámara en un reel vertical 1080×1920 listo para publicar. Tú haces todo el trabajo técnico y creativo; el usuario solo aporta el vídeo y opina sobre el resultado. Muchos usuarios de esta skill no saben editar: explícales lo que haces con palabras normales y no les pidas decisiones técnicas que puedes tomar tú.

`<skill>` es la carpeta base de esta skill (la ruta que aparece al cargarla). Todos los comandos se lanzan **desde la carpeta del proyecto de reels** del usuario, no desde la carpeta de la skill.

## Lo que hace bueno un reel

**La imagen cuenta lo que dice la voz, en el momento exacto en que lo dice.** El espectador oye «Anthropic» y en esa sílaba se enciende su logo; oye «cinco veces» y cae la quinta moneda. Eso es lo que más valora el usuario y a lo que se dedica casi todo este proceso:

- **Tiempos exactos de cada palabra** (alineación forzada, no la transcripción): paso 3.
- **Un plan frase a frase** de qué se ve y en qué palabra entra cada cosa: paso 4.
- **Piezas que se construyen con la voz:** lo que aún no se ha dicho espera apagado y se enciende al nombrarlo.
- **Tres planos que se alternan:** cara con una pieza sobre el pecho, escena a pantalla completa y primer plano sin pieza.
- **Datos verificados y material real** (la página oficial, los logos oficiales): paso 5.

El método está explicado en `references/oficio.md`. **Léelo antes de escribir un guion.** El aspecto (colores, tipografía, tarjetas) es el de la marca del usuario y se mantiene de un reel a otro; las piezas, los rótulos y las metáforas cambian con cada tema. No hagas todos los reels iguales.

## Dos modos

| Modo | Para qué | Guion |
|---|---|---|
| **Pro** (el normal) | Una persona hablando a cámara, en horizontal o en vertical con aire alrededor | `guion_pro.json` → `references/guion-pro.md` |
| **Clásico** | Clips de móvil a pantalla completa (`"encuadre": "completo"`) y grabaciones dobles de pantalla y cámara | `guion.json` → `references/guion.md` |

`cortar` crea el guion del modo pro salvo que le pases `--clasico`. `edl`, `revisar`, `render` y `portada` usan el modo pro si existe `guion_pro.json`. Los pasos 0, 1 y 2 son iguales en los dos modos; el resto de esta guía describe el pro, y el clásico tiene su apartado al final.

## 0. Preparar el equipo y el proyecto

1. **Comprueba las herramientas:** `python <skill>/scripts/reel.py entorno`
   - Si falta algo, dile al usuario qué vas a instalar y para qué («ffmpeg para cortar vídeo, Node.js para las animaciones y PyTorch para que cada animación entre con tu voz; unos cientos de MB»).
   - Después: `python <skill>/scripts/reel.py entorno --instalar`. Añade `--gpu` si tiene una tarjeta NVIDIA y no están las librerías CUDA.
   - En Windows, lo recién instalado a veces no aparece hasta reabrir la terminal. El script ya prueba las rutas habituales.
2. **Prepara el proyecto:** `python <skill>/scripts/reel.py preparar`. Crea `brutos/` (originales), `trabajo/` (lo intermedio), `salida/` (reels terminados), `editor/` (el proyecto de Remotion, con sus dependencias, los sonidos y el logo) y `marca.json`. Vuelve a ejecutarlo si actualizas la skill o cambias `marca.json`.
3. **Marca:** por defecto es DominIA (fondo casi negro, un único acento azul `#4b8cf7`, tipografía Inter y su logo arriba a la derecha). Si el usuario tiene otra marca, pídele su color principal y su logo y edita `marca.json`. Ver `references/estilo.md`.

## 1. Analizar el vídeo

```
python <skill>/scripts/reel.py analizar brutos/<video>.mp4 <reel> --nombres "Herramientas o nombres que salen"
```

`<reel>` es un nombre corto y sin espacios, por ejemplo `gemini4-argon`. El comando:
- transcribe con marcas de tiempo por palabra (en la GPU si la hay); `--nombres` ayuda a escribir bien las marcas;
- detecta la cara para el encuadre;
- mide los **fotogramas reales** de la grabación (muchas cámaras guardan «a 60» una imagen que va a 25: si no se tiene en cuenta, el movimiento da tirones);
- imprime la transcripción con las pausas, las zonas de voz y una **propuesta de tramos** que ya excluye los silencios.

Ahora decides tú, como editor, qué se queda. Parte de la propuesta de tramos y:
- **Quita las tomas repetidas.** Suele valer la última toma completa y fluida. Mira también qué queda mejor encadenado con lo anterior.
- **Quita** frases a medias, trabas y arranques en falso.
- **Desconfía de Whisper en dos casos:**
  - Adelanta la primera palabra de cada frase, que se come el silencio anterior. Los bordes buenos son los de las zonas de voz.
  - A veces duplica palabras («visual. Visual.») donde no hay voz. Si una palabra no cae dentro de ninguna zona de voz, no existe.
- Si vas a quitar algo que cambia el contenido (una frase entera, no una traba), díselo al usuario en una línea.

**Varios vídeos de la misma grabación:** únelos antes en uno (`brutos/<reel>.mp4`), en orden, con ffmpeg a fotogramas constantes, y analiza ese.

## 2. Cortar y montar el vídeo base

```
python <skill>/scripts/reel.py cortar <reel> --tramos "1.71-5.62,9.26-13.04,..."
```

- Afina cada corte con el volumen del audio, para no comerse sílabas ni meter respiraciones, y deja solo una décima de segundo entre frases: un reel no lleva pausas.
- Une los tramos, reencuadra a vertical según la cara y monta el reel a los fotogramas reales, sin repetidos.
- Normaliza la voz a −14 LUFS y vuelve a transcribir el vídeo limpio.
- Crea `trabajo/<reel>/alineacion/guion.txt` (el texto, una frase por línea) y un guion vacío.

Detalles:
- **Ritmo:** al acabar, `cortar` lista las pausas que quedan dentro de los tramos («··· pausa 0.4s»). Quita las de medio segundo o más, y también las de tres décimas si van a quedar tapadas por una escena (el corte no se ve). No añadas respiros «para que se lea»: si una palabra necesita más tiempo en pantalla, la pieza se queda sobre el plano siguiente. Cómo, en `references/oficio.md` (apartado 7).
- **Una respiración o una pausa dentro de una frase:** parte el tramo y marca con `=` los bordes que no se deben ajustar (`78.16-=83.74,=84.04-87.67`). Cada corte abre página de subtítulos: hazlo donde pueda cambiar.
- **Primer fotograma:** es lo que se ve antes de darle a reproducir. Mira los primeros (`cortar` imprime el comando: `reel.py tira editor/public/reels/<reel>/base.mp4 0 0.32 --fps <los del reel> --ancho 400`) y, si el reel abre con los ojos a medio cerrar, repite `cortar` con `--congelar-inicio 2` (o los que hagan falta): esos fotogramas se sustituyen por el primero bueno.
- **Si vuelves a cortar con el guion ya escrito,** `cortar` te lo avisa: `reel.py recolocar <reel>` mueve todos los tiempos del guion al vídeo nuevo.

## 3. Tiempos exactos de cada palabra

1. **Repasa `trabajo/<reel>/alineacion/guion.txt`:** una frase por línea, escrita tal como se verá en pantalla (nombres bien escritos, cifras en número, tildes, signos). Si algo se pronuncia distinto de como se escribe, pon la pronunciación entre llaves pegada a la palabra: `GPT-6{ge pe te seis}`, `OpenAI{open ei ai}`, `Claude{clod}`. Ejemplo: `ejemplos/guion_alinear_ejemplo.txt`.
2. **`python <skill>/scripts/reel.py alinear <reel>`**

Imprime cada palabra con su número y su inicio y fin exactos. **Estos son los tiempos del guion** (Whisper va 0,2–0,45 s adelantado y no sirve para sincronizar). Las palabras con «?» tienen puntuación baja: es normal en cifras y nombres en inglés; si le pasa a una palabra corriente, al texto le falta o le sobra algo.

## 4. El plan del reel: qué se ve en cada frase

Antes del guion, escribe el plan en `trabajo/<reel>/README.md`: una fila por frase con el plano (cara + pieza, escena o primer plano), la pieza y **qué entra en qué palabra**. Cómo se decide, en `references/oficio.md` (apartados 3 y 4). Lo imprescindible:

- **El fotograma 0 ya tiene el gancho entero** y el primer cambio de plano llega antes del segundo 3.
- **Una frase, una idea, una pieza.** Y un cambio visual cada 1–2 s: algo que entra, algo que se enciende o un corte.
- **La pieza explica; el subtítulo ya repite.** Mejor el mecanismo, la proporción o la prueba que las mismas palabras con otra letra.
- **Una escena a pantalla completa cada 10–15 s,** con la pregunta que se hace el espectador como titular.
- **Un primer plano sin pieza** para las frases que van directas al espectador.
- **Un cierre con su propia pieza:** la pregunta, el comentario, las acciones.
- **Algo pensado para este tema.** Si ninguna pieza del catálogo cuenta bien una idea, diseña una (`references/guion-pro.md`, apartado 9).

## 5. Datos, logos y material real

- **Verifica todo dato que no diga la voz** en la fuente oficial (WebSearch y WebFetch) y, si es una comparación, en dos fuentes más. Apúntalos con su fuente en el `README.md` del reel. **No te inventes datos, fechas ni un orden que la fuente no da.**
- **Logos:** `python <skill>/scripts/reel.py logos "Claude" "n8n" "Google Stitch"`.
  - Busca en Lobe Icons, SVGL, Simple Icons, el icono oficial de la web y, por último, el favicon. Quedan listos para fondo oscuro y apuntados en `editor/public/logos/logos.json`.
  - Si sale `NOT FOUND` o «calidad baja», busca el logo oficial (kit de prensa o la web del producto), guárdalo en `editor/public/logos/` y apúntalo igual, o añade la herramienta al mapa `TOOLS` de `<skill>/scripts/logos.py`.
  - Nunca uses un logo que no se vea bien sobre fondo oscuro.
- **La página de la fuente** (para un `revelado` o una `ventana`): `python <skill>/scripts/reel.py captura <reel> <url>`. Mírala antes de usarla. Si la tapa un aviso de cookies: `--ocultar fijos` quita las bandas pegadas arriba y abajo, `--quitar-arriba` / `--quitar-abajo` recortan, y `--clic "texto del botón"` pulsa antes el de rechazar las cookies opcionales (ver `references/problemas.md`).

## 6. Escribir el guion

Rellena `trabajo/<reel>/guion_pro.json` siguiendo el plan. Formato, catálogo de piezas y un ejemplo de cada una: `references/guion-pro.md`. Guiones reales completos: `ejemplos/guion_pro_ejemplo.json` (una noticia, solo con piezas del catálogo) y `ejemplos/guion_pro_muse.json` (una herramienta, con seis piezas propias: `ejemplos/propias_muse.tsx`).

- **Cada cosa lleva su `en`:** el inicio de la palabra que la nombra, según la tabla de `alinear`.
- **Los sonidos, la paginación de subtítulos y el logo de la marca se ponen solos.** Tú decides las piezas, los encuadres, los capítulos y los acentos.
- **Encuadres:** uno por tramo; solo cambian en los cortes. Con pieza, el zoom se ancla en la barbilla (la cara nunca baja hacia la pieza); el primer plano sin pieza, en la cara.

Después:

```
python <skill>/scripts/reel.py edl <reel>
```

Imprime tres cosas que hay que leer enteras:
- **Los subtítulos,** página a página. Arregla con `partir_antes` las que corten mal una idea y con `textos` los signos y las palabras comidas.
- **La tabla de sincronía:** cada cosa que entra, la palabra que suena en ese instante y cuánto falta. Lo que nombra una palabra debe caer en ella (±0,05 s); un «¿suelto?» es un tiempo que no cae en ninguna.
- **Los avisos:** piezas que se pisan, cosas que se ven menos de un segundo, logos que faltan, golpes graves seguidos. Corrige o decide a conciencia.

## 7. Revisar antes de renderizar

```
python <skill>/scripts/reel.py revisar <reel> auto --zonas
python <skill>/scripts/reel.py sonido <reel>
```

`revisar auto` saca un fotograma de cada momento que importa (cada pieza entrando, cada cosa recién encendida, cada pieza completa) en hojas de cuatro (`trabajo/<reel>/revision/`). `--zonas` pinta en rojo lo que tapa la interfaz de Instagram. Mira todas las hojas:

- la cara nunca tapada, y con hueco entre la barbilla y la pieza también en los planos cercanos;
- nada que haya que leer bajo las zonas rojas;
- todo legible a tamaño de móvil, sin textos cortados ni encimados, con los logos correctos;
- lo que aparece coincide con lo que se dice en ese instante.

`sonido` compara cada efecto con la voz: ninguno debe salir marcado como fuerte.

Corrige el guion y repite `edl` y `revisar` (con segundos sueltos: `revisar <reel> 12.4 18.7`) hasta que todo esté bien. Renderizar tarda 3–5 minutos; revisar fotogramas, segundos.

## 8. Renderizar, comprobar y entregar

```
python <skill>/scripts/reel.py render <reel> --nombre v1
python <skill>/scripts/reel.py portada <reel>
python <skill>/scripts/reel.py tira salida/<reel>_v1.mp4 18.8 20.0 --fps 25
```

- `render` deja `salida/<reel>_v1.mp4` con el sonido masterizado (debe salir en −14 LUFS aproximadamente, con el pico por debajo de −1 dB).
- `portada` deja `salida/<reel>_portada.jpg` (si el guion tiene `portada`).
- `tira` saca fotogramas seguidos del vídeo ya hecho: mira así un par de transiciones.
- **Revisión independiente:** antes de entregar, lanza un subagente que revise el vídeo sin haberlo hecho (qué pedirle, en `references/oficio.md`, apartado 9). Comprueba sus hallazgos antes de cambiar nada.

**Entrega** el archivo y cuenta en pocas líneas y sin jerga: cuánto has quitado, qué se ve en cada parte, **qué datos salen en pantalla y de dónde vienen**, y cualquier duda sobre lo que dice (un nombre mal pronunciado, algo que no cuadra con la fuente). Pide opinión con ejemplos de lo que puede pedir: «subtítulos más grandes», «menos cosas en pantalla», «ese logo no es», «más rápido».

**Música:** el reel sale sin música a propósito; se añade en Instagram al publicar, con canciones con licencia y tendencias.

## Modo clásico

Para lo que el modo pro no cubre:

- **Clips de móvil (selfie y pantalla grabada con el móvil, ya en vertical):** edición sencilla con el plano entero (`"encuadre": "completo"`), subtítulos, título de portada y llamada a comentar. Al unirlos, mira un fotograma de cada clip: voltea los selfies en espejo (`hflip`), iguala el volumen de la voz y quita la marca de giro que ffmpeg 7 copia del primer clip (ver `references/problemas.md`).
- **Grabación doble (pantalla y cámara una al lado de la otra, p. ej. 3840×1080 de OBS):** se detecta sola. `cortar` genera además `pantalla.mp4` con los mismos cortes, para la pieza `pantalla`.

Pasos: `cortar <reel> --tramos "…" --clasico` (crea `guion.json`), logos, escribir el guion con los tiempos que imprime `cortar` (`references/guion.md`, con un guion real en `ejemplos/guion_ejemplo.json`), `edl`, `revisar <reel> 0.5 6.3 …`, `render` y `portada <reel> 1.0`. No hace falta `alinear`. La música, si el usuario pasa una pista: `"musica": {"archivo": "musica/pista.mp3", "volumen": 0.1}`.

## Iterar con el feedback

- **Si el cambio es de este reel** (tiempos, textos, qué pieza va dónde), cambia el guion y renderiza una versión nueva (`--nombre v2`).
- **Si el cambio es de estilo y afecta a todos los reels** (un tamaño, una animación, una pieza nueva que va a repetirse), cámbialo en `<skill>/plantilla/` y ejecuta `preparar`. Díselo al usuario.
- **Si el usuario rechaza algo,** anótalo en `references/estilo.md` con el motivo, para no repetirlo.

## Referencias

- `references/oficio.md`: el método (los tres planos, el plan frase a frase, qué pieza pide cada frase, construir con la voz, datos, sonido, revisión y errores ya cometidos). Léelo antes del primer guion pro.
- `references/guion-pro.md`: formato de `guion_pro.json`, catálogo de piezas con ejemplos, sonidos, subtítulos, encuadres, portada y cómo hacer una pieza propia.
- `references/guion.md`: formato de `guion.json` y piezas del modo clásico.
- `references/estilo.md`: sistema visual (zonas de la pantalla, colores, tipografía, movimiento), marca y preferencias ya decididas.
- `references/problemas.md`: errores frecuentes y cómo resolverlos (instalación, GPU, fotogramas repetidos, ffmpeg, Remotion, Whisper, logos).
- `references/referencias.md`: cómo analizar un reel de referencia de Instagram sin descargarlo, para entender un estilo sin copiarlo.
