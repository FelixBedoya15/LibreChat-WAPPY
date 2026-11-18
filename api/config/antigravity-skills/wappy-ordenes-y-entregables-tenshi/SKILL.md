---
name: wappy-ordenes-y-entregables-tenshi
description: "Atiende, estructura y entrega órdenes en tiempo real delegadas desde Tenshi Voz/Chat ('ORDEN EN TIEMPO REAL — PUENTE REACTIVO PUSH WAPPY'), Nodos de Flujos Autónomos ('/tareas' — sgsst_workflow_antigravity / sgsst_automation), Wappy Studio o envíos espontáneos de archivos locales (.pdf, .png, .xlsx, .docx, .mp4), documentos LiveEditor y dashboards HTML hacia WAPPY IA. Activa esta skill siempre que recibas una orden del Puente Reactivo Push de WAPPY o cuando el usuario pida enviar un archivo, informe o entregable desde Antigravity al chat o Canvas de Tenshi."
---

# Despachador Maestro de Órdenes en Tiempo Real y Entregables de Tenshi (`wappy-ordenes-y-entregables-tenshi`)

## Overview

Esta skill define el contrato exacto de extremo a extremo para procesar y cerrar órdenes reactivas recibidas por el **Puente Push SSE de WAPPY IA** (`0 ms` de latencia), garantizando que cada entregable llegue al canal correcto (**Tenshi Voz/Chat**, **`LiveEditor` / Canvas**, **Flujo Autónomo `/tareas`** o **Wappy Studio**) sin truncamientos, sin archivos corruptos y sin cruces de canales.

---

## When to Use

Activa esta skill inmediatamente cuando:
- El prompt entrante comience con un encabezado del puente reactivo:
  `⚡ [ORDEN EN TIEMPO REAL — CANAL: ... — PUENTE REACTIVO PUSH WAPPY]` (con `ID de Orden: <id>`).
- El usuario te pida desde Antigravity: *"envíale este PDF / Excel / imagen / informe a Tenshi"* o *"mándalo al Editor en Vivo de WAPPY"*.
- La herramienta MCP `wappy_completar_orden_delegada_tenshi` aún esté cargando o necesites enviar un archivo binario pesado (`.pdf`, `.png`, `.xlsx`, `.docx`, `.mp4`) o un documento extenso desde disco (`--contenido-file`) sin límite de caracteres en argumentos de herramienta.

---

## Matriz Oficial de los 4 Formatos de Entrega

Selecciona **siempre** el formato exacto que exige el campo `Tipo de Solicitud` de la orden (o la intención explícita del usuario):

| Formato (`--formato`) | Cuándo Usarlo | Reglas Críticas del Payload |
| :--- | :--- | :--- |
| `respuesta` | Preguntas conversacionales, consultas rápidas de datos o cierre de **Nodos de Flujos Autónomos (`/tareas`)**. | Envía texto claro y estructurado en `resultado`. **PROHIBIDO** crear archivos o documentos innecesarios en Canvas cuando solo hicieron una pregunta. |
| `documento` | Informes técnicos SG-SST, actas, políticas, procedimientos, matrices exportables a Word/PDF en **`LiveEditor`**. | Envía **Markdown puro estructurado** (`##`, `###`, tablas `\| A \| B \|`, **mínimo 300 caracteres**). **PROHIBIDO** envolver en `<!DOCTYPE html>` o `<html>` (WAPPY inyecta automáticamente el cabezote corporativo oficial con NIT/logo y firmas digitales). |
| `html` | Aplicativos interactivos, calculadoras SST, dashboards ejecutivos o escenas `1080×1920` de **Wappy Studio**. | Envía el documento `<!DOCTYPE html>...</html>` completo y autocontenido en `contenido` (`--contenido-file` recomendado). |
| `copia_archivo` | Envío de un archivo real existente o recién descargado en el PC del usuario (`.pdf` oficial de ARL/Alturas, `.png`, `.xlsx`, `.docx`, `.mp4`, `.zip`). | **PROHIBIDO** transcribir o inventar un archivo sustituto. Usa `--file=<ruta_absoluta>` para transmitir la copia binaria intacta verificada por bytes mágicos y SHA-256. |

---

## Reglas Inquebrantables de Aislamiento de Canales y Multimodalidad

