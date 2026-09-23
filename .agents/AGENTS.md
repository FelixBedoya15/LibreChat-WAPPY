# Wappy Project Rules & Agent Ecosystem

## 1. Sincronización en Producción (VPS `srv999875`)
- **Regla Estricta:** Cuando el usuario necesite sincronizar o actualizar los agentes en el servidor de producción VPS (`srv999875`), el comando exacto que SIEMPRE se debe recordar y recomendar es:
  ```bash
  docker exec -it LibreChat node scripts/restore-and-sync-all.js
  ```
  Antes de ejecutarlo, el usuario debe realizar un `git pull` en la carpeta correspondiente del VPS (usualmente `cd /root/LibreChat-WAPPY && git pull`) para descargar los últimos cambios de GitHub.

---

## 2. Compilación Local Obligatoria del Frontend (Dokploy & `client/dist`)
- **Regla Estricta y Crítica:** `Dockerfile.multi` en Dokploy **NO compila el frontend en el servidor**; simplemente copia la carpeta `client/dist` del repositorio (`COPY client/dist ./client/dist`).
- Por tanto, **SIEMPRE** que se modifique cualquier archivo de la interfaz (`client/src/**/*` o paquetes frontend), el agente DEBE ejecutar localmente antes del commit:
  ```bash
  npm run build:client
  git add client/src client/dist
  ```
  Está terminantemente prohibido hacer commit únicamente de `client/src` sin compilar e incluir `client/dist`, ya que de lo contrario Dokploy desplegará la versión compilada vieja.

---

## 3. Skills Disponibles en el Proyecto
- **`client-build-deploy`**: [.agents/skills/client-build-deploy/SKILL.md](file:///.agents/skills/client-build-deploy/SKILL.md) - Compilación local obligatoria (`npm run build:client`), actualización de `client/dist` y auto-despliegue en Dokploy.
- **`vps-deploy-sync`**: [.agents/skills/vps-deploy-sync/SKILL.md](file:///.agents/skills/vps-deploy-sync/SKILL.md) - Despliegue seguro y sincronización de agentes en el VPS de producción.
- **`create-lms-course`**: [.agents/skills/create-lms-course/SKILL.md](file:///.agents/skills/create-lms-course/SKILL.md) - Creación y estructuración de cursos para el LMS de WAPPY.
- **`publish-blog-article`**: [.agents/skills/publish-blog-article/SKILL.md](file:///.agents/skills/publish-blog-article/SKILL.md) - Redacción de artículos para el blog optimizados para SEO/AEO y distribución multicanal.
- **`tool-matriz-pesv`**: [.agents/skills/tool-matriz-pesv/SKILL.md](file:///.agents/skills/tool-matriz-pesv/SKILL.md) - Instrucciones de uso, fórmulas y evaluación de la herramienta de Matriz PESV (Seguridad Vial).
- **`tool-matriz-compatibilidad`**: [.agents/skills/tool-matriz-compatibilidad/SKILL.md](file:///.agents/skills/tool-matriz-compatibilidad/SKILL.md) - Instrucciones de uso, clasificación ONU y reglas de almacenamiento para la herramienta de Compatibilidad Química (SGA).
- **`tool-notebooklm`**: [.agents/skills/tool-notebooklm/SKILL.md](file:///.agents/skills/tool-notebooklm/SKILL.md) - Integración y consulta de cuadernos de Google NotebookLM / Gemini Notebook vía MCP para todos los agentes de WAPPY.

---

## 3. Escuadrones de Agentes WAPPY
- **Diseño & Web:** `Wappy UI/UX Designer`, `Landing & Marketing Page Agent`, `Graphic Assets Agent`.
- **Somos SST:** `Normatividad & Matriz SST Agent`, `Coordinador Seguridad Vial (PESV)`, `Ingeniero Químico SST`, `Document & Formatos SST Agent`, `SST Benchmark Auditor`.
- **Cursos & LMS:** `Instructional Designer Agent`, `Quiz & Assessment Generator`, `LMS Database Integrator`.
- **Blog & Contenido:** `Topic Research Agent`, `SEO & AEO Long-Form Writer`, `Multi-Channel Repurposer`.
- **Arquitectura & Tools:** `Agent Architect & Prompt Engineer`, `MCP & Tool Developer`, `DevOps & Deployment Agent`.
