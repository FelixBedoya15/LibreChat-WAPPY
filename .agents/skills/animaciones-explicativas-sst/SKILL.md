---
name: animaciones-explicativas-sst
description: Crea vídeos explicativos y análisis normativos de Seguridad y Salud en el Trabajo (SST) estilo "SST para Dummies" (1920x1080 o 1080x1920 a 60 fps, sin subtítulos por defecto) sincronizados palabra a palabra con la voz. Incluye visor de sentencias/decretos reales en papel blanco con subrayado fluorescente amarillo y datos personales censurados, pantalla dividida de rumores de WhatsApp vs verificación técnica, abanico de formatos/procedimientos con metáforas visuales ("extintor normativo"), índice de capítulos numerados, intro editorial y generador de portadas/miniaturas con expediente legal y gancho gigante. Úsala SIEMPRE que el usuario pida explicar una norma, resolución, decreto, sentencia del Consejo de Estado/Corte, cambio legal en SST o quiera un vídeo estilo "SST para Dummies" / explicativo documental.
---

# Animaciones Explicativas y Normativas SST (`animaciones-explicativas-sst`)

Esta skill transforma una locución, audio o grabación explicando una norma, sentencia, decreto o concepto de **Seguridad y Salud en el Trabajo (SST)** en un vídeo documental/editorial limpio, pedagógico y riguroso, inspirado en el lenguaje visual de **«SST para Dummies»**.

---

## 1. ADN Visual y Reglas de Dirección de Arte

1. **Lienzo y Fondo Editorial (`body.editorial`):**
   - **Fondo:** Degradado radial petróleo profundo (`#082838` $\rightarrow$ `#041722` $\rightarrow$ `#020c13`), completamente limpio (sin rejilla de puntos ni ruido visual que distraiga de la lectura normativa).
   - **Cero Subtítulos por Defecto (`subtitulos: false`):** Nunca satures la parte inferior con subtítulos quemados a menos que el usuario lo pida expresamente. El espacio se distribuye en composiciones limpias de **pantalla dividida (50/50)** o centro focal.
2. **Paleta de Color Semántica:**
   - **Turquesa SST (`#14B8A6`):** Conceptos clave, numeración de capítulos `[1]`, `[2]`, escudo SST y etiquetas técnicas.
   - **Amarillo Resaltador / Ámbar (`#EAB308` / `#F59E0B`):** Subrayado progresivo sobre documentos reales (`<span class="hl"><i></i>...</span>`), alertas de rumor/duda y palabras gancho en miniatura.
   - **Papel Legal Real (`#FBFBF9`):** Hoja blanca con textura editorial, tipografía serif (`Instrument Serif` / `Georgia`) para mostrar sentencias, resoluciones y decretos reales.
   - **Censura / Anonimización (`#0F172A`):** Bloques oscuros con insignia `dato personal oculto` para proteger nombres reales en sentencias o actas.

---

## 2. Los 5 Componentes Insignia (`plantilla/motor/editorial.js`)

La plantilla de esta skill ya incluye `motor/editorial.js` cargado automáticamente y `body.editorial` activo. Tienes disponibles 5 constructores especializados listos para instanciar en `index.html`:

### 2.1. `IntroEditorialSST(o)` — Intro Clásica «SST para Dummies»
Crea la apertura institucional con escudo animado, título en turquesa, píldora amarilla y los iconos inferiores del diccionario jurídico y la taza de café que se tachan en rojo cuando la voz dice *«sin diccionario jurídico ni cinco tazas de café»*.
```js
const intro = new IntroEditorialSST({
  eyebrow: 'Bienvenidos a',
  titulo: 'SEGURIDAD Y SALUD EN EL TRABAJO',
  badge: 'para dummies',
  subtitulo: 'Conceptos, normas y cambios explicados en cristiano',
  t0: 0.1,
  tBadge: T.dummies,
  tSub: T.cristiano,
  tNoDic: T.diccionario,
  tNoCafe: T.cafe,
});
// En render(t):
intro.pintar(t, { x: CX, y: CY, o: 1 });
```

### 2.2. `ChatRumores(o)` — Rumores de WhatsApp vs. Verificación Técnica
Pantalla dividida: a la izquierda un teléfono con el chat grupal de colegas SST enviando cadenas de urgencia; a la derecha tarjetas con etiqueta ámbar `RUMOR / DUDA` y sello `POR VERIFICAR`.
```js
const rumores = new ChatRumores({
  grupo: 'Grupo de colegas SST',
  subgrupo: 'mensajes reenviados · esta semana',
  mensajes: [
    { t0: T.msg1, hora: '8:14 a. m.', texto: '¿Ya vieron? ¡Se cayó la resolución!', tag: 'Reenviado muchas veces' },
    { t0: T.msg2, hora: '8:16 a. m.', texto: 'Toca rehacer todo el procedimiento hoy mismo 😱' },
  ],
  tarjetas: [
    {
      t0: T.rumor1,
      tipo: 'RUMOR / DUDA',
      estado: 'POR VERIFICAR',
      cita: '«Se cayó toda la norma»',
      sub: '¿Es nulidad total o solo de un parágrafo específico?',
    },
  ],
});
// En render(t):
rumores.pintar(t, { x: CX, y: CY, o: 1 });
```

