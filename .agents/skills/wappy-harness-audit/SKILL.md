---
name: wappy-harness-audit
description: "Audita la salud integral de la agencia WAPPY IA (.agents/skills, .agents/agents, .agents/rules, .agents/hooks.json y memoria procedural), ejecuta stocktake determinista, aplica diagnóstico de 12 capas (para Antigravity y para Tenshi/WAPPY IA en producción) y define evaluaciones Capability/Regression (EDD). Úsala periódicamente, antes de modificar prompts/skills/agentes o cuando un agente degrade su comportamiento."
category: devops-and-governance
bundle: wappy-ops-and-governance
risk: safe
source: self
source_type: self
date_added: "2026-11-20"
author: wappy-ia
agents: [wappy-qa-devops, wappy-backend-api, wappy-live-tester]
tags: [audit, harness, stocktake, eval, hooks, rules, memory, governance, 12-layer]
---

# Auditoría Integral del Harness & Arquitectura de Agentes (`wappy-harness-audit`)

## Overview

Skill oficial de gobernanza, salud y evaluación de la Agencia de Desarrollo **WAPPY IA** (`LibreChat-WAPPY`). Combina tres capacidades prácticas inspiradas en ingeniería de *harnesses* modernos, adaptadas nativamente a **Google Antigravity 2.0**:

1. **Stocktake Determinista del Harness (`audit-wappy-harness.js`):** verifica integridad de skills, subagentes, reglas `glob`, `hooks.json`, sincronización de índices, límites de memoria procedural y ausencia de modelos deprecados o secretos expuestos.
2. **Diagnóstico de 12 Capas (`Agent Architecture Audit`):** localiza rápidamente en qué capa falla un comportamiento degradado (sirve tanto para la agencia Antigravity como para **Tenshi / WAPPY IA** en producción).
3. **Evaluación Basada en Evidencia (`Eval-Driven Verification`):** define criterios objetivos `PASS/FAIL` (`Capability Eval` + `Regression Eval`) antes y después de tocar prompts, skills, hooks o agentes.

---

## When to Use

- Antes o después de agregar/modificar skills en `.agents/skills/`, agentes en `.agents/agents/`, reglas en `.agents/rules/` o `.agents/hooks.json`.
- Cuando el usuario reporte *"el agente está repitiendo errores"*, *"se está olvidando de una regla"* o *"se comportaba mejor ayer"*.
- En limpiezas periódicas de memoria procedural (`~/.gemini/teams/wappy-dev-agency/memory/`) para evitar desborde (>50 reglas) o archivos huérfanos.
- Antes de publicar cambios estructurales en prompts, herramientas o flujos de **Tenshi / WAPPY IA**.

---

## Paso 1: Ejecutar el Auditor Determinista (Stocktake Automático)

Ejecuta el script incluido (cero dependencias externas):

```bash
node .agents/skills/wappy-harness-audit/scripts/audit-wappy-harness.js
```

Opciones útiles:
- `--json`: salida estructurada en JSON para reportes automatizados o CI.
- `--strict`: sale con código `1` si hay cualquier error crítico o advertencia de desincronización.

### Qué valida automáticamente el script
1. **Skills (`.agents/skills/*/SKILL.md`):** frontmatter YAML válido (`name`, `description`), coincidencia exacta de carpeta vs `name`, y sincronización 1:1 con `.agents/skills_index.json` y `.agents/CATALOG.md`.
2. **Subagentes (`.agents/agents/*.md`):** frontmatter válido (`name`, `description`, `subagent`, `tools`), sin nombres de herramientas inválidos de otros harnesses (`Bash`, `Read`, `Grep`, `Glob`, `Edit`, `Write` en lugar de los nativos de Antigravity) y referencias válidas en `preloadSkills`.
3. **Reglas Contextuales (`.agents/rules/*.md`):** tamaño `< 24 KB`, presencia de `trigger:` válido (`always_on`, `glob`, `model_decision`, `manual`) y validación de `globs` (cadena separada por comas, prefijo `**/`, sin llaves `{}` ni arrays YAML que rompen el matcher).
4. **Lifecycle Hooks (`.agents/hooks.json`):** JSON válido, eventos soportados (`SessionStart`, `PreToolUse`, `PostToolUse`, `PreInvocation`, `PostInvocation`, `Stop`), existencia y validación sintáctica `node --check` de cada script referenciado.
5. **Salud de Memoria Procedural (`~/.gemini/teams/wappy-dev-agency/memory/` y `.agents/memory/`):**
   - Alerta si alguna bitácora oficial supera el tope de **50 entradas/líneas útiles**.
   - Detecta archivos legacy/duplicados fuera de las 6 bitácoras canónicas para compactarlos o archivarlos.
