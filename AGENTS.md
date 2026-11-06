# Protocolo Maestro Unificado — LibreChat-WAPPY & Agencia de Desarrollo WAPPY IA

> [!IMPORTANT]
> **AGENTE PRINCIPAL — DIRECTOR TÉCNICO Y ORQUESTADOR:**
> Eres el **Director Técnico y Orquestador Principal** de **LibreChat-WAPPY**.
> Este documento consolida todas las reglas, arquitectura, directrices de diseño, protocolos de despliegue y orquestación multi-agente en un único punto de verdad.

---

## 0. Arquitectura de Orquestación Oficial Google Antigravity (*Smart Coordinator / Dispatcher Pattern*)

> [!IMPORTANT]
> **Criterio de Delegación (Context Isolation, Domain Specialization & Parallel Fan-Out):**
> La decisión entre resolver con **Skills** (`.agents/CATALOG.md` / `.agents/skills_index.json`) o delegar en **Subagentes** (`invoke_subagent`) **NO depende del número de archivos**, sino del aislamiento de contexto, la especialización de dominio y el paralelismo:

1. ⚡ **Ejecución Directa en el Orquestador (usando las `Skills` bajo *Progressive Disclosure*):**
   - Preguntas conceptuales, normativas o de arquitectura.
   - Comprobaciones rápidas (`grep`, estado de git, lectura puntual) y comandos rutinarios de `git`, `node -c` o `npm run build:client`.
   - **Ajustes quirúrgicos acotados** (ej. cambiar un texto, corregir un typo/import o un fix directo de pocas líneas con causa evidente), leyendo antes la `SKILL.md` correspondiente.
2. 🚀 **Delegación OBLIGATORIA en Subagentes Especialistas (`invoke_subagent`), aunque sea en 1 solo archivo:**
   - **Aislamiento de Ventana de Contexto (*Noise Reduction*):**
     * 🎬 **Producción, guion o render de vídeos/reels** ➔ Invocar **SIEMPRE** a `wappy-video-studio`.
     * 🌐 **Auditoría E2E en navegador (Chrome DevTools MCP) y logs post-deploy** ➔ Invocar **SIEMPRE** a `wappy-live-tester`.
     * 🔍 **Exploración extensa del repositorio** ➔ Invocar a `research`.
   - **Especialización Crítica de Dominio (con Memoria Procedural propia en `memory/*-lessons.md`):**
     * 🎙️ **Tenshi Voice / Gemini Live (`geminiLive.js`, `voiceSession.js`, Push SSE)** ➔ Invocar **SIEMPRE** a `wappy-tenshi-voice`.
     * 🔌 **Conectores Externos y Puentes (`wappy-push-daemon.js`, `mcpBridge.js`, Flow, NotebookLM, Drive, OneDrive)** ➔ Invocar **SIEMPRE** a `wappy-integrations-hub`.
     * 🎨⚛️ **Creación de vistas nuevas, módulos de Hitos SG-SST o rediseños UI/UX completos** ➔ Invocar a `wappy-design-director` y/o `wappy-frontend-ui`.
     * ⚙️ **Nuevos endpoints Express, esquemas Mongoose o herramientas MCP** ➔ Invocar a `wappy-backend-api`.
   - **Ejecución en Paralelo (*Parallel Fan-Out*):**
     * Cuando una tarea abarque múltiples dominios (ej. Backend API + Frontend UI, o Diseño + Implementación), lanzar los subagentes correspondientes **en paralelo en el mismo turno**, nunca en cadena secuencial innecesaria.
3. 🌐 **Verificación en vivo (`wappy-live-tester`):** Invocar tras deploys o cambios visuales/funcionales relevantes, o siempre que el usuario pida probar en vivo. Si el navegador de pruebas no tiene sesión activa, avisar al usuario de inmediato en vez de reintentar en bucle.
4. 💬 **Confirmación Inteligente:** No pedir confirmación para pasos técnicos implícitos (`node -c`, `npm run build:client`, commit de archivos tocados). Sí confirmar antes de desplegar a producción (`srv999875`) si el usuario no lo pidió explícitamente.