### 2.3. `VisorNormaReal(o)` — Documento Oficial con Subrayado Fluorescente y Desglose
Muestra a la izquierda la hoja blanca oficial de la Sentencia, Decreto o Resolución con zoom suave, bloques `[dato personal oculto]` y subrayado amarillo (`<span class="hl"><i></i>texto</span>`) que se dibuja al ritmo de la voz; y a la derecha el desglose estructurado más el pie de fuente oficial.
```js
const visor = new VisorNormaReal({
  t0: T.sentencia,
  doc: {
    entidad: 'REPÚBLICA DE COLOMBIA · CONSEJO DE ESTADO',
    referencia: 'RAD. 11001-03-25-000',
    parrafos: [
      '<b>PRIMERO:</b> Declárase la nulidad parcial de la expresión demandada por el ciudadano <span class="redact">dato personal oculto</span>.',
      '<b>SEGUNDO:</b> Se mantiene vigente la obligación de conformar el <span class="hl"><i></i>Comité de Convivencia Laboral</span> en todas las empresas.',
    ],
    subrayados: [T.subrayado1], // instantes donde se activa cada <span class="hl">
    zoom: [T.zoomDoc, 1.06],
  },
  derecha: {
    eyebrow: 'ANÁLISIS JURÍDICO APLICADO',
    titulo: 'Lo que realmente dice el fallo',
    tarjetas: [
      {
        t0: T.punto1,
        etiqueta: 'VIGENCIA',
        titulo: 'El Comité NO desaparece',
        texto: 'Continúa siendo obligatorio conforme a la Resolución 3461 de 2025.',
      },
      {
        t0: T.punto2,
        cita: true,
        etiqueta: 'TEXTO EXACTO',
        titulo: '«Solo se anula el apartado que excedía la potestad reglamentaria»',
      },
    ],
  },
  fuente: 'Fuente: Consejo de Estado · Sala de lo Contencioso Administrativo',
});
// En render(t):
visor.pintar(t, { x: CX, y: CY, o: 1 });
```

### 2.4. `AbanicoDocumentos(o)` — Procedimientos, Formatos y Metáfora Visual
Muestra a la izquierda las tarjetas inclinadas en abanico (*Procedimiento, Formato, Comunicado*) y a la derecha una ilustración vectorial con etiqueta (como el *«extintor normativo»*).
```js
const abanico = new AbanicoDocumentos({
  t0: T.documentos,
  docs: [
    { t0: T.doc1, num: 'DOC · 01', titulo: 'Procedimiento', sub: 'Ajuste de plazos internos', r: -5 },
    { t0: T.doc2, num: 'DOC · 02', titulo: 'Formato de Acta', sub: 'Actualización de base legal', r: 0 },
    { t0: T.doc3, num: 'DOC · 03', titulo: 'Comunicado', sub: 'Claridad para los trabajadores', r: 5 },
  ],
  metafora: {
    t0: T.extintor,
    etiqueta: '«extintor normativo»',
    sub: 'Apaga el pánico antes de rehacer formatos sin necesidad',
  },
});
// En render(t):
abanico.pintar(t, { x: CX, y: CY, o: 1 });
```

### 2.5. `IndiceCapitulos(o)` — Estructura Numerada del Vídeo
Lista limpia con cajas numeradas en turquesa (`[1]`, `[2]`, `[3]`) que se iluminan secuencialmente cuando el narrador presenta la hoja de ruta del vídeo.
```js
const indice = new IndiceCapitulos({
  t0: T.hojaRuta,
  eyebrow: 'HOJA DE RUTA DEL ANÁLISIS',
  titulo: '¿Qué vamos a resolver hoy?',
  items: [
    { t0: T.cap1, texto: 'Qué dijo exactamente la sentencia y qué parte cambió' },
    { t0: T.cap2, texto: 'Qué pasa con tu Comité actual y los procedimientos vigentes' },
    { t0: T.cap3, texto: 'Cómo gestionarlo en segundos dentro de WAPPY IA' },
  ],
});
// En render(t):
indice.pintar(t, { x: CX, y: CY, o: 1 });
```

---

## 3. Flujo de Trabajo Paso a Paso

1. **Crear el proyecto con la skill:**
   ```bash
   python3 "/Users/venta/Documents/GitHub/LibreChat-WAPPY/.agents/skills/animaciones-explicativas-sst/scripts/anim.py" nuevo <carpeta-proyecto> --audio <ruta-audio.wav>
   ```
   *(Si es con grabación a cámara, usa `--video <ruta-video.mp4>`).*
2. **Alinear tiempos palabra a palabra:**
   Lee `trabajo/tiempos.json` generado por `anim.py` y copia los segundos exactos al objeto `const T = { ... }` en `index.html`.
3. **Maquetar escenas limpias (Sin subtítulos):**
   Combina `IntroEditorialSST`, `ChatRumores`, `VisorNormaReal`, `AbanicoDocumentos` e `IndiceCapitulos` junto con las piezas de `motor/piezas.js` si necesitas comparativas adicionales.
4. **Generar la Miniatura / Portada Estilo Editorial (`portada.html`):**
   - Fondo petróleo oscuro (`#06202E`).
   - A la izquierda: Carpeta manila / hoja oficial inclinada (`-4deg`) con encabezado de la entidad (*CONSEJO DE ESTADO / MINISTERIO DEL TRABAJO*) y sello rojo/ámbar.
   - A la derecha: Avatar 3D oficial de WAPPY o foto recortada del presentador mirando el documento.
   - Arriba: Insignia tipo pincel amarillo/turquesa (`SST al Día` / `WAPPY IA`) + caja con el tema (`COMITÉ DE CONVIVENCIA`).
   - Abajo a todo el ancho: Pregunta gancho gigante en amarillo y blanco (`¿Y AHORA QUÉ?`).
5. **Renderizar el MP4 a 60 fps e incrustar portada:**
   ```bash
   python3 "/Users/venta/Documents/GitHub/LibreChat-WAPPY/.agents/skills/animaciones-explicativas-sst/scripts/anim.py" render <carpeta-proyecto>
   ```
