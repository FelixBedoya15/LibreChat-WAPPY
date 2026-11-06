---
name: wappy-google-connectors
description: "Arquitectura de conectores e integraciones de WAPPY IA: Puente Reactivo Antigravity (wappy-push-daemon.js, mcpBridge.js), NotebookLM, Google Flow Veo/Imagen, Drive y OneDrive."
category: integrations-and-mcp
bundle: wappy-platform-and-sgsst
risk: safe
source: self
source_type: self
date_added: "2026-10-28"
author: wappy-ia
agents: [wappy-integrations-hub, wappy-backend-api]
tags: [integrations, antigravity, mcp-bridge, notebooklm, google-flow, google-drive, onedrive, sse]
---

# Arquitectura de Integraciones y Conectores Externos de WAPPY IA (`wappy-google-connectors`)

## Overview

Esta skill consolida el mapa técnico de rutas, daemons, sesiones y herramientas MCP para todas las integraciones de **LibreChat-WAPPY** con el ecosistema externo: **Google Antigravity**, **Google NotebookLM**, **Google Flow (Veo/Imagen)**, **Google Drive/Calendar/Gmail** y **Microsoft OneDrive**.

## When to Use

- **Usar SIEMPRE** que se conecte, depure, audite o amplíe cualquiera de los puentes externos (`wappy-push-daemon.js`, `mcpBridge.js`, `notebooklm.js`, `googleflow.js`, `googleDrive.js`, `hito1DriveService.js`, `sociodemograficoDriveService.js`, `oneDrive.js`).

## Prerequisites

- Binario autorizado de primera parte `~/.gemini/antigravity/wappy-push-daemon.js` y estado en `~/.gemini/antigravity/wappy-env.json` / `wappy-keys.json`.
- Variables OAuth2 configuradas en `.env` para Google Drive y Microsoft OneDrive.

---

## How It Works

### 1. Puente Reactivo WAPPY <-> Google Antigravity (`wappy-push-daemon.js`)

#### Archivos Clave:
- **Daemon Local (Mac/Cliente):** `~/.gemini/antigravity/wappy-push-daemon.js` (y copia en `bin/wappy-antigravity-daemon.js`).
- **Servidor MCP Local/Remoto:** `bin/wappy-mcp.js` y `api/server/routes/mcpBridge.js` (con todas las herramientas `wappy_*`).
- **Despachador de Tenshi:** `api/server/routes/voice/tenshiMcpDispatcher.js`.
- **Archivos de Estado Local:** `~/.gemini/antigravity/wappy-env.json`, `wappy-keys.json`, `wappy-push-daemon.pid`, `wappy-push-daemon.log`, `wappy-tenshi-thread.json` (TTL de 2h para continuidad de hilo).

#### Flags y Comandos Autorizados (First-Party CLI):
- Iniciar/verificar daemon reactivo SSE: `node ~/.gemini/antigravity/wappy-push-daemon.js --daemon`
- Conectar sesión privada de NotebookLM: `node ~/.gemini/antigravity/wappy-push-daemon.js --notebooklm`
- Conectar sesión privada de Google Flow: `node ~/.gemini/antigravity/wappy-push-daemon.js --googleflow`
- Enviar archivo directo al chat/Canvas de Tenshi: `node ~/.gemini/antigravity/wappy-push-daemon.js --send-file <ruta>`

#### Regla Inquebrantable de Arquitectura y Autenticación:
- La comunicación Tenshi <-> Antigravity usa **Event-Driven Push SSE** (`/api/mcp-bridge/antigravity/stream`) + reclamo atómico (`/antigravity/ordenes/:id/claim`) + despertar instantáneo con `~/.gemini/antigravity/bin/agentapi` (`MESSAGE_PRIORITY_HIGH`).
- **Prohibido** programar crons periódicos (`schedule` cada 2 minutos) para hacer polling de órdenes delegadas.
- **Prioridad Estricta en `requireApiKeyOrJwt` (`mcpBridge.js`):** `1) wpy_live_...` ➔ `2) JWT (Authorization / ?token=)` ➔ `3) Cookie refreshToken` ➔ `4) wpy_guest_...`. Una clave `wpy_guest_...` jamás debe degradar a un usuario registrado.

---

