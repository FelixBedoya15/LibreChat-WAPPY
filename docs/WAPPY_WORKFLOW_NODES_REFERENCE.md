# Guía Oficial de Referencia de Nodos — Constructor de Automatizaciones WAPPY IA (`/tareas`)

Esta guía documenta los **8 Equipos de Nodos** del lienzo causal estilo `n8n` de **WAPPY IA** (`workflowNodesCatalog.ts` + `WappyWorkflowCanvas.tsx`), sus claves técnicas en el lienzo, cuándo usar cada uno y cómo encadenarlos de izquierda a derecha sin gastar tokens innecesarios.

---

## Arquitectura Causal de Izquierda a Derecha (DAG)

Todo flujo en `/tareas` avanza estrictamente de izquierda a derecha:

```
[1. Disparadores] ──▶ [2. Extractores Crudos / Hitos Lectura] ──▶ [8. Merge / Loop / IF pre_agent] ──▶ [✨ Extractor IA Docs] ──▶ [3-5. Agente IA + Memoria + Tools] ──▶ [8. IF post_agent] ──▶ [6-7. Hitos Destino + Salidas]
```

---

## Equipo 1: Disparadores (`TRIGGER_NODES`)

Inician la ejecución del flujo (no procesan documentos por sí mismos):

| ID (`nodeId`) | Etiqueta en Lienzo | Uso Principal |
| :--- | :--- | :--- |
| `schedule_cron` | **Cron Programado** | Ejecución periódica por horario (diario, semanal, mensual, cada X horas). |
| `trigger_tenshi` | **Tenshi IA** | Disparo instantáneo por orden de voz o chat a Tenshi. |
| `trigger_antigravity` | **Antigravity Local** | Disparo desde Google Antigravity en Mac/PC vía Push SSE + MCP. |
| `trigger_antigravity_cloud` | **Antigravity Cloud** | Disparo 24/7 desde Google Antigravity Cloud (`antigravity.google.com`). |
| `trigger_email` | **Correo Entrante** | Se activa al recibir un correo en Gmail (incapacidad, FURAT, ARL). |
| `trigger_agent` | **Agente IA** | Encadenamiento o delegación desde otro Agente Especialista. |
| `trigger_qr_worker` | **Reporte QR** | Envío de reporte de acto/condición insegura o inspección desde código QR en campo. |
| `trigger_webhook` | **Webhook API** | Evento externo HTTP desde ERP, Buk RRHH o formularios corporativos. |

---

## Equipo 2: Extractores de Datos (`EXTRACTOR_NODES`)

Obtienen archivos, correos, expedientes o datos externos para alimentar el flujo.

### Comparativa Clave: ¿Transporte sin IA vs. `✨ Extractor IA de Documentos`?

| Nodo | Clave en Lienzo | ¿Consume IA / OCR? | Qué hace exactamente | Qué entrega en `OUTPUT` |
| :--- | :--- | :---: | :--- | :--- |
| **Extraer de Drive** (`extract_drive`) | `extractor_extract_drive` | ❌ **No (`0` tokens)** | Lista y transporta archivos/hojas desde una carpeta de Google Drive (metadatos y texto nativo directo). | Lista de archivos encontrados (`nombre`, `mimeType`, `fecha`, enlace/texto base). |
| **Leer Gmail** (`extract_gmail`) | `extractor_extract_gmail` | ❌ **No (`0` tokens)** | Filtra correos entrantes en Gmail por remitente, asunto, ventana de tiempo o adjuntos. | Lista de correos y referencias de adjuntos (`remitente`, `asunto`, `snippet`, `adjuntos`). |
| **Carpeta en mi PC** (`extract_pc_folder`) | `extractor_extract_pc_folder` | ❌ **No (`0` tokens)** | Lee el listado de archivos de una carpeta local en Mac/PC a través de Google Antigravity Local. | Lista de archivos locales detectados (`ruta`, `nombre`, `extensión`, `fecha`). |
| **✨ Extractor IA de Documentos** (`extract_ai_doc_ocr`) | `extractor_extract_ai_doc_ocr` | ✅ **Sí (IA + Visión OCR Multimodal)** | Inspirado en el `Information Extractor` de n8n: abre cada PDF digital o escaneado, foto, Word o correo entregado por el paso anterior y extrae **únicamente las columnas exactas** que definas en tu esquema. | Tabla homogénea y estructurada (`Archivo Origen`, `Método Lectura` + tus columnas exactas, ej. `Cédula`, `Diagnóstico`, `Fecha`). |