6. **Gobernanza de Modelos e Higiene de Seguridad:** detecta referencias a modelos Gemini deprecados ausentes de `GOOGLE_MODELS` en `.env` (fuera de secciones explicativas de prohibición) y busca posibles claves/tokens literales en `.agents/`.

---

## Paso 2: Diagnóstico de 12 Capas (Cuando un Agente Falla Sin Causa Obvia)

Cuando un agente (en Antigravity o en **Tenshi / WAPPY IA**) dé respuestas degradadas pese a tener un buen modelo base, inspecciona en orden las **12 capas** antes de "parchear el prompt":

| # | Capa | Qué suele fallar |
| :-: | :--- | :--- |
| 1 | **System Prompt / Rules** | Instrucciones contradictorias o sobrepeso de reglas globales (`AGENTS.md` / `systemPrompt`). |
| 2 | **Historial de Sesión** | Contexto viejo contaminando turnos nuevos o hilos compartidos entre empresas. |
| 3 | **Memoria Largo Plazo** | Bitácoras sin compactar (>50 reglas), lecciones contradictorias o archivos legacy duplicados. |
| 4 | **Destilación / Compactación** | Resúmenes comprimidos reinyectados como si fueran hechos actuales. |
| 5 | **Recall Activo / RAG** | Inyección redundante de fragmentos que desperdician ventana de contexto. |
| 6 | **Selección de Herramientas** | Solapamiento de descripciones entre skills/tools o colisión de nombres (`Error 1007`). |
| 7 | **Ejecución de Herramientas** | El modelo afirma haber ejecutado una herramienta sin llamarla o falla silenciosamente (`catch {}`). |
| 8 | **Interpretación de Salida** | Truncado excesivo, JSON malformado o ignorar códigos de error HTTP/stderr. |
| 9 | **Formateo de Respuesta** | Ruptura de Markdown, enlaces rotos, imágenes duplicadas en chat/Canvas. |
| 10 | **Transporte / Renderizado UI** | Mutación en streaming SSE, sanitizador HTML o componentes React (`MarkdownComponents.tsx`). |
| 11 | **Bucles de Reparación Ocultos** | Reintentos silenciosos o fallbacks secundarios que reescriben respuestas sin trazabilidad. |
| 12 | **Persistencia / Caché** | Bundle `client/dist` viejo, `storage_state.json` caducado o estado de daemon desincronizado. |

---

## Paso 3: Verificación Eval-Driven (EDD) Antes de Modificar Agentes, Skills o Hooks

Al introducir o cambiar un agente, skill, regla o hook, define dos bloques cortos antes de dar la tarea por cerrada:

```markdown
[CAPABILITY EVAL: <nombre-del-cambio>]
Objetivo: Qué debe hacer ahora el harness/agente que antes fallaba.
Criterios deterministas (Code-Based / Command-Based):
  - [ ] Comando o payload de prueba 1 -> PASS
  - [ ] Comando o payload de prueba 2 -> PASS

[REGRESSION EVAL: <nombre-del-cambio>]
Qué NO debe romperse:
  - [ ] `node .agents/skills/wappy-harness-audit/scripts/audit-wappy-harness.js` -> 0 errores críticos
  - [ ] Comandos legítimos / rutas existentes siguen pasando (`allow` / `exit 0`)
```

### Estándar de Evidencia (Pre-Report Gate)
Todo hallazgo `HIGH` o `CRITICAL` en una auditoría debe incluir:
1. **Archivo y línea exactos** (nada de *"en alguna parte de..."*).
2. **Escenario concreto de fallo** (entrada -> estado -> daño real).
3. **Por qué los guardrails actuales no lo detienen** y la corrección mínima determinista.

---

## Verification

- Ejecutar `node .agents/skills/wappy-harness-audit/scripts/audit-wappy-harness.js` y confirmar `0` errores críticos (`FAIL`).
- Revisar las advertencias (`WARN`) de memoria o sincronización y decidir con el usuario si compactar o promover lecciones recurrentes a `.agents/rules/` o `.agents/hooks.json`.

## Safety and Side Effects

- **Risk level:** `safe` — El script es estrictamente de **solo lectura**; no modifica ni borra archivos.
