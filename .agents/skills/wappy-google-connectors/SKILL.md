---
name: wappy-google-connectors
description: >-
  Guía integral para conectar y utilizar Google NotebookLM (RAG con citas exactas, podcasts, quizzes) y Google Flow & Studio (Google Veo para video y Google Imagen para fotos) de forma 100% privada por usuario en LibreChat-WAPPY y Tenshi.
---

# Conectores Privados Google en WAPPY IA (`NotebookLM` + `Google Flow & Studio`)

---

## 1. Google NotebookLM / Gemini Notebook (MCP)

### Ventajas Clave:
1. **Grounded RAG (Citas Exactas `[1]`, `[2]`):** Consulta decretos, resoluciones y manuales extensos sin gastar tokens de la ventana de contexto de LibreChat (*Zero-Token Synthesis*).
2. **Generación Studio para LMS:** Genera podcasts a dos voces (`audio`), cuestionarios (`quiz`), `flashcards`, `mind_map` y `report`.

### Herramientas MCP:
- **Cuadernos y Fuentes:** `notebook_list`, `notebook_create(title)`, `source_list(notebook)`, `source_add(notebook, source_type="url"|"text"|"file")`.
- **Consultas:** `chat_ask(notebook, query)`.
- **Studio:** `studio_generate(notebook, artifact_type)`, `studio_status(task_id)`, `studio_download(artifact_id)`.
- **Deep Research:** `research_start(notebook, query, mode="deep")`, `research_import(task_id)`.
- **Regla de Seguridad:** Nunca ejecutar `notebook_delete` ni `source_delete` sin `confirm=true` solicitado explícitamente por el usuario. Si da error `AUTH`, indicar `npm run notebooklm:auth` o vincular desde **Mi Cuenta → Integraciones → Google NotebookLM**.

---

## 2. Google Flow & Creative Studio (Google Veo & Imagen)

### Herramientas Clave:
- **`flow_generate_image`:** `prompt`, `aspect_ratio` (`1:1`, `16:9`, `9:16`, `4:3`), `style` (`photorealistic`, `cinematic`, `3d_render`, `isometric`, `technical_diagram`).
- **`flow_generate_video`:** `prompt`, `input_image` (opcional), `camera_movement` (`orbit`, `pan_left`, `pan_right`, `zoom_in`, `zoom_out`, `pedestal_up`), `duration_seconds` (5–10s).
- **`flow_task_status`:** `task_id`.

### Entrega y Privacidad:
- Los activos generados se insertan directamente en el chat o en el **Canvas multimedia de Tenshi**.
- Cada usuario conecta su propia cuenta privada desde **Configuración → Integraciones → Google Flow & Studio** (vía script 1-clic, API Key `AIzaSy...` o cookies JSON).
