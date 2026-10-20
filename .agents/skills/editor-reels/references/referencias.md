# Analizar un reel de referencia (sin descargarlo) y no copiarlo

Cuando el usuario pasa reels de otros creadores «para que entiendas lo que busco», el objetivo es **entender el tipo de edición, no copiarla**. De cada referencia se sacan principios de oficio (ritmo, cómo entran los elementos, qué se destaca, cómo suena) y se aplican con la marca propia. No se copian sus colores, sus piezas, sus rótulos, su llamada a la acción ni su música, y sus vídeos no se usan como material.

## Método en el navegador (probado con Instagram)

1. **Abrir el reel** en el navegador integrado: `https://www.instagram.com/reel/<id>/` (o `/p/<id>/`).
   - En el aviso de cookies, pulsa «Rechazar cookies opcionales».
   - Cierra con la X el modal de registro. **No inicies sesión** ni uses las cookies del usuario.
   - Al cambiar de reel hay que volver a instalar las funciones de JavaScript.
2. **Sacar fotogramas** (vía fiable: funciona aunque el panel esté oculto o la ventana minimizada).
   - El vídeo es un `<video>` con blob (MSE), así que se puede dibujar en un canvas.
   - Con JavaScript: pausa, `currentTime = t`, espera al evento `seeked` más 70 ms y `drawImage` sobre un canvas suelto (no hace falta que esté en la página). Monta hojas de contacto con el tiempo escrito en cada fotograma.
   - Devuelve `canvas.toDataURL('image/jpeg', 0.6)` dentro de un JSON `{items: [{name, img}]}`. Como el resultado es grande, la herramienta lo guarda en un archivo de resultados; un script de Python saca los JPG (base64) y se miran con Read.
   - Tamaños que van bien: hoja 6×2 de 1600×1200 (1 fotograma por segundo, resumen); 3×1 de 1632×964 para detalles de diseño; 6×2 cada 0,1 s para transiciones. Hasta unas 4 hojas (40 saltos) por llamada.
   - Usa el tamaño real del fotograma en cada salto (`videoWidth` cambia: los primeros segundos llegan a menos resolución).
   - No uses `requestAnimationFrame` (con el panel oculto no se ejecuta): `setTimeout`.
   - Las capturas de pantalla del navegador son peor vía: con el panel oculto fallan a ratos.
3. **Medir el ritmo y el sonido** (no se puede oír), en una pasada a velocidad normal:
   - AudioContext → `createMediaElementSource(video)` → Analyser → Gain a 0 → destino. Instagram vuelve a silenciar el vídeo al darle a play: pon `muted = false` después del `play()`.
   - Cada 30–40 ms, con `setTimeout`: el RMS y la energía de tres bandas (30–150 Hz, 300–3000 Hz y 6–14 kHz), y la diferencia entre fotogramas en un canvas de 27×48 partido en tres franjas (arriba, centro, abajo).
   - **Cortes de plano:** diferencia alta en las tres franjas. **Entradas de gráficos:** solo en una.
   - **Efectos de sonido:** picos de agudos de más de 25 dB sobre el entorno, coincidiendo con entradas de gráficos. Las eses de la voz dan de 7 a 18 dB.
   - **Música de fondo:** el nivel mínimo en ventanas de 300 ms nunca cae a silencio y queda sonido después de la última palabra.
   - **Sin pausas:** ninguna ventana de 0,3 s por debajo de −32 dB.
4. **Escribir la ficha** en `trabajo/referencias/analisis.md`:
   - estructura (gancho, bloques, cierre) y tipos de plano;
   - sistema visual (color, etiquetas, paneles, subtítulos);
   - piezas y cómo se animan;
   - ritmo y sonido;
   - **qué principios se llevan** y **qué no se copia** (una tabla).
   Guarda los fotogramas de referencia: harán falta al final.

## Qué se aprovecha y qué no

| Se aprovecha (oficio) | No se copia (diseño) |
|---|---|
| El gancho completo en el fotograma 0 | Sus colores, su tipografía, sus fondos |
| Cero pausas y un cambio visual cada 1–2 s | La forma concreta de cada pieza: su estructura, sus rótulos, su composición |
| Alternar tipos de plano | Sus textos, su llamada a la acción, su música |
| Cada dato entra cuando se dice | Sus recursos característicos (un tipo de etiqueta, una trama de fondo, un número gigante con su texto al lado) |
| Datos con fuente y material real | |
| Un sonido discreto por entrada | |

**El diseño sale de la marca del usuario** (`estilo.md`), no de las referencias.

## Cuando la referencia habla de lo mismo

Si el reel del usuario cuenta la misma noticia o usa los mismos datos que una referencia, el riesgo de calcarla es alto: lo natural es poner la misma tabla con los mismos rótulos. Hay que contarlo de otra forma: otra metáfora (monedas en vez de «5×»), otro tipo de gráfico, otros rótulos. Compartir datos públicos no es copiar; repetir la pieza, sí.

## Comprobación antes de entregar

1. Pon cada pieza del reel junto a los fotogramas de las referencias. **Misma estructura + mismos rótulos + misma composición = copia,** aunque cambien los colores.
2. Pide además una revisión independiente (un subagente con los fotogramas del reel y los de las referencias) que busque parecidos y los puntúe. Quien ha hecho el reel no los ve.
3. Si ya se ha entregado algo que se parece, díselo al usuario sin rodeos y rehazlo.

## Otras vías

- **Descargar con yt-dlp** suele fallar sin sesión («login required»). No uses las cookies del navegador del usuario.
- **El usuario puede pasar el vídeo:** con el botón «Descargar» del menú de compartir de Instagram (si el creador lo permite) o con una grabación de pantalla del móvil.
- **Con el archivo local**, usa ffmpeg: hojas de contacto (`fps=1,scale=...,tile=6x4`), cambios de plano (`select='gt(scene,0.3)'`) y volumen (`ebur128` o `astats`).
