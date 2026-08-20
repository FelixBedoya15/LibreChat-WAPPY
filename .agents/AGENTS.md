# Wappy Project Rules & Agent Ecosystem

## 1. Sincronización en Producción (VPS `srv999875`)
- **Regla Estricta:** Cuando el usuario necesite sincronizar o actualizar los agentes en el servidor de producción VPS (`srv999875`), el comando exacto que SIEMPRE se debe recordar y recomendar es:
  ```bash
  docker exec -it LibreChat node scripts/restore-and-sync-all.js
  ```
  Antes de ejecutarlo, el usuario debe realizar un `git pull` en la carpeta correspondiente del VPS (usualmente `cd /root/LibreChat-WAPPY && git pull`) para descargar los últimos cambios de GitHub.

---

## 2. Skills Disponibles en el Proyecto
- **`vps-deploy-sync`**: [.agents/skills/vps-deploy-sync/SKILL.md](file:///.agents/skills/vps-deploy-sync/SKILL.md) - Despliegue seguro y sincronización de agentes en el VPS de producción.
- **`create-lms-course`**: [.agents/skills/create-lms-course/SKILL.md](file:///.agents/skills/create-lms-course/SKILL.md) - Creación y estructuración de cursos para el LMS de WAPPY.
- **`publish-blog-article`**: [.agents/skills/publish-blog-article/SKILL.md](file:///.agents/skills/publish-blog-article/SKILL.md) - Redacción de artículos para el blog optimizados para SEO/AEO y distribución multicanal.

---

## 3. Escuadrones de Agentes WAPPY
- **Diseño & Web:** `Wappy UI/UX Designer`, `Landing & Marketing Page Agent`, `Graphic Assets Agent`.
- **Somos SST:** `Normatividad & Matriz SST Agent`, `Document & Formatos SST Agent`, `SST Benchmark Auditor`.
- **Cursos & LMS:** `Instructional Designer Agent`, `Quiz & Assessment Generator`, `LMS Database Integrator`.
- **Blog & Contenido:** `Topic Research Agent`, `SEO & AEO Long-Form Writer`, `Multi-Channel Repurposer`.
- **Arquitectura & Tools:** `Agent Architect & Prompt Engineer`, `MCP & Tool Developer`, `DevOps & Deployment Agent`.