1. **Separación Estricta entre Tenshi Voz/Chat y Flujos Autónomos (`/tareas`):**
   - Si el encabezado de la orden indica `sourceModule: sgsst_workflow_antigravity` o `sgsst_automation` (Canal `/tareas`), tu respuesta resuelve **únicamente** el nodo en espera del flujo DAG en `/tareas`.
   - **PROHIBIDO** decir que la respuesta fue enviada a Tenshi Voz; confirma explícitamente que fue entregada al Flujo Autónomo de WAPPY (`/tareas`).
2. **Inspección Obligatoria de Evidencia Multimodal de Cámara (`/tmp/wappy_media_...`):**
   - Si la orden contiene la sección `📸🎥 [EVIDENCIA VISUAL EN VIVO DE LA CÁMARA DE TENSHI DESCARGADA EN DISCO LOCAL]`, **DEBES** llamar primero a `read_file` sobre cada ruta local `/tmp/wappy_media_...` antes de diagnosticar condiciones inseguras, EPP o redactar tu respuesta.
3. **Cero Cierres Vacíos o Truncados:**
   - Para `documento` y `html`, guarda primero el contenido completo en un archivo temporal (ej. `/tmp/entregable_${ordenId}.md` o `.html`) y entrégalo con `entregar-a-tenshi.js --contenido-file=...` para evitar errores de escape en comillas de terminal.

---

## Uso del Despachador CLI (`scripts/entregar-a-tenshi.js`)

El script `entregar-a-tenshi.js` valida existencia, tamaño, tipo MIME real por bytes mágicos (`%PDF`, `\x89PNG`, JPEG, MP4, Office OpenXML `PK\x03\x04`), calcula `SHA-256` y ejecuta entrega HTTP con reintentos seguros (`exponential backoff`):

```bash
# Caso 1: Enviar copia binaria exacta de un archivo local (.pdf, .png, .xlsx, .docx, .mp4)
# Funciona tanto CON --orden-id como SIN --orden-id (envío espontáneo directo al chat de Tenshi)
node ~/.gemini/antigravity/skills/wappy-ordenes-y-entregables-tenshi/scripts/entregar-a-tenshi.js \
  --file="/ruta/absoluta/Certificado_ARL_SURA_1146635472.pdf" \
  --orden-id="673a9f..." \
  --summary="Certificado oficial de afiliación activa en ARL SURA verificado por cédula."

# Caso 2: Entregar un Documento Técnico al Editor en Vivo (LiveEditor / Word / PDF)
node ~/.gemini/antigravity/skills/wappy-ordenes-y-entregables-tenshi/scripts/entregar-a-tenshi.js \
  --orden-id="673a9f..." \
  --formato=documento \
  --title="Informe Técnico de Inspección Locativa SG-SST" \
  --summary="Informe estructurado bajo Decreto 1072 de 2015 con plan de acción 5W2H." \
  --contenido-file="/tmp/informe_inspeccion.md"

# Caso 3: Entregar Aplicativo Interactivo / Video HTML5
node ~/.gemini/antigravity/skills/wappy-ordenes-y-entregables-tenshi/scripts/entregar-a-tenshi.js \
  --orden-id="673a9f..." \
  --formato=html \
  --summary="Dashboard interactivo de accidentalidad ATEL listo en Canvas." \
  --contenido-file="/tmp/dashboard_atel.html"

# Caso 4: Responder pregunta directa o cerrar nodo de Flujo Autónomo (/tareas)
node ~/.gemini/antigravity/skills/wappy-ordenes-y-entregables-tenshi/scripts/entregar-a-tenshi.js \
  --orden-id="673a9f..." \
  --formato=respuesta \
  --resultado="La empresa cuenta con 24 trabajadores activos y cumplimiento 0312 del 88.5% (Aceptable)."
```

---

## Routing Table (Progressive Disclosure)

- Para revisar los contratos JSON exactos del endpoint `/antigravity/ordenes/:id/completar`, las **reglas anti-corrupción de tablas para `html-docx` en `LiveEditor`**, la plantilla maestra de documentos ejecutivos SG-SST y el checklist de calidad pre-entrega, lee `references/contratos-entregables-y-liveeditor.md`.
