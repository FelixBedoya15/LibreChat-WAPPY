# Sincronía con la voz

Josema lo pide siempre: «que la voz vaya acorde a la animación». Un elemento que aparece 0,3 s tarde respecto a
la palabra se nota como desincronizado; por eso los tiempos no se estiman: se miden. En este formato se miden dos
veces: en la grabación original (para saber qué cortar) y en la voz ya cortada (para animar).

## Por qué no basta Whisper

Whisper sirve para saber **qué** se dice, pero sus marcas de tiempo por palabra van adelantadas: según la
grabación, entre 0,1 y 0,45 s de mediana, y más en la primera palabra tras una pausa, que se come el silencio.
Además confunde nombres («Fiber» por «Fable», «Ultra» por «Astra»), a veces escribe mal las cifras, se inventa un
«Gracias.» en el silencio final y puede duplicar la palabra del cambio de segmento.

La **alineación forzada** (torchaudio MMS_FA) parte del texto correcto y solo busca dónde suena cada letra:
los inicios que da coinciden con la subida de energía de la voz con un error de ~20 ms.

## Flujo

1. `anim.py transcribir --nombres "Muse, Meta, WhatsApp, Muse Spark"` → `edicion/guion.txt` y
   `edicion/transcripcion.json` (siempre sobre la grabación original, `edicion/toma.wav`). `--nombres` ayuda a Whisper
   con la ortografía, pero no lo arregla todo. Si no conocías los nombres en la primera pasada, repite con `--nombres`:
   reescribe `guion.txt` mientras no lo hayas corregido tú (la última transcripción queda en `guion_whisper.txt`).
2. **Corrige `edicion/guion.txt`** a mano:
   - una frase por línea, escrita como debe verse en pantalla («Muse Spark», «Claude Code», «n8n»);
   - nombres oficiales (compruébalos en la web si hay duda: ver `datos-y-logos.md`);
   - no quites ni añadas palabras que no se dicen: el alineador necesita el texto real, muletillas incluidas si se
     oyen claramente («eh» suele poder omitirse; una palabra repetida, no);
   - **tomas repetidas o fallidas**: se quedan, cada una en su línea, con `~` delante de la que sobra (`cortar` la deja
     fuera del montaje);
   - borra el «Gracias.» final inventado y la palabra duplicada en un cambio de segmento si al alinear sale con
     puntuación ≈ 0 y muy corta (no se dijo).
3. Pronunciaciones: las cifras se convierten solas a palabras en español («3 %» → «tres por ciento», «5.5» → «cinco
   punto cinco»). Para lo que se dice distinto de como se escribe:
   - en línea: `WhatsApp{guasap}`, `Muse{mius}`, `GPT-6{yi pi ti six}`;
   - o `trabajo/pronunciacion.json`: `{"OpenAI": "open ei ai"}` (vale para todas las apariciones).
   Solo letras a–z y espacios; escribe como suena en español.
4. `anim.py alinear --toma` → `edicion/tiempos.json` y una tabla por frase: `[índice] inicio fin puntuación palabra`.
   - Puntuación con `?` (< 0,3): normal en cifras y términos en inglés. Aunque salga baja, el inicio sigue siendo
     bueno porque las palabras de alrededor lo anclan.
   - Si una palabra corriente sale con `?`, el guion no coincide con lo que se dice ahí: revisa esa frase.
   - Al final compara con Whisper («mediana −0,21 s, adelantado»): confirma que la corrección era necesaria.
5. `anim.py cortar` usa esos tiempos para quitar las pausas (`references/montaje.md` § 2) y deja `trabajo/guion.txt`
   (el guion sin las líneas con `~`: la voz cortada dice exactamente eso). Solo lo crea si no existe: si corriges
   `edicion/guion.txt` y vuelves a cortar, bórralo antes.
6. `anim.py alinear` → `trabajo/tiempos.json`: las palabras sobre la voz cortada (`assets/audio/voz.wav`). Son los
   tiempos del vídeo final, desde el fotograma 0.
   - Para probar pronunciaciones sin pisar los tiempos buenos: `anim.py alinear --salida trabajo/prueba.json`.
   - **La última palabra** no tiene vecina a la derecha que la ancle: su inicio es fiable si las anteriores lo son,
     pero su final no. El final de la voz sácalo de `envolvente` («la voz termina en…»).
7. Comprueba 2–3 anclas con `anim.py envolvente Muse Claude 57` (palabras o índices): imprime dónde sube de verdad la
   energía y la diferencia con el inicio alineado (±0,06 s o menos = bien), y dónde empieza y termina la voz. Las
   mejores anclas son palabras justo después de un corte.
8. Copia al objeto `T` del `index.html` los inicios de las palabras que disparan algo en pantalla (redondeados a
   centésimas), con nombres claros: `T.similar = 4.06`, `T.openclaw = 5.04`, `T.gratis = 9.35` (Muse explicación).

## Cómo usar los tiempos

- El visual empieza 0,02–0,05 s antes del inicio de su palabra (`P(t, T.muse - .04, .5, E.out4)`).
- Para entradas largas (una tarjeta que viaja 0,6 s), haz que el momento visible clave (cuando ya se lee el
  nombre) coincida con la palabra; el movimiento puede empezar un poco antes.
- El primer fotograma de una ventana de animación es un corte: lo que abre la ventana ya está entrando en ese
  fotograma (empieza 0,1–0,45 s antes de `V.id.a`).
- Los acentos (anillos, golpes de escala) van en el inicio exacto de la palabra fuerte.
- Texto que se escribe en pantalla mientras se dice (chips): no a velocidad fija, palabra a palabra con
  `escribirPalabras('agente de IA', [T.agente, T.de, T.ia], T.iaFin)` (ver `motor.md`).
- Las salidas pueden empezar al terminar la frase anterior (usa el `fin` de su última palabra).
- La duración total es la de la voz cortada (`CONFIG.dur`, la pone `cortar`).

## Detalles

- El modelo de alineación (1,2 GB) se descarga la primera vez; con GPU tarda segundos, en CPU algo más.
- Audios de más de 1 minuto se procesan por trozos de 30 s automáticamente.
- El MP4 final lleva `edicion/voz_cortada.wav` entera desde el fotograma 0 (AAC 320 kbps, 48 kHz estéreo): los
  tiempos de `trabajo/tiempos.json` son directamente los del vídeo. `comprobar --palabras` saca un fotograma del MP4
  0,12 s después de cada tiempo de `T` para verlo con tus ojos.
- Si Josema cambia la grabación, se repite todo desde `nuevo`; si solo corriges el guion, desde `alinear --toma`.
  El resto del código no cambia si las escenas usan `T` (no números sueltos).
- En este Python, `librosa` no importa (numba no admite la NumPy instalada): los scripts leen el audio con ffmpeg y
  numpy.