---

### Ficha Técnica Detallada: `✨ Extractor IA de Documentos (PDF / OCR -> Datos Exactos)`

- **ID del catálogo (`id`):** `extract_ai_doc_ocr`
- **Clave en el lienzo (`key`):** `extractor_extract_ai_doc_ocr`
- **Nombre corto en lienzo:** `Extractor IA Docs` · **Insignia:** `✨ Usa IA + OCR`
- **Modelos IA / Visión OCR soportados (verificados en `.env`):**
  - `gemini-3.6-flash` *(Por defecto — equilibrio ideal entre velocidad OCR y precisión estructurada)*
  - `gemini-3.5-flash-lite` *(Ultra rápido — documentos digitales simples)*
  - `gemini-3.8-flash` *(Máxima precisión — tablas densas, sellos médicos o letra manuscrita)*

#### 1. ¿Cuándo usarlo?
Úsalo siempre que tus archivos de origen sean **documentos no estructurados o escaneados** —por ejemplo: PDFs de conceptos médicos ocupacionales (EMO), reportes FURAT/ATEL en PDF o imagen, incapacidades médicas fotografiadas por trabajadores, o certificados de trabajo en alturas/SENA— y necesites convertirlos en una **tabla limpia con columnas fijas** antes de que el Agente IA cruce o guarde los datos en Somos SST o Google Sheets.

Si solo necesitas saber qué archivos llegaron a una carpeta o leer una hoja estructurada sin OCR, usa únicamente `Extraer de Drive`, `Leer Gmail` o `Carpeta en mi PC` sin añadir este nodo.

#### 2. Configuración del Esquema Exacto (`aiExtractionSchema`)
Dentro del modal de 3 columnas del nodo (`⚙️ CONFIGURACIÓN`), defines exactamente qué columnas debe devolver la IA:
- **Campos iniciales por defecto:** `Cédula` (`string`), `Diagnóstico` (`string`), `Fecha` (`date`).
- **Tipos de dato soportados por columna:**
  - `string` (`Texto`)
  - `date` (`Fecha`, normalizada p. ej. `AAAA-MM-DD`)
  - `number` (`Número`)
  - `boolean` (`Sí / No`)
- **Pista opcional por campo (`description`):** Instrucción breve para desambiguar el campo en el documento (ej. *"Número de documento sin puntos"*, *"Código CIE-10 o hallazgo principal"*).
- **Modo de salida por documento (`aiExtractionRowMode`):**
  - `single_row`: **1 fila por cada documento leído** (ej. 1 certificado EMO = 1 fila de trabajador).
  - `multiple_rows`: **Varias filas por documento** (ej. un acta de asistencia o listado PDF con 15 trabajadores).
- **Plantillas rápidas de 1 clic incluidas:**
  - `🩺 Concepto Médico / EMO` (`Cédula`, `Nombre Trabajador`, `Concepto Aptitud`, `Diagnóstico / Restricciones`, `Fecha Examen`)
  - `🚑 Reporte FURAT / ATEL` (`Cédula`, `Nombre Trabajador`, `Fecha Accidente`, `Diagnóstico / Lesión`, `Descripción del Evento`)
  - `🏥 Incapacidad Médica` (`Cédula`, `Diagnóstico CIE-10`, `Días Incapacidad`, `Fecha Inicio`, `EPS`)
  - `🪖 Certificado Alturas / Curso` (`Cédula`, `Nombre Trabajador`, `Nivel Curso`, `Entidad Certificadora`, `Fecha Expedición`)