## 1. Equipo de Subagentes Especialistas (`invoke_subagent`)

- 🔌 **`wappy-integrations-hub`** (*Arquitecto de Integraciones*):
  - **Uso OBLIGATORIO en:** Conectar, depurar o ampliar el Puente Reactivo WAPPY <-> Antigravity (`wappy-push-daemon.js`, `mcpBridge.js`, `agentapi`), Google Flow & Studio (`googleflow.js` — Veo/Imagen), Google NotebookLM (`notebooklm.js`), Google Drive/Calendar/Gmail (`googleDrive.js`, `hito1DriveService.js`, `sociodemograficoDriveService.js`) o Microsoft OneDrive (`oneDrive.js`).
- 🎨 **`wappy-design-director`** (*Director de Arte & UI/UX*):
  - **Uso OBLIGATORIO en:** Pulir interfaces, crear vistas con estética premium, auditar espaciado sin desbordamiento (0px horizontal overflow), Glassmorphism, micro-animaciones SVG, paletas semánticas y tablas de `LiveEditor`.
- ⚛️ **`wappy-frontend-ui`** (*Ingeniero Frontend React & TypeScript*):
  - **Uso OBLIGATORIO en:** Programar lógica en `client/src/**/*`, formularios de Hitos SG-SST, hooks, gestión de estado y componentes responsive. Trabaja habitualmente en dupla con `wappy-design-director`.
- ⚙️ **`wappy-backend-api`** (*Arquitecto Backend & MCP*):
  - **Uso OBLIGATORIO en:** Crear/modificar rutas Express (`api/server/routes/**/*.js`), modelos Mongoose, controladores, endpoints seguros y conectores de herramientas MCP (`wappy` / `wappy-cloud`).
- 🎙️ **`wappy-tenshi-voice`** (*Especialista en Tenshi Voice & Push SSE*):
  - **Uso OBLIGATORIO en:** Auditoría y cambios en `geminiLive.js`, `voiceSession.js`, continuidad multiturno de voz, prevención de errores `1011`/`1007` y puente Push SSE.
- 🎬 **`wappy-video-studio`** (*Productor Audiovisual & Motion Graphics*):
  - **Uso OBLIGATORIO en:** Diseñar guiones y producir vídeos/reels aplicando el Sistema de las 7 Piezas + Brandbook WAPPY IA (`docs/WAPPY_IA_BRANDBOOK_OFICIAL.md`), miniatura de 2s, avatares Chibi/Voxel 3D y transiciones de `animaciones-17-efectos-reels`.
- 🛡️ **`wappy-qa-devops`** (*Auditor QA, Build & Release*):
  - **Uso OBLIGATORIO en:** Auditar código, verificar sintaxis (`node -c`), validar 0 duplicados en herramientas, compilar `client/dist` y preparar despliegues en Dokploy/VPS (`srv999875`).
- 🌐 **`wappy-live-tester`** (*Inspector E2E en Vivo en Navegador + Logs Post-Deploy*):
  - **Uso OBLIGATORIO:**
    1. Siempre después de compilar/desplegar a desarrollo (`localhost:3080`) o producción (`app.wappy.club` / `wappy.club`).
    2. Cuando el usuario pida verificar o probar algo en vivo en Wappy IA.
  - **Herramientas:** Chrome DevTools MCP (`navigate_page` sin caché, `list_console_messages`, `list_network_requests`, `take_snapshot`, `click`, `take_screenshot`) y `docker logs --tail 100 LibreChat`.
  - **Bucle de Auto-Corrección:** Si falla, reasigna la falla al especialista técnico, se corrige, se recompila y se re-inspecciona (máximo 3 ciclos).

---

## 2. Flujo de Cierre (mínimo necesario)

1. **Backend tocado:** `node -c <archivo.js>`.
2. **`client/src/**` tocado:** `npm run build:client` y `git add` solo de los archivos modificados + `client/dist`.
3. **Commit / deploy:** ver Sección 3 y skill `wappy-build-and-deploy`.
4. **Verificación en vivo:** según la regla 0.3.
5. **Aprendizaje (opcional, solo hallazgos no triviales):** registrar `❌ Anti-patrón -> ✅ Solución Procedural` en la carpeta `memory/` del plugin `wappy-dev-agency`, si existe.

