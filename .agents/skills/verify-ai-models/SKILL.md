---
name: verify-ai-models
description: "Procedimiento obligatorio para verificar modelos de IA en .env (GOOGLE_MODELS) y en la documentación web oficial antes de configurar o modificar modelos en el proyecto."
category: devops-and-governance
bundle: wappy-ops-and-governance
risk: safe
source: self
source_type: self
date_added: "2026-09-23"
author: wappy-ia
agents: [wappy-backend-api, wappy-tenshi-voice, wappy-qa-devops]
tags: [ai-models, gemini, openai, anthropic, env, governance]
---

# Verificación Obligatoria de Modelos de IA en `.env` y en la Web (`verify-ai-models`)

## Overview

Esta skill establece el protocolo obligatorio para cualquier agente que configure, sugiera, rote o modifique identificadores de modelos de IA (Google Gemini, OpenAI, Anthropic, etc.) en **LibreChat-WAPPY**, impidiendo la inyección de modelos obsoletos o ausentes de `.env`.

## When to Use

- **Usar SIEMPRE antes de:**
  1. Configurar o modificar listas de modelos en `api/server/controllers/agents/client.js`, `api/app/clients/*`, `api/services/*` o `api/server/routes/voice/*`.
  2. Actualizar selectores de modelos en el frontend (`client/src/**/*ModelSelector*.tsx`).
  3. Modificar constantes en `packages/data-provider/src/config.ts`.
  4. Proponer modelos de fallback o rotación ante errores `503` o límites de cuota.
  5. Recomendar modelos al usuario o editar archivos `.env`.

## Prerequisites

- Lectura directa del archivo `.env` local (`GOOGLE_MODELS`, `GOOGLE_TITLE_MODEL`, etc.).
- Herramienta `search_web` para consultar la documentación oficial del proveedor cuando se evalúe añadir un modelo nuevo.

---

## How It Works

### 1. Regla de Oro: Prohibición de Asumir Modelos de IA

> [!CRITICAL]
> **ESTÁ TERMINANTEMENTE PROHIBIDO ASUMIR, ADIVINAR O USAR CORTES DE ENTRENAMIENTO ANTIGUOS PARA NOMBRES DE MODELOS DE IA:**
> Nunca asumas de memoria qué modelos existen, cuáles están vigentes o cómo se llaman sus endpoints.

---

### 2. Pasos Obligatorios de Verificación

1. **Revisar SIEMPRE el archivo `.env` del Sistema (`GOOGLE_MODELS`, `GOOGLE_TITLE_MODEL`, etc.):**
   - Leer `.env` antes de tocar cualquier archivo de código para verificar cuáles son los modelos realmente configurados y utilizados en el sistema:
     - **Texto / Agentes / Studio:** `gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-3.8-flash`
     - **Voz Multimodal Live:** `gemini-3.8-live`, `gemini-3.1-flash-live-preview`, `gemini-2.5-flash-native-audio-preview-12-2025`
     - **Síntesis de Voz TTS:** `gemini-3.8-flash-tts`, `gemini-3.1-flash-tts-preview`, `gemini-2.5-flash-preview-tts`, `gemini-3.8-flash-lite-tts`
   - **PROHIBIDO** inyectar modelos de texto que no existan en `GOOGLE_MODELS` del `.env` (como `gemini-2.5-flash`, `gemini-2.0-flash` o `gemini-1.5-flash`).
2. **Ejecutar Búsqueda Web (`search_web`) si se incorpora un modelo nuevo:**
   - Google: `"models/gemini-" site:ai.google.dev/gemini-api/docs/models`
   - OpenAI: `site:platform.openai.com/docs/models`
   - Anthropic: `site:docs.anthropic.com models`
3. **Validar la Fecha y Estado del Modelo:**
   - Confirmar si el modelo está en **GA (General Availability)** o **Preview** y su nomenclatura exacta.
4. **No Degradar Arbitrariamente a Versiones Obsoletas o Ausentes del `.env`:**
   - Si el sistema ya tiene modelos configurados en `.env`, nunca agregues a las listas de fallback modelos antiguos o que no estén en `.env`. Usa estrictamente la escalera de modelos de `.env` (`gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-3.8-flash`).

---

### 3. Registro de Fuentes Oficiales

- **Google Gemini API:** `https://ai.google.dev/gemini-api/docs/models`
- **Vertex AI Model Garden:** `https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models`
- **OpenAI Models:** `https://platform.openai.com/docs/models`
- **Anthropic Claude Models:** `https://docs.anthropic.com/claude/docs/models-overview`

---

## Verification

- Comprobar con `grep` que ningún archivo tocado incluya IDs de modelos deprecados ausentes de `GOOGLE_MODELS` en `.env`.

## Safety and Side Effects

- **Risk level:** `safe` — Regla de auditoría y validación preventiva de configuración.

## Sources and Related Skills

- [`wappy-build-and-deploy`](../wappy-build-and-deploy/SKILL.md)
- [`wappy-procedural-memory`](../wappy-procedural-memory/SKILL.md)
