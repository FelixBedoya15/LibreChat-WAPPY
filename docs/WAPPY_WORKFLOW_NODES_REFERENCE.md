# Guía Oficial de Referencia de Nodos — Constructor de Automatizaciones WAPPY IA (`/tareas`)

Esta guía documenta los **8 Equipos de Nodos** del lienzo causal estilo `n8n` (`AI Agent` + `Tools`) de **WAPPY IA** (`workflowNodesCatalog.ts` + `WappyWorkflowCanvas.tsx` + `systemWorkflowPresetsCatalog.js`), sus claves técnicas en el lienzo, cuándo usar cada uno y cómo encadenarlos de izquierda a derecha sin gastar tokens innecesarios.

---

## Arquitectura Causal `n8n` de Izquierda a Derecha (`AI Agent` + `Tools`)

Todo flujo en `/tareas` avanza estrictamente de izquierda a derecha, conectando las herramientas y aplicativos de consulta/escritura directamente debajo del `Agente IA` en su puerto **`Herramienta +`** (igual que el nodo `AI Agent` de `n8n`):

```
[1. Disparadores] ──▶ [2. Extractores / Hitos source_read] ──▶ [8. Merge / IF pre_agent] ──▶ [✨ Extractor IA Docs] ──▶ [3. Agente IA] ──▶ [8. IF post_agent / Aprobación] ──▶ [7. Salidas]
                                                                                                                           ▲   ▲   ▲
                                                                                                                  [Modelo IA] [Memoria ◆] [Herramienta + (Tools & Hitos agent_tool)]
```

### Reglas Arquitectónicas Clave del Catálogo Curado (15 Flujos Maestros)
1. **Cero cajas Hito post-agente (`target_write_report` eliminado):** Los aplicativos de los 8 Hitos de Somos SST solo actúan en dos posiciones reales:
   - **`hitoRole: 'source_read'`** (Etapa 2, a la izquierda de `Condición Si/No` y del `Agente IA`): cuando extraen registros estructurados, vencimientos o brechas de la base de datos para alimentar el flujo.
   - **`hitoRole: 'agent_tool'`** (debajo del `Agente IA`, conectado al puerto **`Herramienta +`**): cuando el `Agente IA` consulta contexto cruzado (`read_only`), crea/actualiza registros (`write_and_update`) o guarda y emite el informe oficial del aplicativo (`write_and_report` / `generate_report`).
2. **Todo `Agente IA` tiene `>= 1` herramienta visible en `Herramienta +`:** Ningún flujo deja el puerto `Herramienta +` vacío haciendo acciones ocultas.
3. **Extracción Documental Explícita (`✨ Extractor IA Docs`):** Siempre que un flujo lea PDFs, escaneos o adjuntos desde **Extraer de Drive**, **Leer Gmail** o **Carpeta en mi PC**, incluye secuencialmente **`✨ Extractor IA de Documentos`** (`extract_ai_doc_ocr`) con su `aiExtractionSchema` de 4 a 7 columnas tipadas.

---

## Equipo 1: Disparadores (`TRIGGER_NODES`)

Inician la ejecución del flujo con semántica `OR` (no procesan documentos por sí mismos):

| ID (`nodeId`) | Etiqueta en Lienzo | Uso Principal |
| :--- | :--- | :--- |
| `schedule_cron` | **Cron Programado** | Ejecución periódica por horario (diario, semanal, mensual, cada X horas). |
| `trigger_tenshi` | **Tenshi IA** | Disparo instantáneo por orden de voz o chat a Tenshi. |
| `trigger_antigravity` | **Antigravity Local** | Disparo desde Google Antigravity en Mac/PC vía Push SSE + MCP. |
| `trigger_antigravity_cloud` | **Antigravity Cloud** | Disparo 24/7 desde Google Antigravity Cloud (`antigravity.google.com`). |
| `trigger_email` / `trigger_email_in` | **Correo Entrante** | Se activa al recibir un correo en Gmail (incapacidad, licencia, FURAT, ARL). |
| `trigger_agent` | **Agente IA** | Encadenamiento o delegación desde otro Agente Especialista. |
| `trigger_qr_worker` | **Reporte QR** | Envío de reporte de acto/condición insegura o inspección desde código QR en campo. |
| `trigger_webhook` / `trigger_webhook_in` | **Webhook API** | Evento externo HTTP desde ERP, Buk RRHH o formularios corporativos. |

---

## Equipo 2: Extractores de Datos (`EXTRACTOR_NODES`)

Obtienen archivos, correos o datos externos en Etapa 2 para alimentar el flujo.

### Comparativa Clave: ¿Transporte sin IA vs. `✨ Extractor IA de Documentos`?