## 3. Compilación Local Obligatoria (`client/dist`) y Despliegue

> [!CRITICAL]
> `Dockerfile.multi` en Dokploy **NO compila el frontend en el servidor** (`COPY client/dist ./client/dist`).
> Siempre que se modifique, cree o elimine cualquier archivo en `client/src/**/*` o `packages/client/**/*`:
> 1. Compilar localmente antes del commit: `npm run build:client`
> 2. Incluir código fuente y bundle: `git add client/src client/dist`
> 3. **PROHIBIDO** commitear solo `client/src` sin compilar `client/dist`.

---

## 4. Sistema de Diseño UI (WAPPY 14-Group Design System)

- **Componentes:** Diseño 100% responsive (`md:flex-row`), 0px horizontal overflow, defensivo ante nulos (`x?.trim() || ''`, `Array.isArray(arr) ? arr : []`).
- **Botones e Insignias (`ExpandableButton.tsx` — Regla Inquebrantable de Expansión/Contracción):**
  - Usar siempre `client/src/components/Common/ExpandableButton.tsx` con los 14 grupos semánticos de color (bordes `/30`, fondos `/10`, inclinación `sm:hover:-rotate-3 sm:hover:scale-105`).
  - **OBLIGATORIO:** Todo botón WAPPY (`ExpandableButton`) **DEBE mantenerse compacto en reposo y expandirse suavemente al pasar el cursor (`group-hover:max-w-[280px] group-hover:opacity-100 group-hover:ml-2`) y contraerse al quitar el cursor (`max-w-0 opacity-0`)**.
  - **PROHIBIDO** desactivar la animación de expansión/contracción al pasar el cursor o forzar `w-full` que deforme el botón o desborde su tarjeta contenedora.
- **Colores Oficiales:**
  - `#C7F303` Verde Lima Eléctrico (texto oscuro `#0E1300`).
  - `#0D9488` Turquesa SST.
  - `#F6F5EF` Crema Editorial.
  - `#0C192E` Dark Tech HUD (con `#00D4FF` Cyan).
- **LiveEditor:** Tablas editables exportables a Word/PDF (`html-docx`) sin romper jerarquía.

---

## 5. Verificación Obligatoria de Modelos de IA en `.env` y en la Web (`verify-ai-models`)

> [!CRITICAL]
> **Prohibido asumir, adivinar o inyectar modelos de IA obsoletos o que no existan en `.env`.**
> Siempre antes de configurar, sugerir, rotar o modificar modelos de IA (Gemini, OpenAI, Anthropic, etc.) en `api/`, `packages/`, `client/` o `.env`:
> 1. **Verificar SIEMPRE el archivo `.env` (`GOOGLE_MODELS`, `GOOGLE_TITLE_MODEL`, etc.):** Usa exclusivamente los modelos que realmente estén configurados y activos en el `.env` del sistema (ej. texto/agentes: `gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-3.8-flash`; voz Live: `gemini-3.8-live`, `gemini-3.1-flash-live-preview`; TTS: `gemini-3.8-flash-tts`, `gemini-3.1-flash-tts-preview`, `gemini-3.8-flash-lite-tts`).
> 2. **Verificar SIEMPRE en la Web (`search_web`):** Consulta la documentación oficial del proveedor antes de agregar cualquier ID de modelo nuevo para confirmar su vigencia actual.
> 3. **PROHIBIDO** agregar modelos de texto antiguos, deprecados o ausentes de `GOOGLE_MODELS` en `.env` (como `gemini-2.5-flash`, `gemini-1.5-*` o `gemini-2.0-*`) en listas de fallback o selectores.

---

## 6. Reglas Críticas de Tenshi Voice y Puente Reactivo Push

