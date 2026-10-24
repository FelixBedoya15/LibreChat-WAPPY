# Sincronía con la voz

Josema lo pide siempre: "que el audio vaya acorde al vídeo". Un elemento que aparece 0,3 s tarde respecto a
la palabra se nota como desincronizado; por eso los tiempos no se estiman: se miden.

## Por qué no basta Whisper

Whisper sirve para saber **qué** se dice, pero sus marcas de tiempo por palabra van adelantadas: según la
grabación, entre 0,1 y 0,45 s de mediana, y más en la primera palabra tras una pausa, que se come el silencio
(en astravsopus_1.mp3 ponía "Lo" en 0,00 s cuando la voz empieza en 0,40). Además confunde nombres
("Fiber"/"a favor" por "Fable", "Ultra" por "Astra") y a veces escribe mal las cifras.

La **alineación forzada** (torchaudio MMS_FA) parte del texto correcto y solo busca dónde suena cada letra:
los inicios que da coinciden con la subida de energía de la voz con un error de ~20 ms.

## Flujo

1. `anim.py transcribir --nombres "Claude Opus 5.5, GPT-6 Astra, OpenAI"` → `trabajo/guion.txt` y `trabajo/transcripcion.json`.
   `--nombres` ayuda a Whisper con la ortografía, pero no lo arregla todo. Si no conocías los nombres en la primera
   pasada, repite con `--nombres`: reescribe `guion.txt` mientras no lo hayas corregido tú (la última
   transcripción queda siempre en `guion_whisper.txt`).
2. **Corrige `trabajo/guion.txt`** a mano:
   - una frase por línea, escrita como debe verse en pantalla ("Opus 5.5", "GPT-6", "n8n");
   - nombres oficiales (compruébalos en la web si hay duda: ver `datos-y-logos.md`);
   - no quites ni añadas palabras que no se dicen: el alineador necesita el texto real, muletillas incluidas
     si se oyen claramente ("eh" suele poder omitirse; una palabra repetida, no).
3. Pronunciaciones: las cifras se convierten solas a palabras en español ("5.5" → "cinco punto cinco",
   "40%" → "cuarenta por ciento", "$10" → "diez dólares"). Para lo que se dice distinto de como se escribe:
   - en línea: `GPT-6{yi pi ti six}`, `Fable{feibol}`, `n8n{ene ocho ene}`;
   - o `trabajo/pronunciacion.json`: `{"GPT-6": "yi pi ti six", "OpenAI": "open ei ai"}` (vale para todas las apariciones).
   Solo letras a–z y espacios; escribe como suena en español.
4. `anim.py alinear` → `trabajo/tiempos.json` y una tabla por frase: `[índice] inicio fin puntuación palabra`.
   - Puntuación con `?` (< 0,3): normal en cifras y términos en inglés. Aunque salga baja, el inicio sigue
     siendo bueno porque las palabras de alrededor lo anclan.
   - Si una palabra corriente sale con `?`, el guion no coincide con lo que se dice ahí: revisa esa frase.
   - Al final compara con Whisper ("mediana −0,21 s, adelantado"): confirma que la corrección era necesaria.
   - Para probar pronunciaciones sin pisar los tiempos buenos: `anim.py alinear --salida trabajo/prueba.json`.
   - **La última palabra** no tiene vecina a la derecha que la ancle: su inicio es fiable si las anteriores lo
     son, pero su final no. El final de la voz sácalo de `envolvente` ("la voz termina en…").
5. Comprueba 2–3 anclas con `anim.py envolvente Recordemos Además 57` (palabras o índices): imprime dónde
   sube de verdad la energía y la diferencia con el inicio alineado (±0,06 s o menos = bien), y dónde empieza y
   termina la voz. Las mejores anclas son palabras justo después de una pausa.
6. Copia al objeto `T` del `index.html` los inicios de las palabras que disparan algo en pantalla
   (redondeados a centésimas), con nombres claros: `T.opus1 = 4.64`, `T.astra = 22.03`, `T.mitad = 39.84`.

## Sin audio (solo transcripción con marcas)

`anim.py estimar` convierte una transcripción con marcas `mm:ss` en `tiempos.json` con el mismo formato. Cada frase
arranca en su marca (+0,15 s) y sus palabras se reparten por sílabas a ~6 sílabas/s; si no caben antes de la
siguiente marca, se acelera. Las marcas de los transcriptores ya van redondeadas al segundo, así que confía en el
inicio de cada frase y deja que lo demás tenga margen: entradas de 0,4–0,6 s en vez de golpes secos sobre una sílaba.
Si más tarde aparece el audio real, cambia `CONFIG.audio`, ejecuta `transcribir` + `alinear` y actualiza `T`.

## Cómo usar los tiempos

- El visual empieza 0,02–0,05 s antes del inicio de su palabra (`P(t, T.opus1 - .04, .5, E.out4)`).
- Para entradas largas (una tarjeta que viaja 0,6 s), haz que el momento visible clave (cuando ya se lee el
  nombre) coincida con la palabra; el movimiento puede empezar un poco antes.
- Los acentos (anillos, golpes de cámara) van en el inicio exacto de la palabra fuerte.
- Texto que se escribe en pantalla mientras se dice (chips): no a velocidad fija, palabra a palabra con
  `escribirPalabras('sale muy barato', [T.sale, T.muy, T.barato], T.baratoFin)` (ver `motor.md`).
- Las salidas de escena pueden empezar al terminar la frase anterior (usa el `fin` de su última palabra).
- La duración total es la del audio (`CONFIG.dur`); la voz suele acabar antes: mantén el plano final.

## Detalles

- El modelo de alineación (1,2 GB) se descarga la primera vez; con GPU tarda segundos, en CPU algo más.
- Audios de más de 1 minuto se procesan por trozos de 30 s automáticamente.
- El MP4 final lleva el mismo archivo de voz desde el instante 0 (recodificado a AAC 48 kHz estéreo): los
  tiempos de `tiempos.json` son directamente los del vídeo. `comprobar` avisa si el audio y el vídeo no empiezan
  a la vez, y con `--palabras` saca un fotograma del MP4 en cada tiempo de `T` para verlo con tus ojos.
- Si Josema cambia la locución, repite `transcribir` → corregir → `alinear` y actualiza `T`; el resto del
  código no cambia si las escenas usan `T` (no números sueltos).
- En este Python, `librosa` no importa (numba no admite la NumPy instalada): los scripts leen el audio con
  ffmpeg y numpy.