| Nodo | Clave en Lienzo | ¿Consume IA / OCR? | Qué hace exactamente | Qué entrega en `OUTPUT` |
| :--- | :--- | :---: | :--- | :--- |
| **Extraer de Drive** (`extract_drive`) | `extractor_extract_drive` | ❌ **No (`0` tokens)** | Lista y transporta archivos nuevos desde una carpeta de Google Drive (`driveFolderQuery` / `driveFolderName`). | Lista de archivos encontrados (`nombre`, `mimeType`, `fecha`, `fileId`). |
| **Leer Gmail** (`extract_gmail`) | `extractor_extract_gmail` | ❌ **No (`0` tokens)** | Filtra correos entrantes en Gmail por consulta (`gmailSearchQuery`), asunto o adjuntos. | Lista de correos y referencias de adjuntos (`remitente`, `asunto`, `fecha`, `adjuntos`). |
| **Carpeta en mi PC** (`extract_pc_folder`) | `extractor_extract_pc_folder` | ❌ **No (`0` tokens)** | Lee el listado de archivos de una carpeta local en Mac/PC a través de Google Antigravity Local. | Lista de archivos locales detectados (`ruta`, `nombre`, `extensión`, `fecha`). |
| **✨ Extractor IA de Documentos** (`extract_ai_doc_ocr`) | `extractor_extract_ai_doc_ocr` | ✅ **Sí (IA + Visión OCR Multimodal)** | Inspirado en el `Information Extractor` de `n8n`: abre cada PDF digital o escaneado, imagen, Word o adjunto entregado por el paso anterior y extrae **únicamente las columnas exactas** definidas en `aiExtractionSchema`. | Tabla homogénea y estructurada con las columnas exactas configuradas (ej. `Cédula`, `Concepto de Aptitud`, `Fecha del Examen`). |

---

### Ficha Técnica Detallada: `✨ Extractor IA de Documentos (PDF / OCR -> Datos Exactos)`

- **ID del catálogo (`id`):** `extract_ai_doc_ocr`
- **Claves en `nodeConfigs`:** `extractor_extract_ai_doc_ocr` y `extract_ai_doc_ocr`
- **Nombre corto en lienzo:** `Extractor IA Docs` · **Insignia:** `✨ Usa IA + OCR`
- **Modelos IA / Visión OCR soportados (verificados en `.env`):**
  - `gemini-3.6-flash` *(Por defecto — equilibrio ideal entre velocidad OCR y precisión estructurada)*
  - `gemini-3.5-flash-lite` *(Ultra rápido — documentos digitales simples)*
  - `gemini-3.8-flash` *(Máxima precisión — formularios densos como FURAT, sellos médicos o letra manuscrita)*

#### 1. Configuración del Esquema Exacto (`aiExtractionSchema`)
Cada campo del esquema define entre 4 y 7 columnas estructuradas con:
- `key`: clave canónica limpia (ej. `cedula`, `concepto_aptitud`, `dias_incapacidad`).
- `label` / `name`: título humano de la columna en español (ej. `Cédula`, `Concepto de Aptitud`).
- `type`: `'string'` | `'date'` | `'number'` | `'boolean'`.
- `required`: `true` | `false`.
- `hint` / `description`: pista semántica precisa para guiar la lectura OCR sobre el documento.

#### 2. Topología de `0` Tokens en Reposo con Compuerta `pre_agent`
```
[Cron Programado] ──▶ [Extraer de Drive / Leer Gmail] ──▶ [Condición Si/No: ¿Archivos o adjuntos nuevos?]
                                                                 ├── (sí) ──▶ [✨ Extractor IA Docs] ──▶ [Agente IA + Herramienta +] ──▶ [Salidas SÍ]
                                                                 └── (no) ──▶ [Notificar en WAPPY] (0 llamadas a OCR y 0 tokens de IA gastados)
```

---

## Equipos 3, 4 y 5: Clúster del Agente IA (`Cerebro`, `Memoria ◆` y `Herramienta +`)

- **Equipo 3 — Motor / Cerebro IA (`AI_MODEL_NODES` verificados en `.env`):**
  - `gemini-3.6-flash` (*WAPPY IA · Balance óptimo con rotación de claves*)
  - `gemini-3.5-flash-lite` (*WAPPY IA · Alta velocidad para controles operativos frecuentes*)
  - `gemini-3.8-flash` (*WAPPY IA · Análisis normativo, causalidad ATEL Res. 1401 y Alta Dirección*)
- **Equipo 4 — Memorias (`MEMORY_NODES` en puerto `Memoria ◆`):**
  - `wappy_memory_company` (*Memoria Empresa SST*: NIT, CIIU, Nivel de Riesgo ARL, sedes y trabajadores)
  - `wappy_memory_antiduplicate` (*Memoria Bitácora Anti-Duplicados*: filtra `processedEntityKeys` dentro de `dedupWindow`: `'24h'`, `'7d'`, `'30d'` o `'all'`)
  - `wappy_rag_documental` (*RAG Documental*: cuadernos de Google NotebookLM y Documentos Vivo)
  - `wappy_memory_procedural` (*Memoria Normativa*: Decreto 1072, Res. 0312, Res. 1843, GTC-45, Res. 4272, PESV y SGA)