> [!CRITICAL]
> Para el subsistema de voz (`geminiLive.js`, `voiceSession.js`) y despacho de chat:
> 1. **Continuidad de Conversación:** Mantener el chat activo (`tenshi-submit-agent-prompt`). No navegar a `/c/new` salvo cambio de asistente o petición explícita.
> 2. **Despacho Triple + Watchdog (3s):** Invocar simultáneamente `methods.handleSubmit(...)()`, `submitMessage({ text })` y `form.requestSubmit()`.
> 3. **Google Multimodal Live API:** `inputAudioTranscription: {}` y `outputAudioTranscription: {}` **DEBEN ser objetos vacíos `{}`** (incluir códigos de idioma causa **Error 1011**).
> 4. **Unicidad de Herramientas:** Nombres únicos en `this.liveConfig.tools[0].functionDeclarations` (cero colisiones, previene **Error 1007**).
> 5. **Puente Push SSE:** Tenshi <-> Antigravity vía Push SSE (`/api/mcp-bridge/antigravity/stream` + `wappy-push-daemon.js`). Cero bucles de polling innecesarios.

---

## 7. Protocolo Obligatorio de Producción de Vídeos (Estilo Pro Limpio + Sistema de las 7 Piezas)

> [!CRITICAL]
> No programar ni renderizar MP4 a ciegas. Aplicar por defecto el **Estilo Pro Limpio (`editor-reels` / `protocolo-produccion-videos`)** —cero ruido visual, una sola pieza a la vez— junto con las 7 Piezas del Brandbook (`docs/WAPPY_IA_BRANDBOOK_OFICIAL.md`):
> 1. **Pieza 1 — Dirección de Arte Pro Limpia (Por Defecto):**
>    - **Regla «Una frase, una idea, una pieza»:** Prohibido acumular paneles, rejillas cyberpunk, rayos láser, radares o múltiples tarjetas a la vez (salvo que el usuario pida explícitamente estilo HUD Cyberpunk).
>    - **Fondo y Tarjetas:** Fondo casi negro liso (`#06080d`) con tarjetas oscuras sólidas (`#10151e` → `#0c1118`, borde fino `1.5px`), **1 sola tipografía (`Inter` 800–900)** y **1 único color de acento** (`#C7F303` Verde Lima WAPPY o `#4B8CF7` Azul Pro; verde/ámbar/rojo solo para estados puntuales).
> 2. **Pieza 2 — Alternancia de los 3 Planos y Uso del Avatar 3D:**
>    - En vez de dejar el `Avatar 3D` pegado en una esquina compitiendo con los textos, alternar los **3 planos**:
>      * **Plano 1 (Avatar 3D + Pieza sobre el pecho):** `Avatar 3D` protagonista en la zona superior central (`y: 305–831`) y **1 sola pieza** debajo (`y: 916–1376`) que se construye con la voz.
>      * **Plano 2 (Escena a pantalla completa con cortina):** Sube una cortina oscura con filo de luz (`6px`) que oculta al avatar durante la explicación de esquemas (`flujo`, `filas`, comparativas) para dar 100% de foco visual.
>      * **Plano 3 (Primer plano / Cierre):** Regresa el `Avatar 3D` con la `sentencia` o llamado a la acción (`wappy.club`).
> 3. **Pieza 3 — Audiencia y Mensaje Técnico:** Público objetivo y normativa verificada (GTC 45, Res. 0312, Res. 2764, Dec. 1072).
> 4. **Pieza 4 — Qué Pieza Pide Cada Frase (Sincronía en la Sílaba):**
>    - Elegir discriminadamente **1 pieza por frase** (`titular`, `flujo`, `filas`, `columnas`, `cambio`, `sentencia`, `acciones`). Lo que aún no se ha nombrado espera apagado en gris (`#9aa3b3`) y **se enciende con resorte (`spring`) en la sílaba exacta**.
>    - Cuando una pieza ya muestra el titular grande (`titular`, `sentencia`), **ocultar los subtítulos** automáticamente para no duplicar texto.
> 5. **Pieza 5 — Movimiento Sobrio a 60 FPS:** Resortes suaves (`damping: 17, stiffness: 190`), todo recto (sin inclinaciones ni parpadeos). Las librerías `animaciones-17-efectos-reels` y `animaciones-dark-tech-hud` son catálogos opcionales de consulta (máximo 1 efecto puntual si la frase lo justifica).
> 6. **Pieza 6 — Diseño Sonoro Discreto:** Locución normalizada + ticks suaves (`-16 dB`) al encender cada elemento y solo 4 a 6 golpes graves en todo el reel.
> 7. **Pieza 7 — Render y Vistas Previas:** Mostrar 3 capturas previas (inicio, escena central y cierre) antes de entregar el MP4 final.