- **Prueba real bajo demanda (`⚡ Extraer Datos con IA Ahora` / `▶ Probar paso`):**
  Hereda automáticamente la carpeta o bandeja configurada en el nodo anterior (`Extraer de Drive`, `Carpeta en mi PC` o `Leer Gmail`), ejecuta `runAiExtraction=1` en vivo contra los archivos reales y pinta la tabla resultante en la columna derecha `📤 OUTPUT`.

#### 3. Cómo conectarlo en el lienzo (Patrón Recomendado de `0` Tokens en Reposo)

A diferencia de los extractores crudos que van en paralelo en la Etapa 2 (`x = 168`), `Extractor IA Docs` se ubica **secuencialmente después** de `Extraer de Drive` / `Leer Gmail` / `Carpeta en mi PC` porque consume los archivos que ellos entregan:

1. **Topología A — Con Compuerta `Condición Si/No` antes del Agente (`ifPlacement: 'pre_agent'`, Recomendada para Cron frecuentes):**
   ```
   [Cron Programado] ──▶ [Extraer de Drive (solo archivos nuevos)] ──▶ [Condición Si/No: ¿Llegaron archivos nuevos?]
                                                                              ├── (sí) ──▶ [✨ Extractor IA Docs] ──▶ [Agente IA] ──▶ [Guardar en Somos SST / Gmail]
                                                                              └── (no) ──▶ (Fin silencioso · 0 llamadas a OCR y 0 tokens de IA gastados)
   ```
   - Cuando la carpeta no tiene PDFs nuevos, la rama `no` salta tanto a `✨ Extractor IA Docs` como al `Agente IA`, garantizando **costo cero (`0` tokens)** en barridos periódicos sin novedades.

2. **Topología B — Directa (Bajo demanda o con `Condición Si/No` después del Agente):**
   ```
   [Tenshi IA / Correo Entrante] ──▶ [Leer Gmail / Extraer de Drive / Carpeta en mi PC] ──▶ [✨ Extractor IA Docs] ──▶ [Agente IA] ──▶ [Salidas]
   ```

---

### Otros Extractores Especializados del Equipo 2

| ID (`nodeId`) | Etiqueta Corta | Descripción |
| :--- | :--- | :--- |
| `extract_sst_workers` | **Extraer Trabajadores** | Extrae expedientes 360°, cargos, EMO, alturas y entregas de EPP desde Somos SST. |
| `extract_sst_app` | **Extraer Aplicativo SST** | Lee matrices y registros actuales de los 8 Hitos de Somos SST. |
| `extract_web_scraping_agy` | **Web Scraping AGY** | Ejecuta scripts Python/Node/Playwright vía Google Antigravity para extraer tablas web. |
| `scraper_agy_alto_riesgo` | **Alto Riesgo & SENA** | Consulta certificados de Alturas (MinTrabajo) y SENA Sofia Plus por cédula vía Antigravity. |
| `scraper_agy_arl_directo` | **Certificados ARL** | Verifica afiliación directa por cédula en ARL SURA, Positiva, Colmena, AXA y Bolívar. |
| `scraper_agy_vial_pesv` | **SIMIT & RUNT Vial** | Audita comparendos SIMIT, licencia RUNT Persona y SOAT/RTM RUNT Vehículo por cédula o placa. |
| `scraper_agy_antecedentes` | **Antecedentes & Rama** | Consulta antecedentes y procesos en 6 portales oficiales colombianos por cédula. |
| `extract_web_search` | **Búsqueda Web** | Consulta en vivo portales normativos y resoluciones en internet. |

---

## Equipos 3, 4 y 5: Cerebro del Agente IA, Memorias y Herramientas

