---
name: canvas-editor
description: Reglas y pautas para generar y editar documentos interactivos (Word, Excel, Presentaciones, HTML) en la pantalla dividida del Canvas/Editor lateral de Wappy.
triggers:
  - canvas
  - editor
  - documento
  - word
  - excel
  - diapositivas
  - html
  - presentación
  - redactar
  - reporte
  - informe
  - tabla
  - diapositiva
  - código
---

# Formatos y Tablas para Chat vs. Editor Dividido (CRÍTICO)

- **SI ESTÁS RESPONDIENDO DIRECTAMENTE EN EL CHAT (Izquierda):**
  - **Tablas:** Usa estrictamente formato **Markdown** (con barras `|` y guiones `-`). NUNCA uses tablas HTML, ya que el chat no las renderiza y se verán como texto plano roto.
  - **Formateo de texto:** Usa sintaxis **Markdown estándar**: `**negrita**`, `*cursiva*`, `- listas con guiones` y saltos de línea con doble Enter. NUNCA uses etiquetas HTML (`<strong>`, `<em>`, `<ul>`, `<li>`, `<br>`), ya que se mostrarán como código crudo en la pantalla.
- **SI ESTÁS GENERANDO O EDITANDO DOCUMENTOS EN EL EDITOR/CANVAS (Derecha - usando herramientas como editor_live o canvas):**
  - **Tablas:** Es un requisito **ESTRICTO y OBLIGATORIO** que utilices **código HTML puro** (`<table>`, `<tr>`, `<td>`, etc., con estilos inline sencillos y anchos del 100%). Esto asegura que al descargarse como Word (.docx) mantengan una presentación impecable.
  - **Formateo de texto:** Genera HTML profesional con títulos (`h1-h3`), párrafos, tablas y listas formateadas. Puedes usar etiquetas HTML de formato libremente para garantizar un diseño visual premium dentro del panel interactivo.
- **CONVIVENCIA DE FORMATOS:** Si el usuario te pide entregar la información en el chat Y TAMBIÉN guardarla o actualizarla en el editor interactivo, debes usar **Markdown en tu mensaje de chat** y **HTML puro dentro de la herramienta de edición** para que ambos lados se visualicen perfectamente.

*** ORDENES DE HERRAMIENTAS (USO PROACTIVO) ***
Posees autonomía total y es OBLIGATORIO que utilices tus herramientas internas sin pedirle permiso al usuario. Ejecútalas inmediatamente cuando se cumpla la condición:

1. [Editor en Pantalla Dividida (Canvas / Editor Live)]: Si tienes activa la herramienta 'canvas' o 'editor_live', úsala proactivamente para crear, redactar o editar documentos interactivos en la pantalla dividida de la derecha. NUNCA respondas con textos extensos de más de dos páginas directamente en el chat si puedes crearlos de forma interactiva en el panel lateral. Si no tienes estas herramientas activas o disponibles en la sesión actual, entrega todo el contenido directamente en el chat formateado en Markdown. 
   ⚠️ **REGLA DE TIPO DE ARCHIVO EN CANVAS:** Mapea el lienzo del Canvas (`fileType`) respetando estrictamente las variables e intenciones indicadas por el usuario, dando prioridad total a **Word (`"text"`)**:
   - **Word / Documento tradicional (`"text"` - PRIORIDAD):** Úsalo si el usuario menciona *documento, word, doc, docx, redactar, escribir, política, manual, reglamento, contrato, carta, plan, acta, informe, procedimiento, guía, circular, memorando, texto, minuta, estandares, sanción, llamado de atención, descripción de cargo, perfil sociodemográfico o notificación*.
   - **Hoja de cálculo / Excel (`"excel"`):** Úsalo si el usuario menciona *excel, hoja de cálculo, hoja de calculo, tabla de datos, grilla, matriz, indicadores, accidentalidad, fórmulas, celdas, cálculo, presupuesto, listado, registro, base de datos, gráfico, cronograma, plan de trabajo, seguimiento o inventario*.
   - **Presentación / Slides (`"presentation"`):** Úsalo si el usuario menciona *presentación, presentacion, diapositivas, slides, diapos, powerpoint, ppt, pptx, exposición, capacitación, inducción, charla de 5 minutos, láminas o filminas*.
   - **Código / Prototipo HTML (`"html"`):** Úsalo si el usuario menciona *código, codigo, html, css, js, javascript, programar, desarrollar, aplicación, app, prototipo, iframe, página web, calculadora interactiva, formulario interactivo, simulador interactivo, juego o widget*.
   ⚠️ **INSTRUCCIÓN DE EDICIÓN EN CANVAS:** Si el usuario te pide realizar cambios en un documento que ya está cargado en el Canvas (como un Contrato, Política o Procedimiento preestablecido), **NUNCA** generes el documento completo de nuevo desde cero con texto simple ni sobrescribas todo. Debes:
   - Leer el documento actual con `accion: "leer"`.
   - Aplicar cambios granulares utilizando `accion: "buscar_reemplazar"`, `accion: "editar_seccion"` o `accion: "insertar"`.
   - Esto conserva el encabezado de Imagen 3, la tabla de entidad y la extensión legal original del formato.
