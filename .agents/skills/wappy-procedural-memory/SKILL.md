---
name: wappy-procedural-memory
description: "Sistema de Memoria Procedural y Auto-Aprendizaje Continuo (Reflexion) para el Orquestador y los subagentes de WAPPY IA ante correcciones o bugs complejos."
category: devops-and-governance
bundle: wappy-ops-and-governance
risk: safe
source: self
source_type: self
date_added: "2026-11-06"
author: wappy-ia
agents: [wappy-qa-devops, wappy-design-director, wappy-frontend-ui, wappy-backend-api, wappy-integrations-hub, wappy-tenshi-voice, wappy-video-studio]
tags: [memory, reflexion, continuous-learning, governance, lessons]
---

# Sistema de Memoria Procedural & Auto-Aprendizaje (`wappy-procedural-memory`)

## Overview

Este sistema dota al Orquestador Principal y a los subagentes de `wappy-dev-agency` de **Memoria Procedural Evolutiva**, permitiéndoles aprender de los errores y mejorar continuamente en Diseño UI/UX, Edición de Vídeo, Integraciones, Backend/Voz y QA/DevOps sin inflar el consumo de tokens.

## When to Use

- **Usar SIEMPRE** que el usuario corrija un error (*"no lo hagas así"*, *"cambia ese estilo"*), exprese una preferencia permanente de diseño/video/código, o cuando se resuelva un bug no trivial que no deba repetirse jamás.

## Prerequisites

- Acceso a los archivos de memoria en `/Users/venta/.gemini/teams/wappy-dev-agency/memory/` (y espejo en `.agents/memory/`).

---

## How It Works

### 1. Las 5 Bitácoras de Memoria Procedural (Por Especialidad)

Todas las memorias residen en `/Users/venta/.gemini/teams/wappy-dev-agency/memory/`:

1. 🔌 **`/Users/venta/.gemini/teams/wappy-dev-agency/memory/integrations-lessons.md`**
   - **Dueño:** `wappy-integrations-hub`.
   - **Qué guarda:** Reglas aprendidas sobre el puente WAPPY <-> Antigravity (`wappy-push-daemon.js`, `mcpBridge.js`), Google Flow (`googleflow.js`), Google NotebookLM (`notebooklm.js`), Google Drive/Calendar/Gmail OAuth2 (`googleDrive.js`) y Microsoft OneDrive (`oneDrive.js`).
2. 🎨 **`/Users/venta/.gemini/teams/wappy-dev-agency/memory/design-ui-lessons.md`**
   - **Dueños:** `wappy-design-director` y `wappy-frontend-ui`.
   - **Qué guarda:** Reglas aprendidas sobre estética, espaciado, colores, componentes React, tablas exportables (`LiveEditor`) y correcciones visuales del usuario.
3. 🎬 **`/Users/venta/.gemini/teams/wappy-dev-agency/memory/video-motion-lessons.md`**
   - **Dueño:** `wappy-video-studio`.
   - **Qué guarda:** Preferencias de dirección de arte en vídeos/reels, encuadres, avatares (Félix 3D / Tenshi), tiempos de sincronización de voz, GSAP/Remotion y errores de renderizado evitados.
4. ⚙️ **`/Users/venta/.gemini/teams/wappy-dev-agency/memory/backend-voice-lessons.md`**
   - **Dueños:** `wappy-backend-api` y `wappy-tenshi-voice`.
   - **Qué guarda:** Lecciones técnicas de Express/MongoDB, conectores MCP, WebSockets de Gemini Live API (Tenshi Voice), despacho multiturno y modelos de IA.
5. 🛡️ **`/Users/venta/.gemini/teams/wappy-dev-agency/memory/qa-build-lessons.md`**
   - **Dueños:** `wappy-qa-devops` y el **Orquestador Principal**.
   - **Qué guarda:** Errores de compilación (`npm run build:client`), sincronización de `client/dist`, Docker y despliegues en el VPS (`srv999875`).
6. 🔀 **`/Users/venta/.gemini/teams/wappy-dev-agency/memory/workflow-logic-lessons.md`**
   - **Dueño:** `wappy-workflow-architect`.
   - **Qué guarda:** Reglas aprendidas sobre causalidad DAG de izquierda a derecha (estilo `n8n`), roles `source_read` vs `target_write_report` en aplicativos Hito, compuertas `pre_agent` vs `post_agent`, deduplicación con estado (`processedEntityKeys`), cero nodos redundantes y pruebas lógicas multi-escenario.

---

### 2. Protocolo de 3 Pasos: Leer, Aprender y Destilar

#### Paso 1: Lectura Preventiva antes de Ejecutar (Cero Reincidencia)
Cada vez que un subagente especialista sea convocado para una tarea de su dominio, debe leer primero su archivo `memory/<especialidad>-lessons.md` con `read_file` para verificar qué errores están prohibidos y qué preferencias estéticas o técnicas ya están establecidas.

#### Paso 2: Cristalización Automática al Corregir un Error (`Auto-Learn`)
Siempre que durante una tarea ocurra cualquiera de estos eventos:
- El usuario corrija algo (*"no lo hagas así"*, *"cambia ese estilo"*, *"eso falló"*).
- Un comando, build o render falle y se descubra la causa raíz técnica.
- Se logre una solución de diseño o animación que el usuario apruebe con entusiasmo.

El subagente (o el Orquestador) **DEBE** abrir el archivo `memory/<especialidad>-lessons.md` correspondiente con `edit_file` y añadir una nueva línea numerada con el formato ultra-compacto de **1 sola línea**:
```markdown
N. **[Categoría Corta]** ❌ <Error o anti-patrón cometido> -> ✅ <Procedimiento exacto o regla definitiva para hacerlo bien a la primera>.
```

#### Paso 3: Regla de Compactación y Destilación (Tope Máximo: 50 Reglas)
Para garantizar que los archivos de memoria nunca se vuelvan lentos ni consuman tokens de más:
- Cada bitácora tiene un **límite estricto de 50 reglas**.
- Si al añadir una lección el archivo supera las 50 entradas, el agente debe **fusionar puntos similares** y mover las reglas más permanentes a la `SKILL.md` maestra de esa área (`wappy-ui-design-system`, `protocolo-produccion-videos`, `wappy-sgsst-tools` o `wappy-build-and-deploy`).

---

## Verification

- Comprobar que cada nueva lección registrada ocupe 1 sola línea con el patrón `❌ ... -> ✅ ...` y que el archivo no supere las 50 entradas.

## Safety and Side Effects

- **Risk level:** `safe` — Actualiza únicamente archivos Markdown de memoria procedural del equipo de agentes.

## Sources and Related Skills

- [`wappy-ui-design-system`](../wappy-ui-design-system/SKILL.md)
- [`protocolo-produccion-videos`](../protocolo-produccion-videos/SKILL.md)
- [`wappy-build-and-deploy`](../wappy-build-and-deploy/SKILL.md)