- **Equipo 3 — Motor / Cerebro IA (`AI_MODEL_NODES`):**
  - `gemini-3.6-flash` (WAPPY IA · Balance óptimo con rotación de claves)
  - `gemini-3.5-flash-lite` (WAPPY IA · Alta velocidad para barridos frecuentes)
  - `gemini-3.8-flash` (WAPPY IA · Análisis normativo y técnico profundo)
  - `antigravity` / `antigravity_cloud` (Delegación con 110+ herramientas MCP en Mac/PC o Cloud 24/7)
- **Equipo 4 — Memorias (`MEMORY_NODES`):**
  - `wappy_memory_company` (*Memoria Empresa SST*: NIT, CIIU, Nivel de Riesgo ARL, sedes)
  - `wappy_memory_antiduplicate` (*Memoria Bitácora Anti-Duplicados*: evita reprocesar archivos o cédulas ya atendidas)
  - `wappy_rag_documental` (*RAG Documental*: cuadernos de Google NotebookLM y Documentos Vivo)
  - `wappy_memory_procedural` (*Memoria Normativa*: Decreto 1072, Res. 0312, GTC-45, Res. 2764, PESV y SGA)
- **Equipo 5 — Herramientas, Skills y Sub-Agentes (`INPUT_CONNECTOR_NODES` + `SKILL_RULE_SUBAGENT_NODES`):**
  - Conectores satelitales conectados debajo del Agente IA para cálculos normativos, consultas puntuales y sub-agentes especialistas (Médico Laboral, Abogado Laboral SST, Ingeniero Químico SGA, Psicólogo SST, etc.).

---

## Equipo 6: Aplicativos de los 8 Hitos SG-SST (`HITO_APP_NODES`)

Cada aplicativo de Somos SST puede actuar en el flujo con uno de dos roles causales (`hitoRole`):
- **`source_read` (Fuente de Lectura — Izquierda del Agente):** Extrae brechas, vencimientos o registros actuales del aplicativo hacia el Agente IA.
- **`target_write_report` (Destino de Escritura / Informe — Derecha del Agente):** Guarda los hallazgos estructurados o genera el informe oficial dentro del aplicativo de Somos SST.

---

## Equipo 7: Bitácora y Salidas (`OUTPUT_ACTION_NODES`)

Ejecutan la entrega final de resultados a la derecha del flujo:
- `email_report` (**Bitácora a Gmail**), `wappy_notification` (**Notificar en WAPPY**), `somos_sst_update` (**Guardar en Somos SST**), `acpm_task` (**Centro de Control Kanban**), `canvas_doc` (**Documento LiveEditor**), `google_sheets` (**Exportar Google Sheets**), `google_docs` (**Exportar Google Docs**), `google_calendar` (**Agendar Calendar**), `google_slides` (**Crear Google Slides**), `antigravity_local_report` / `antigravity_cloud_report`.

---

## Equipo 8: Control Lógico DAG (`Condición Si/No`, `Merge`, `Loop`, `Aprobación Humana`)

- **`Condición Si/No` (`if_condition`):**
  - `ifPlacement: 'pre_agent'`: Se evalúa **antes** de `✨ Extractor IA Docs` y del `Agente IA` (ej. `new_external_items` o `critical_findings`), ahorrando el 100% de llamadas a IA cuando no hay novedades.
  - `ifPlacement: 'post_agent'`: Se evalúa **después** del veredicto del `Agente IA` (`ai_verdict`) para ramificar salidas entre la ruta `sí` y la ruta `no`.
- **`Unir / Cruzar Datos` (`merge`):** Consolida múltiples fuentes previas por clave común (ej. `Cédula`) antes del siguiente paso.
- **`Iterar Lotes` (`loop`):** Procesa listas extensas de registros o documentos por lotes controlados.
- **`Aprobación Humana` (`human_approval`):** Pausa la escritura final hasta recibir visto bueno del responsable SST.
