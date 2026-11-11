# Catálogo Maestro de Skills — LibreChat-WAPPY (Estándar AAS v1)

> Basado en la arquitectura `Stable Skills Manifest v1` y `Bundles & Workflows` de [`sickn33/agentic-awesome-skills`](https://github.com/sickn33/agentic-awesome-skills), adaptado al motor nativo de autodescubrimiento de **Google Antigravity** (`.agents/skills/<skill-name>/SKILL.md`).

- **Índice legible por máquina:** [`skills_index.json`](./skills_index.json)
- **Directorio canónico de skills:** [`.agents/skills/`](./skills/)
- **Subagentes especialistas:** [`.agents/agents/`](./agents/)
- **Memoria procedural:** [`.agents/memory/`](./memory/) y `~/.gemini/teams/wappy-dev-agency/memory/`

---

## 1. Bundles por Dominio y Subagente

### 🎬 Bundle 1: `wappy-video-production` (Producción Audiovisual & Motion Graphics)
**Subagente Líder:** [`wappy-video-studio`](./agents/wappy-video-studio.md)

| Skill ID | Rol en el Bundle | Risk | Cuándo Activarla |
| :--- | :--- | :---: | :--- |
| [`protocolo-produccion-videos`](./skills/protocolo-produccion-videos/SKILL.md) | **Principal (Por Defecto)** | `safe` | Siempre como protocolo base: Estilo Pro Limpio (`#06080d`), 1 pieza por frase, 3 planos y Avatar 3D con Lip-Sync. |
| [`animaciones-explicativas-sst`](./skills/animaciones-explicativas-sst/SKILL.md) | Especialista Documental SST | `safe` | Vídeos normativos «SST para Dummies» con `VisorNormaReal`, `ChatRumores`, `AbanicoDocumentos` e `IndiceCapitulos`. |
| [`animaciones-wappy-brand`](./skills/animaciones-wappy-brand/SKILL.md) | Identidad Web `wappy.club` | `safe` | Vídeos con cielo WAPPY, tarjeta Tenshi 3D flotante, iconos Duotone Lottie/Flaticon y `WappyRemotionKit.tsx`. |
| [`animaciones-17-efectos-reels`](./skills/animaciones-17-efectos-reels/SKILL.md) | Catálogo Selectivo de Efectos | `safe` | Consulta puntual para 1 transición o efecto por frase (`FXOrbit`, `fxZoomThrough`, `ChartGrowFX`, `FX14DoodleBoil`). |
| [`animaciones-dark-tech-hud`](./skills/animaciones-dark-tech-hud/SKILL.md) | Catálogo Opcional Cyberpunk | `safe` | **Solo bajo pedido explícito** de estética Cyberpunk, consola futurista o núcleo orbital HUD. |
| [`hyperframes-motion-design`](./skills/hyperframes-motion-design/SKILL.md) | Motor GSAP Seek-Safe | `safe` | Composiciones basadas en HyperFrames con `gsap.timeline({ paused: true })` y tipografía cinética. |

---

### 🎨 Bundle 2: `wappy-ui-and-content` (Diseño UI/UX, Frontend React & Contenidos)
**Subagentes Líderes:** [`wappy-design-director`](./agents/wappy-design-director.md) & [`wappy-frontend-ui`](./agents/wappy-frontend-ui.md)

| Skill ID | Rol en el Bundle | Risk | Cuándo Activarla |
| :--- | :--- | :---: | :--- |
| [`wappy-ui-design-system`](./skills/wappy-ui-design-system/SKILL.md) | **Biblia Visual Oficial** | `safe` | Siempre al crear o editar vistas en `client/src/**/*`: 14 Grupos de Color (`ExpandableButton.tsx`), Glassmorphism y tablas `LiveEditor`. |
| [`wappy-lms-and-blog`](./skills/wappy-lms-and-blog/SKILL.md) | Academia LMS & Blog SEO/AEO | `safe` | Creación de cursos interactivos (`Course` schema, `seed-lms.js`) y artículos técnicos con gancho AEO. |

---

### ⚙️ Bundle 3: `wappy-platform-and-sgsst` (Herramientas SG-SST, Flujos DAG, Backend & Conectores Externos)
**Subagentes Líderes:** [`wappy-workflow-architect`](./agents/wappy-workflow-architect.md), [`wappy-backend-api`](./agents/wappy-backend-api.md) & [`wappy-integrations-hub`](./agents/wappy-integrations-hub.md)

| Skill ID | Rol en el Bundle | Risk | Cuándo Activarla |
| :--- | :--- | :---: | :--- |
| [`wappy-workflow-architecture`](./skills/wappy-workflow-architecture/SKILL.md) | **Arquitectura Oficial Flujos n8n-WAPPY** | `safe` | Siempre al diseñar, auditar o probar flujos en `/tareas` (`validate-workflow-logic.js`, compuertas `pre_agent`/`post_agent`, anti-duplicados y Hitos `source_read` vs `target_write_report`). |
| [`wappy-sgsst-tools`](./skills/wappy-sgsst-tools/SKILL.md) | Matrices & Automatizaciones SST | `safe` | Matriz PESV (Res. 20223040040595), Compatibilidad Química (SGA Decreto 1496) y Gestor de Tareas (`/tareas`). |
| [`wappy-google-connectors`](./skills/wappy-google-connectors/SKILL.md) | Puentes & Conectores OAuth/MCP | `safe` | Puente Reactivo Antigravity (`wappy-push-daemon.js`, `mcpBridge.js`), NotebookLM, Google Flow Veo/Imagen, Drive y OneDrive. |

---

### 🛡️ Bundle 4: `wappy-ops-and-governance` (QA, Build, Modelos de IA & Memoria Procedural)
**Subagentes Líderes:** Orquestador Principal, [`wappy-qa-devops`](./agents/wappy-qa-devops.md) & [`wappy-live-tester`](./agents/wappy-live-tester.md)

| Skill ID | Rol en el Bundle | Risk | Cuándo Activarla |
| :--- | :--- | :---: | :--- |
| [`wappy-build-and-deploy`](./skills/wappy-build-and-deploy/SKILL.md) | **Build Local & Deploy VPS** | `critical` | Siempre tras modificar `client/src/**/*` (`npm run build:client` + `git add client/dist`) o al desplegar en `srv999875`. |
| [`verify-ai-models`](./skills/verify-ai-models/SKILL.md) | Gobernanza de Modelos IA | `safe` | Antes de tocar cualquier ID de modelo en `.env`, `api/`, `packages/` o selectores frontend. |
| [`wappy-procedural-memory`](./skills/wappy-procedural-memory/SKILL.md) | Auto-Aprendizaje (`Reflexion`) | `safe` | Cuando el usuario corrige un diseño/código o se resuelve un bug complejo que debe quedar documentado en `memory/`. |

---

## 2. Workflows Ordenados (Secuencias de Ejecución)

### Workflow A: Desarrollo o Rediseño de Interfaz en `client/src/**`
1. [`wappy-ui-design-system`](./skills/wappy-ui-design-system/SKILL.md) — Diseñar y programar aplicando `ExpandableButton.tsx` (14 grupos) y `0px` horizontal overflow.
2. [`wappy-build-and-deploy`](./skills/wappy-build-and-deploy/SKILL.md) — Compilar `npm run build:client` y añadir `client/src` + `client/dist` al commit.
3. [`wappy-procedural-memory`](./skills/wappy-procedural-memory/SKILL.md) *(opcional)* — Si hubo una corrección visual nueva del usuario, cristalizarla en `design-ui-lessons.md`.

### Workflow B: Producción de un Reel o Vídeo Explicativo WAPPY IA
1. [`protocolo-produccion-videos`](./skills/protocolo-produccion-videos/SKILL.md) — Definir los 3 planos y elegir 1 sola pieza por frase del guion.
2. Elegir la librería de apoyo según el tema:
   - Normativa / Sentencia SST ➔ [`animaciones-explicativas-sst`](./skills/animaciones-explicativas-sst/SKILL.md)
   - Identidad `wappy.club` / Tenshi 3D ➔ [`animaciones-wappy-brand`](./skills/animaciones-wappy-brand/SKILL.md)
   - Efecto puntual (`FXOrbit`, `fxZoomThrough`) ➔ [`animaciones-17-efectos-reels`](./skills/animaciones-17-efectos-reels/SKILL.md)
3. Generar las **3 capturas previas** antes del render MP4 final a 60 fps.
