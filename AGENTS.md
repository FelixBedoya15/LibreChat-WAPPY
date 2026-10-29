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

## 5. Protocolo Obligatorio de Producción de Vídeos (`protocolo-produccion-videos` · Sistema de las 7 Piezas + Brandbook WAPPY IA)
> [!CRITICAL]
> **Prohibido programar o renderizar vídeos MP4 a ciegas.** Siempre que el usuario pida crear, editar o guionizar un video o reel para WAPPY IA, **DEBES estructurar y presentar primero la propuesta siguiendo las 7 Piezas Oficiales + la Ficha de Marca (`docs/WAPPY_IA_BRANDBOOK_OFICIAL.md`) y esperar su OK antes de renderizar**:
> 1. **Pieza 1 — Quién Eres (Rol de Dirección de Arte):** Definir el enfoque del video (Reel viral 9:16, Lanzamiento de herramienta SST, Tutorial de chat con Tenshi, Antes/Después, Datos 0312 o Intro de marca).
> 2. **Pieza 2 — Ficha de Marca WAPPY IA (`wappy.club`):** Aplicar estrictamente los colores oficiales (`#C7F303` Verde Lima Eléctrico con texto `#0E1300` Negro Oliva; `#0D9488` Turquesa SST; `#F6F5EF` Crema Editorial; o `#0C192E` Dark Tech HUD con `#00D4FF` Cyan), tipografías (`Plus Jakarta Sans`/`Outfit ExtraBold` + `Inter` + `JetBrains Mono`), tu avatar (Chibi 3D en miniatura / Voxel 3D en esquinas seguras sin tapar texto) y cero barras de navegación web falsas.
> 3. **Pieza 3 — Para Quién y Qué Mensaje:** Definir audiencia (prevencionistas, coordinadores SST, gerentes), objetivo y texto/locución exacta verificada (ej. GTC 45, Resolución 0312, Decreto 1072, sin inventar ni confundir normas).
> 4. **Pieza 4 — Qué Pasa Segundo a Segundo (LA CLAVE + Miniatura 2s):** Tabla tramo por tramo que **SIEMPRE incluya de `0.00s a 2.00s` la Miniatura/Portada Magnética de Marketing** (con tu avatar, máximo 3 insignias clave y el badge gigante **`🔥 ¡GRATIS!`**), seguida de cada escena sincronizada palabra a palabra con la voz.
> 5. **Pieza 5 — Cómo se Mueve:** Rebote elástico suave (`spring`), ágil y determinista cuadro a cuadro a `60 fps`, encadenando mínimo 4 efectos de `animaciones-17-efectos-reels` (Zoom-through, Giro 3D, Spotlight, Barrido diagonal, etc.).
> 6. **Pieza 6 — Sonido:** Locución del usuario sincronizada + diseño sonoro sutil (`whoosh` en transiciones, `pop` en tarjetas/badges y `ding` en checks de éxito).
> 7. **Pieza 7 — Tamaño, 3 Vistas Previas y Entrega:** Formato (`1080x1920` vertical o `1920x1080` horizontal a `60 fps`), **mostrar siempre 3 imágenes de vista previa (inicio/miniatura, mitad y cierre)** verificando que ningún texto se corte, y tras el OK del usuario entregar el MP4 final + paquete editable.
