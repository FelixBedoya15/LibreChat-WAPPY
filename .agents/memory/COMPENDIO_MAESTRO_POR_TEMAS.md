# 📚 Compendio Maestro por Temas — LibreChat-WAPPY (2026-11-05)

> **Propósito:** Este documento consolida por áreas temáticas todas las arquitecturas, decisiones técnicas y mejoras implementadas en las conversaciones del proyecto **LibreChat-WAPPY**. Permite mantener el contexto completo en **Antigravity 2.0** y **Antigravity IDE** usando únicamente 4–5 conversaciones maestras activas.

---

## 🎙️ Tema 1: Wappy Studio, Wappy Podcast & Clonación de Voz (24kHz)

### Archivos Clave
- Backend: [`api/server/routes/studio.js`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/routes/studio.js)
- Frontend / Portable: [`client/src/components/Studio/WappyStudioDashboard.tsx`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/Studio/WappyStudioDashboard.tsx), [`client/src/portable/studio/portableApi.ts`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/portable/studio/portableApi.ts)
- Bundles Portables: `client/public/wappystudio.html`, `client/public/wappypodcast.html`

### Arquitectura Consolidada
1. **Síntesis de Podcasts en Gemini 3.8 TTS sin ruido de fondo:**
   - Sanitización prosódica (`sanitizeScriptText`) que convierte etiquetas `<breath>`, `<gasp>`, `|mhm|` en puntuación natural en español.
   - Separación estricta por turnos (`parseSpeakerTurns`) sintetizando cada turno en modo **Single-Speaker `voiceConfig`** a 24kHz PCM WAV con eliminación de DC offset y pausas limpias de `200–220ms`.
2. **Clonación de Voz Ilimitada con OpenVoice V2 Local (24kHz):**
   - Los turnos con voces clonadas (`wappy_clone_...`) se enrutan directamente por **Gemini 3.8 TTS + convertidor local OpenVoice V2 ToneColorConverter a 24kHz** sin latencia externa de HuggingFace.
   - Normalización automática del WAV de referencia (8–15s DSP preprocessing) y persistencia de voces clonadas para Host 1 (`CH 01`) y Host 2 (`CH 02`) sin sobrescribir la selección del usuario.
3. **Interfaz Walkman Hi-Fi & Cabina ON-AIR:**
   - En `/wappypodcast` (`podcastOnly={true}`), reproductor `WappyCassetteWalkmanPlayer` con bobinas animadas, vúmetros LED estéreo y cabina dual para los dos locutores.

---

## 🔌 Tema 2: Puente Reactivo Google Antigravity (v2.6.0), NotebookLM & Google Flow

### Archivos Clave
- Puente MCP y SSE: [`api/server/routes/mcpBridge.js`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/routes/mcpBridge.js)
- Daemon Local: [`bin/wappy-antigravity-daemon.js`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/bin/wappy-antigravity-daemon.js) (`~/.gemini/antigravity/wappy-push-daemon.js`)
- Herramienta Estructurada: [`api/app/clients/tools/structured/GoogleAntigravity.js`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/app/clients/tools/structured/GoogleAntigravity.js)
- Conectores Google: [`api/server/routes/notebooklm.js`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/routes/notebooklm.js), [`api/server/routes/googleflow.js`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/routes/googleflow.js), [`config/notebooklm/multi_user_server.py`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/config/notebooklm/multi_user_server.py)

### Arquitectura Consolidada
1. **Mapeo Multitenant Empresa ↔ Workspace en Antigravity v2.6.0:**
   - Cada empresa (`CompanyInfo.antigravityWorkspace`) se enlaza a su carpeta local de trabajo y mantiene un **hilo aislado por empresa** (`wappy-tenshi-thread-${safeCompanyId}.json`) para no mezclar contextos entre clientes.
   - Selector dual **Local / Cloud / Auto** sincronizado por Push SSE entre Wappy Studio, Configuración de Cuenta y `McpAntigravityView`.
2. **Prioridad de Autenticación Inquebrantable (`requireApiKeyOrJwt`):**
   - Orden estricto: `1) wpy_live_...` ➔ `2) JWT` ➔ `3) Cookie refreshToken` ➔ `4) wpy_guest_...`. Una clave de visitante jamás degrada a un usuario autenticado.
