---
name: verify-ai-models
description: >-
  Regla y procedimiento obligatorio de verificación web en vivo de modelos de IA actuales (Google Gemini, OpenAI, Claude, etc.) antes de configurar, sugerir o modificar modelos en el proyecto.
---

# Verificación Web Obligatoria de Modelos de IA Actuales

Esta skill y memoria permanente es de **CUMPLIMIENTO OBLIGATORIO Y ESTRICTO** para Antigravity o cualquier agente de IA que trabaje en el repositorio LibreChat-WAPPY.

---

## 1. Regla de Oro: Prohibición de Asumir Modelos de IA

> [!CRITICAL]
> **ESTÁ TERMINANTEMENTE PROHIBIDO ASUMIR, ADIVINAR O USAR CORTES DE ENTRENAMIENTO ANTIGUOS PARA NOMBRES DE MODELOS DE IA:**
> Las plataformas de IA (Google Gemini, OpenAI, Anthropic, etc.) evolucionan rápidamente y publican nuevas versiones y deprecaciones constantemente.
> Nunca asumas de memoria qué modelos existen, cuáles están vigentes o cómo se llaman sus endpoints.

---

## 2. Protocolo Obligatorio Antes de Tocar Cualquier Modelo

Siempre que se vaya a:
1. Configurar o modificar listas de modelos en `api/server/controllers/agents/client.js`, `api/app/clients/*`, `api/services/*`.
2. Actualizar selectores de modelos en el frontend (`client/src/**/*ModelSelector*.tsx`).
3. Modificar constantes en `packages/data-provider/src/config.ts`.
4. Proponer modelos de fallback o rotación ante errores 503 o cuotas.
5. Recomendar modelos al usuario o en archivos `.env`.

### Pasos Obligatorios:
1. **Revisar SIEMPRE el archivo `.env` del Sistema (`GOOGLE_MODELS`, `GOOGLE_TITLE_MODEL`, etc.):**
   - Leer `.env` antes de tocar cualquier archivo de código para verificar cuáles son los modelos realmente configurados y utilizados en el sistema:
     - **Texto / Agentes / Studio:** `gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-3.8-flash`
     - **Voz Multimodal Live:** `gemini-3.8-live`, `gemini-3.1-flash-live-preview`, `gemini-2.5-flash-native-audio-preview-12-2025`
     - **Síntesis de Voz TTS:** `gemini-3.8-flash-tts`, `gemini-3.1-flash-tts-preview`, `gemini-2.5-flash-preview-tts`, `gemini-3.8-flash-lite-tts`
   - **PROHIBIDO** inyectar modelos de texto que no existan en `GOOGLE_MODELS` del `.env` (como `gemini-2.5-flash`, `gemini-2.0-flash` o `gemini-1.5-flash`).
2. **Ejecutar Búsqueda Web (`search_web`):**
   - Buscar la documentación oficial del proveedor:
     - Google: `"models/gemini-" site:ai.google.dev/gemini-api/docs/models`
     - OpenAI: `site:platform.openai.com/docs/models`
     - Anthropic: `site:docs.anthropic.com models`
3. **Validar la Fecha y Estado del Modelo:**
   - Confirmar si el modelo está en **GA (General Availability)** o **Preview**.
   - Confirmar la nomenclatura exacta (ej. guiones, versión Flash, Flash-Lite, Pro, etc.).
4. **No Degradar Arbitrariamente a Versiones Obsoletas o Ausentes del `.env`:**
   - Si el sistema ya tiene modelos configurados en `.env`, nunca agregues a las listas de fallback modelos antiguos o que no estén en `.env` (ej. `gemini-2.5-flash`). Usa estrictamente la escalera de modelos de `.env` (`gemini-3.5-flash-lite`, `gemini-3.6-flash`).

---

## 3. Registro de Fuentes Oficiales

- **Google Gemini API:** `https://ai.google.dev/gemini-api/docs/models`
- **Vertex AI Model Garden:** `https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models`
- **OpenAI Models:** `https://platform.openai.com/docs/models`
- **Anthropic Claude Models:** `https://docs.anthropic.com/claude/docs/models-overview`