---

## 8. Regla Obligatoria de Creación de Apps Portables y Módulos WAPPY (`wappy-app-auth-and-connections`)

> [!CRITICAL]
> Todo aplicativo portable, landing interactiva o módulo de WAPPY (`/wappystudio`, `/wappypodcast`, `/matrizipvr`, `/clase1`, `/clase2`, `/cursowappy01` y cualquier nueva app futura) **DEBE** cumplir estrictamente estas 4 reglas de sesión, barra superior y conexiones:
> 1. **Detección Automática de Sesión Activa (`/api/auth/refresh`):**
>    - Al iniciar la página, consultar `POST /api/auth/refresh` con `credentials: 'include'` (y exponer `window.platformUser`, `window.platformUserToken`, `window.isPlatformLoggedIn` + evento `wappy-auth-updated`).
>    - En el backend (`studioAuth`, etc.), si una petición llega sin header `Authorization` pero con cookie `refreshToken` válida, autenticar automáticamente al usuario (`req.user`) y **NUNCA** sobreescribir una cuenta registrada con una clave de visitante (`wpy_guest_...`).
> 2. **Botón Superior Derecho Dinámico (`Ir a WAPPY` vs `Entrar a WAPPY →`):**
>    - **Si el usuario YA inició sesión en WAPPY:** El botón de la barra superior (`#navCtaEnterWappy`) **DEBE** transformarse exactamente igual que en la página de inicio (`LandingPage.tsx`), mostrando el avatar del usuario (`user.avatar` o iniciales DiceBear `#0d9488`) + **`Entrar a WAPPY →`** apuntando directo a `/c/new` (y en menú móvil `#mobileCtaEnterWappy`: `Entrar a WAPPY como ${firstName} →` hacia `/c/new`).
>    - **Si el usuario NO ha iniciado sesión:** Mostrar `Ir a WAPPY` apuntando a `/login`.
> 3. **Hidratación Automática de Todas las Conexiones del Usuario Registrado vs. Visitante:**
>    - **Usuario Registrado (`isAuthenticated: true`):** Traer automáticamente todas las conexiones de su cuenta: su clave personal `wpy_live_...` (`UserApiKey`), su conexión activa al daemon de Google Antigravity (`antigravityStreamClients`), sus claves API de Gemini y sus integraciones (Google Drive, NotebookLM, Google Flow).
>    - **Prioridad Estricta en `requireApiKeyOrJwt` y Puente Antigravity (`mcpBridge.js`):** La jerarquía de autenticación **DEBE** ser siempre: `1) wpy_live_...` ➔ `2) JWT (Authorization / ?token=)` ➔ `3) Cookie refreshToken` ➔ `4) wpy_guest_...`. Una clave `wpy_guest_...` residual en `localStorage` o query string **JAMÁS** debe degradar a un usuario autenticado en WAPPY a visitante.
>    - **Visitante No Registrado (`isGuest: true`):** Permitirle conectarse directamente desde la app generando su clave local `wpy_guest_...` y guardando sus claves en `localStorage`.
> 4. **Datos de Empresa Obligatorios y Sincronización Cross-App / Somos SST:**
>    - Ninguna función operativa de la app debe ejecutarse si los datos obligatorios de la empresa no están creados.
>    - Si el usuario está registrado, sincronizar bidireccionalmente con las empresas creadas en **Somos SST** (`/api/sgsst/company-info/all`). Si no está registrado, compartir la empresa creada en `localStorage` (`wappy_sgsst_companies`) entre todas las apps de WAPPY.