3. **Google Flow & NotebookLM sin revocación de `SID`:**
   - En `googleflow.js`, Chromium Headless se usa con **0 cookies del usuario** solo para acuñar el token `reCAPTCHA Enterprise`, mientras las llamadas autenticadas van por HTTP puro (`axios`).
   - En imágenes, el **Intento 0 (Prioridad #1)** delega a Antigravity si hay daemon conectado y cae en respaldo automático a Google Flow / Wappy Cloud si no reclama en 10s.

---

## 🧠 Tema 3: Tenshi Voice, Enrutamiento de Agentes & Pool de Claves Gemini

### Archivos Clave
- Router de Agentes: [`api/server/controllers/agents/client.js`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/controllers/agents/client.js)
- Rotación y Fallback Gemini: [`api/server/routes/sgsst/sgsstGemini.js`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/routes/sgsst/sgsstGemini.js), [`api/server/services/GeminiPoolManager.js`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/services/GeminiPoolManager.js)
- Voz en Vivo: [`api/server/services/voice/geminiLive.js`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/services/voice/geminiLive.js), [`api/server/services/voice/voiceSession.js`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/services/voice/voiceSession.js)

### Arquitectura Consolidada
1. **Modelos Activos en `.env`:**
   - Texto y Agentes: `gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-3.8-flash`.
   - Voz Multimodal Live: `gemini-3.8-live`, `gemini-3.1-flash-live-preview`.
   - TTS: `gemini-3.8-flash-tts`, `gemini-3.1-flash-tts-preview`, `gemini-3.8-flash-lite-tts`.
2. **Tenshi Voice & Continuidad de Chat:**
   - `inputAudioTranscription: {}` y `outputAudioTranscription: {}` siempre vacíos (evita Error `1011`).
   - Cero nombres de herramientas duplicados en `functionDeclarations` (evita Error `1007`).
   - Despacho triple simultáneo (`methods.handleSubmit`, `submitMessage`, `form.requestSubmit()`) + watchdog de 3s.

---

## 🛡️ Tema 4: Módulos SG-SST ("Somos SST"), Diseño UI 14-Group & Barra Lateral

### Archivos Clave
- Componentes SG-SST: `client/src/components/SGSST/**/*` ([`SGSSTHeroHeader.tsx`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST/SGSSTHeroHeader.tsx), [`PerfilesCargo.tsx`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST/PerfilesCargo.tsx), [`PerfilSociodemografico.tsx`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST/PerfilSociodemografico.tsx))
- Barra Lateral y Consolidación de Chats: [`client/src/components/Conversations/Conversations.tsx`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/Conversations/Conversations.tsx), [`api/server/routes/convos.js`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/routes/convos.js)
- Botón Oficial: [`client/src/components/Common/ExpandableButton.tsx`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/Common/ExpandableButton.tsx)

### Arquitectura Consolidada
1. **35 Módulos SG-SST Persistentes con IA:**
   - Auto-guardado, auto-carga y expansión automática de informes de Análisis IA en los 35 módulos.
   - Homologación 100% de las 60/60 casillas del Perfil Sociodemográfico y Condiciones de Salud con plantillas Excel y Column Mapper.
   - Expansión en línea de filas en `PerfilesCargo` y doble botón `Generar IA` en toolbar + cabecera de Análisis IA.
2. **Organización de Conversaciones en Barra Lateral (`Conversations.tsx`):**
   - Sección de **Anclados** (`📌`) + Acordeón **`Inactivos (+3 días)`** con modal **`✨ Unir / Organizar`** (`POST /api/convos/consolidate-inactive`).

---

## 🚀 Tema 5: Infraestructura VPS (`srv999875`), Dokploy & Compilación

### Archivos Clave
- Skill de Despliegue: [`.agents/skills/wappy-build-and-deploy/SKILL.md`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/.agents/skills/wappy-build-and-deploy/SKILL.md)
- Reglas Maestras: [`AGENTS.md`](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/AGENTS.md)

### Arquitectura Consolidada
1. **Compilación Local Obligatoria (`client/dist`):**
   - `Dockerfile.multi` en Dokploy (`72.60.124.130`) copia directamente `client/dist`. Todo cambio en `client/src/**` requiere `npm run build:client` y commitear `client/src` + `client/dist`.
2. **Sincronización en Producción:**
   - Dokploy tiene activo el auto-deploy desde GitHub (`main`), o se sincroniza en caliente con `git pull` + `docker cp client/dist/. LibreChat:/app/client/dist/`.