- **Equipo 5 — Conectores y Motores en `Herramienta +` (`INPUT_CONNECTOR_NODES`):**
  - Motores especializados y APIs externas conectadas debajo del Agente IA:
    * `consultar_medlineplus_rehabilitacion` (*MedlinePlus NIH — Guías clínicas y readaptación*)
    * `consultar_pubchem_quimico` (*PubChem NIH — Fichas químicas CAS y pictogramas GHS*)
    * `matriz_compatibilidad` (*Motor Químico SGA — Decreto 1496 y segregación NTC 1692*)
    * `matriz_pesv` (*Motor Matriz Vial PESV — Resolución 20223040040595*)
    * `pronostico_clima_sst` (*OpenWeather Clima — Alertas meteorológicas en ruta o campo*)
    * `buscar_centros_emergencia` (*Centros de Emergencia OpenStreetMap — Red hospitalaria MEDEVAC*)
    * `cursos_lms` (*Academia WAPPY LMS — Catálogo y avance formativo*)
    * `web_search` (*Búsqueda Web Legal en Vivo — Vigencia normativa MinTrabajo / SUIN*)

---

## Equipo 6: Aplicativos de los 8 Hitos SG-SST (`HITO_APP_NODES`)

Cada aplicativo conectado en `workflowNodes.hitos` declara su rol explícito tanto en `nodeConfigs[hitoId]` como en `nodeConfigs['tool_hitos_' + hitoId]`:

| `hitoRole` | Posición Visual en el Lienzo | `appActionMode` Permitidos | Cuándo Usarlo |
| :--- | :--- | :--- | :--- |
| **`source_read`** | **Etapa 2 (Izquierda del IF y del Agente IA)** | `'read_only'` | Cuando el flujo audita o filtra registros existentes del aplicativo (vencimientos EMO/Alturas, entregas EPP vencidas, permisos/equipos de alturas, vehículos PESV, inventario químico, matriz legal, estándares 0312). |
| **`agent_tool`** | **Puerto `Herramienta +` (Debajo del Agente IA)** | `'read_only'`, `'write_and_update'`, `'write_and_report'`, `'generate_report'` | Cuando el `Agente IA` consulta datos complementarios (ej. Perfiles de Cargo, Matriz GTC 45, ATS) o registra/actualiza expedientes e informes oficiales en Somos SST (ej. Sociodemográfico, Condiciones de Salud, Estudio de Puesto EPT, Investigación ATEL, Ausentismo, Tablero ACPM, Rutas LMS, Alta Dirección). |

---

## Equipo 7: Bitácora y Salidas (`OUTPUT_ACTION_NODES`)

Ejecutan la entrega final de resultados a la derecha del flujo:
- **Rama `yes` (o flujo directo):** `acpm_task` (**Centro de Control ACPM**), `email_report` (**Bitácora por Correo**), `google_calendar` (**Agendar en Google Calendar**), `canvas_doc` (**Editor en Vivo WAPPY**), `google_sheets` (**Exportar a Google Sheets**), `google_docs` (**Exportar a Google Docs**).
- **Rama `no` (trazabilidad silenciosa sin brechas):** `wappy_notification` (**Notificar en WAPPY**).

---

## Equipo 8: Control Lógico DAG (`Condición Si/No`, `Merge`, `Loop`, `Aprobación Humana`)

- **`Condición Si/No` (`if_router`):**
  - `ifPlacement: 'pre_agent'`: Se evalúa **antes** de `✨ Extractor IA Docs` y del `Agente IA` (`critical_findings` o `new_external_items`), garantizando **`0` tokens LLM** cuando la empresa está 100 % al día o no hay documentos nuevos.
  - `ifPlacement: 'post_agent'`: Se evalúa **después** del `Agente IA` mediante el veredicto estructurado `[VEREDICTO_IF: SI]` / `[VEREDICTO_IF: NO]` (ej. triaje de severidad en reportes QR de campo).
- **`Unir Ramas` (`logicType: 'merge'`):** Obligatorio siempre que existan `>= 2` fuentes paralelas de lectura en Etapa 2 (ej. `Permisos de Alturas + Equipos de Alturas`, `COPASST + Convivencia`, `0312 + Estadísticas ATEL + ACPM`).
- **`Iterar Lotes` (`logicType: 'loop'`):** Procesa colecciones extensas por lotes controlados.
- **`Aprobación Humana` (`logicType: 'human_approval'`):** Pausa el despacho final en estado `awaiting_approval` hasta recibir el visto bueno formal del Responsable SST o la Alta Dirección.