### 2. Google NotebookLM / Gemini Notebook (`api/server/routes/notebooklm.js`)

#### Arquitectura y Sesiones Privadas por Usuario:
- **Modelo MongoDB:** `api/models/NotebookSession.js` (perfiles aislados por `userId` en `config/notebooklm/profiles` o `/root/.notebooklm/profiles`).
- **Almacenamiento de Artefactos (`OUTPUT_MEDIA_DIR`):** Se guardan en `client/public/images/` con prefijos `nlm_infographic_`, `nlm_video_`, `nlm_audio_`, `nlm_slides_`, `nlm_doc_` y limpieza automática a los 30 días (`cleanupExpiredFlowAndNotebookMedia`).
- **Herramienta MCP en Wappy:** `wappy_ejecutar_notebooklm` / herramientas `notebook_list`, `notebook_create`, `source_list`, `source_add`, `chat_ask`, `studio_generate` (`audio`, `quiz`, `flashcards`, `mind_map`, `report`), `studio_status`, `studio_download`, `research_start`, `research_import`.
- **Seguridad:** Prohibido ejecutar `notebook_delete` o `source_delete` sin `confirm=true` explícito del usuario.

---

### 3. Google Flow & Creative Studio — Veo & Imagen (`api/server/routes/googleflow.js`)

#### Arquitectura y Sesiones:
- **Modelo MongoDB:** `api/models/GoogleFlowSession.js` (normalización automática de cookies `.google.com` vía `parseIncomingCookies` o API Key privada por usuario).
- **Almacenamiento Multimedia:** Guarda imágenes y vídeos generados en `client/public/images/flow_*` y los entrega directamente al hilo de chat o al **Canvas de Tenshi**.
- **Herramientas:** `flow_generate_image` (`1:1`, `16:9`, `9:16`, `4:3`), `flow_generate_video` (Google Veo, 5–10s, movimientos de cámara `orbit`, `pan_left`, `zoom_in`, etc.) y `flow_task_status`.

---

### 4. Google Drive, Calendar, Gmail & Importadores SG-SST (`api/server/routes/googleDrive.js`)

#### Arquitectura OAuth2 Multi-Empresa (`googleAuthHelper.js`):
- `api/server/routes/googleDrive.js`: Flujo OAuth2 (`/api/google-drive/auth` y `/callback`) con normalización estricta de dominio (`https://wappy.club`, nunca `wappy-ia.com`), auto-refresco de tokens (`getUserOAuth2Client`) y credenciales aisladas por usuario + empresa activa (`getScopedAuthValue`: `GOOGLE_DRIVE_ACCESS_TOKEN`, `GOOGLE_DRIVE_REFRESH_TOKEN`, `GOOGLE_DRIVE_EXPIRY`).
- **Importadores SG-SST desde Drive:**
  * `api/server/routes/sgsst/sociodemograficoDriveService.js` (`wappy_importar_trabajadores_drive`).
  * `api/server/routes/sgsst/hito1DriveService.js` (`wappy_importar_hito1_drive`).
- **Scopes incluidos:** `drive`, `calendar.events`, `gmail.send`, `gmail.compose`, `gmail.readonly`.

---

### 5. Microsoft OneDrive & SharePoint (`api/server/routes/oneDrive.js`)

- **Archivos Clave:** `api/server/routes/oneDrive.js`, `api/server/services/oneDriveAuthHelper.js` y `api/config/skills/skill-onedrive.md`.
- **Acciones:** `list_files_and_folders`, `read_document_content`, `create_folder`, `write_file` para cuentas corporativas de Microsoft 365.

---

## Verification

- Ejecutar `node -c <archivo.js>` sobre cualquier archivo modificado en `api/server/routes/` o `bin/`.
- Verificar que no existan colisiones de nombres en las declaraciones de herramientas MCP.

## Safety and Side Effects

- **Risk level:** `safe` — Maneja sesiones OAuth2/cookies aisladas por usuario y empresa. Prohibido eliminar cuadernos o fuentes de NotebookLM sin `confirm=true`.

## Sources and Related Skills

- [`wappy-sgsst-tools`](../wappy-sgsst-tools/SKILL.md)
- [`wappy-build-and-deploy`](../wappy-build-and-deploy/SKILL.md)
