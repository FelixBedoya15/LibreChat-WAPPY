---
trigger: glob
globs: "**/geminiLive.js, **/voiceSession.js, **/*Voice*.tsx, **/*Tenshi*.tsx, **/*tenshi*.js"
description: "Invariantes críticas de Tenshi Voice (Google Multimodal Live API), prevención de errores 1011/1007, continuidad multiturno y puente Push SSE."
---

# Reglas Contextuales — Tenshi Voice & Google Multimodal Live API

1. **Prevención de Error 1011 (Regla Inquebrantable):**
   - `inputAudioTranscription: {}` y `outputAudioTranscription: {}` **DEBEN ser objetos vacíos `{}`**. Incluir códigos de idioma u otras claves provoca desconexión inmediata con Error `1011`.
2. **Prevención de Error 1007 (Unicidad de Herramientas):**
   - Garantizar cero colisiones o nombres duplicados dentro de `this.liveConfig.tools[0].functionDeclarations`.
3. **Continuidad Multiturno y Despacho Triple:**
   - Mantener el hilo de chat activo (`tenshi-submit-agent-prompt`); no navegar a `/c/new` salvo cambio de asistente o solicitud explícita.
   - Usar despacho triple (`methods.handleSubmit(...)()`, `submitMessage({ text })`, `form.requestSubmit()`) protegido por Watchdog de `3s`.
4. **Modelos de Voz / TTS Verificados en `.env`:**
   - Consultar siempre `GOOGLE_MODELS` en `.env` (`gemini-3.8-live`, `gemini-3.1-flash-live-preview`, `gemini-3.8-flash-tts`, `gemini-3.1-flash-tts-preview`, `gemini-3.8-flash-lite-tts`). Prohibido inyectar modelos ausentes de `.env`.
5. **Puente Reactivo Push SSE:**
   - Toda comunicación Tenshi <-> Antigravity opera por Push SSE (`/api/mcp-bridge/antigravity/stream` + `wappy-push-daemon.js`), sin crons de sondeo innecesarios.
