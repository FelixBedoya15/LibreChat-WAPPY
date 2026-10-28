# Antigravity AI — Reglas Críticas del Proyecto LibreChat-WAPPY

## 0. Fast-Path & Eficiencia Proporcional (Cero Latencia en Consultas Simples)
- **Nivel 1 — Consultas Conceptuales o Preguntas Rápidas (ej. "¿Qué es SST?", dudas normativas o preguntas generales):**
  - **RESPONDE DE INMEDIATO (< 2 segundos) EN UN SOLO TURNO.**
  - **PROHIBIDO** leer `SKILL.md`, explorar archivos del repositorio, ejecutar comandos de terminal o invocar subagentes para preguntas que no requieren tocar código ni consultar el estado del servidor.
- **Nivel 2 — Cambios Puntuales en 1 Archivo:**
  - Edita directamente el archivo, valida sintaxis (`node -c`) o compila (`npm run build:client`) según corresponda, sin invocar subagentes.
- **Nivel 3 — Tareas Complejas, Rediseños UI o Desarrollo Multi-Módulo:**
  - Activa las skills específicas bajo demanda y delega en los subagentes del equipo `wappy-dev-agency`.

---

## 1. Compilación Local Obligatoria del Frontend (`client/dist`)
> [!CRITICAL]
> `Dockerfile.multi` en Dokploy **NO compila el frontend en el servidor** (`COPY client/dist ./client/dist`).
> Siempre que se modifique, cree o elimine cualquier archivo en `client/src/**/*` o `packages/client/**/*`:
> 1. Ejecutar localmente antes de hacer commit: `npm run build:client`
> 2. Incluir código fuente y bundle en Git: `git add client/src client/dist`
> 3. **Prohibido** commitear solo `client/src` sin compilar `client/dist`.
> *(Para desplegar o sincronizar en el VPS `srv999875`, usa la skill `wappy-build-and-deploy`).*

---

## 2. Estándar de Desarrollo y Sistema de Diseño UI (WAPPY 14-Group Design System)
- **Rutas Backend (`api/server/routes/**/*.js`):** Verificar siempre sintaxis con `node -c <archivo.js>`.
- **Componentes Frontend (`client/src/**/*`):** Diseño responsive (`md:flex-row`), manejo defensivo ante nulos (`x?.trim() || ''`, `Array.isArray(arr) ? arr : []`).
- **Botones, Insignias, Tarjetas y LiveEditor:** Todo botón auto-expansible, toolbar o insignia en WAPPY debe usar `client/src/components/Common/ExpandableButton.tsx` (inclinación `sm:hover:-rotate-3 sm:hover:scale-105`, bordes `/30`, fondos `/10`, cero `rounded-full` o rellenos sólidos pesados) y los **14 Grupos Semánticos de Color**.
  - **Obligatorio:** Cuando vayas a diseñar o modificar botones, tarjetas Glassmorphism o tablas exportables (`LiveEditor`), lee la skill `wappy-ui-design-system` o delega en el subagente `wappy-design-director` / `wappy-frontend-ui`.

---

## 3. Verificación Web Obligatoria de Modelos de IA (`verify-ai-models`)
> [!CRITICAL]
> **Prohibido asumir, adivinar o degradar nombres/versiones de modelos de IA** (Gemini, OpenAI, Claude, etc.). Antes de tocar cualquier configuración de modelos en `api/`, `packages/`, `client/` o `.env`, **ejecuta siempre `search_web`** en la documentación oficial vigente.

---

## 4. Reglas Inquebrantables de Tenshi Voice y Puente Reactivo Push
> [!CRITICAL]
> Al tocar voz (`geminiLive.js`, `voiceSession.js`) o despacho de chats (ver bitácora `docs/AUDITORIA_Y_LECCIONES_TENSHI.md` o delegar en `wappy-tenshi-voice`):
> 1. **Continuidad de Chat:** Reutilizar la conversación activa (`tenshi-submit-agent-prompt`). **Nunca abrir `/c/new`** salvo cambio explícito de especialista o petición del usuario.
> 2. **Despacho Triple + Watchdog (3s):** Ejecutar simultáneamente `methods.handleSubmit(...)()`, `submitMessage({ text })` y `form.requestSubmit()`.
> 3. **Google Multimodal Live API:** `inputAudioTranscription: {}` y `outputAudioTranscription: {}` **DEBEN ser objetos vacíos `{}`** (incluir `languageCodes` causa **Error 1011**).
> 4. **Unicidad de Herramientas (Error 1007):** Cada función en `this.liveConfig.tools[0].functionDeclarations` debe tener un nombre único (verificar 0 duplicados antes de commitear).
> 5. **Puente Reactivo Push SSE:** Conexión Tenshi <-> Antigravity vía Push SSE (`/api/mcp-bridge/antigravity/stream` + `wappy-push-daemon.js`). **Prohibido** crear crons de sondeo cada 2 minutos.

---

## 5. Protocolo de Producción de Vídeos (`protocolo-produccion-videos`)
> [!CRITICAL]
> **Prohibido programar o renderizar vídeos MP4 a ciegas.** Antes de codificar cualquier video o reel, activa la skill `protocolo-produccion-videos` (o delega en `wappy-video-studio`) para alinear con el usuario los **5 pasos obligatorios** (Formato, Atmósfera Visual A/B/C/D, Personajes Félix/Tenshi, Tipografía sin elementos web, y Tabla de Guión con mínimo 4 transiciones de `animaciones-17-efectos-reels` + previsualización por frames).
