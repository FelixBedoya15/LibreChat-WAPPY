# Antigravity AI Assistant - Reglas Obligatorias del Proyecto LibreChat-WAPPY

> [!CRITICAL]
> **REGLA ESTRICTA DE COMPILACIÓN LOCAL DEL FRONTEND (`client/dist`):**
> El despliegue de este proyecto en Dokploy usa `Dockerfile.multi`, el cual **NO compila el frontend en el servidor**; simplemente copia la carpeta local:
> `COPY client/dist ./client/dist`
>
> Por esta razón, **SIEMPRE** que Antigravity (o cualquier agente de codificación) modifique, cree o elimine cualquier archivo dentro de `client/src/**/*` o toque configuraciones/dependencias del frontend:
> 1. Antigravity **DEBE** ejecutar localmente antes de finalizar el turno o antes de hacer commit:
>    ```bash
>    npm run build:client
>    ```
> 2. Antigravity **DEBE** incluir en el commit tanto los archivos fuente de `client/src` como los bundles compilados de `client/dist`:
>    ```bash
>    git add client/src client/dist
>    ```
> 3. **ESTÁ TERMINANTEMENTE PROHIBIDO** hacer commit únicamente de `client/src` sin haber compilado e incluido `client/dist`. Si no se compila localmente, Dokploy desplegará la versión anterior y los cambios del usuario no se verán reflejados en el navegador.

---

## 2. Comandos de Sincronización en el VPS de Producción (`srv999875`)
Cuando el usuario solicite desplegar o actualizar cambios en el servidor VPS de producción (`srv999875`):
```bash
cd /root/LibreChat-WAPPY && git pull
docker cp /root/LibreChat-WAPPY/client/dist/. LibreChat:/app/client/dist/
docker exec -it LibreChat node scripts/restore-and-sync-all.js
```

---

## 3. Prácticas de Desarrollo en este Repositorio
- **Componentes SGSST / Hitos:** Mantener diseño responsive (`md:flex-row`), vistas móviles con selector condicional y botón volver, y manejo defensivo ante campos nulos (`x?.trim() || ''`, `Array.isArray(arr) ? arr : []`).
- **Rutas de API:** Toda modificación en `api/server/routes/**/*.js` debe verificarse sintácticamente con `node -c <archivo.js>` antes de dar por completada la tarea.
- **Git Commits:** Mensajes claros siguiendo Conventional Commits (`fix: ...`, `feat: ...`, `build(client): ...`).

---

## 4. Estilo Obligatorio de Botones y Botoneras (WAPPY Design System)
> [!IMPORTANT]
> **REGLA ESTRICTA DE DISEÑO DE BOTONES Y BOTONERAS (ESTILO "OCULTAR ANALÍTICAS / SINCRONIZAR"):**
> Todos los botones auto-expansibles, botones de barra de herramientas (toolbars), botones de copiar, exportar, generar con IA, sincronizar, guardar o acciones principales/secundarias en WAPPY deben seguir **ESTRICTAMENTE** el estilo sobrio, limpio y auto-expansible de `ExpandableButton`:
>
> 1. **Componente Maestro Auto-Expansible (`ExpandableButton` / `ExpandingButton` / `WappyExpandButton` / `ToolbarButton`):**
>    - **Ubicación principal:** `client/src/components/Common/ExpandableButton.tsx`.
>    - **Regla:** SIEMPRE que se cree o modifique cualquier botón de acción, barra de herramientas (toolbar), filtros, analíticas, sincronización, copiar, exportar, generar con IA o acciones en filas de tabla que requieran contraer/expandir al posar el cursor (`hover`), **DEBE USARSE `ExpandableButton` (o su estilo exacto)**.
>    - **Dimensiones estándar:**
>      - Tamaño normal (`size="md"`): Cuadrado inicial `h-9 px-3.5 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px]`, esquinas `rounded-xl`.
>      - Tamaño compacto para tablas (`size="sm"`): Cuadrado inicial `h-8 px-2.5 min-w-[32px] sm:h-8.5 sm:px-2.5 sm:min-w-[34px]`, esquinas `rounded-xl`.
>    - **Superficie en reposo (Idle):** Fondo limpio `bg-white dark:bg-gray-900`, borde sutil `border border-border-medium/40 shadow-sm`, con el **ícono y texto coloreados** según la variante (`text-teal-600 dark:text-teal-400`, `text-emerald-600`, `text-purple-600`, `text-amber-600`, `text-rose-600`, `text-blue-600`, o neutro `text-text-secondary hover:text-text-primary`) y hover con tinte ultra-suave (`hover:bg-teal-50/50 dark:hover:bg-teal-950/20`).
>    - **Superficie activa (Active / Toggle abierto):** Tinte suave `bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20 dark:bg-teal-950/20 dark:text-teal-400` (o su equivalente en el color de la variante).
>    - **Animación de expansión al hover:**
>      `<div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[220px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap"><span className="text-xs font-bold tracking-wide">{label}</span></div>`
>    - **TERMINANTEMENTE PROHIBIDO:**
>      - Prohibido usar `rounded-full` (tipo píldora redonda) en botones. Todas las esquinas deben ser `rounded-xl`.
>      - Prohibido usar rellenos sólidos pesados o degradados saturados (`bg-teal-600 text-white`, `bg-gradient-to-r from-orange-500...`, `bg-indigo-600`, `bg-emerald-600`) en botones expansibles o de barra de herramientas.
>      - Prohibido usar rotaciones o inclinaciones al pasar el cursor (`hover:-rotate-3`, `sm:hover:-rotate-3`, `hover:scale-105`). Solo se permite `active:scale-95`.
>
> 2. **Botonera Flotante Cápsula / Toolbar (`SGSSTToolbar`):**
>    - **Contenedor Cápsula:** `inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/40 dark:shadow-none`.
>    - Todos los botones dentro de `SGSSTToolbar`, `ExportDropdown` y `ModelSelector` deben mantener exactamente el estilo limpio `bg-white dark:bg-gray-900 border-border-medium/40 rounded-xl` sin rotaciones.

---

## 5. Verificación Web Obligatoria de Modelos de IA Actuales (Memoria Permanente)
> [!CRITICAL]
> **PROHIBICIÓN ESTRICTA DE ASUMIR MODELOS DE IA:**
> Antigravity / cualquier agente de IA tiene **ESTRICTAMENTE PROHIBIDO** asumir, adivinar o confiar en cortes de conocimiento pasados para nombres, endpoints o versiones de modelos de IA (Google Gemini, OpenAI, Claude, etc.).
>
> 1. **INVESTIGACIÓN EN LA WEB OBLIGATORIA:**
>    Antes de tocar, modificar, sugerir o configurar cualquier modelo de IA en el código (`api/`, `packages/`, `client/`, `.env` o controladores de agentes), la IA **DEBE SIEMPRE** ejecutar herramientas de búsqueda web (`search_web`) o consultar la documentación oficial en vivo (`ai.google.dev`, `platform.openai.com`, etc.) para verificar los modelos activos, vigentes y sus nombres oficiales exactos.
> 2. **PROHIBIDO DEGRADAR O INVENTAR MODELOS:**
>    Nunca sustituir modelos configurados en el proyecto por versiones obsoletas o no verificadas.
> 3. **MANEJO DE ERRORES 503 / SOBRECARGA:**
>    Si un modelo responde con 503 (alta demanda en los servidores del proveedor), no desmantelar ni reemplazar la lista con modelos obsoletos; verificar siempre en la web las opciones oficiales activas de respaldo vigentes en la plataforma.

---

## 6. Reglas Estrictas de Tenshi Voice y Despacho Multiturno (Prevención de Regresiones)
> [!CRITICAL]
> **PROHIBICIÓN ESTRICTA DE REGRESIONES EN TENSHI Y DESPACHO DE CHATS:**
> Consultar siempre la bitácora técnica permanente en `docs/AUDITORIA_Y_LECCIONES_TENSHI.md`. Todo agente que toque la interacción por voz o despacho de mensajes DEBE acatar:
>
> 1. **CONTINUIDAD DE CHAT POR DEFECTO (NO ABRIR CHATS COMPULSIVAMENTE):**
>    - Si el usuario continúa conversando con el mismo especialista o sobre el mismo tema, **NUNCA abrir una nueva conversación (`/c/new`)**. Se debe reutilizar la conversación activa mediante el evento `tenshi-submit-agent-prompt`.
>    - Solo abrir un nuevo chat (`/c/new`) si el usuario solicita explícitamente cambiar de especialista (ej: "pásame al abogado") o pide explícitamente "abrir un nuevo chat" o "desde cero".
> 2. **DESPACHO MULTICANAL SIMULTÁNEO Y WATCHDOG DE ENVÍO:**
>    - Nunca depender únicamente de un click sintético en `#send-button` (Radix UI TooltipAnchor intercepta el evento). Se debe ejecutar un despacho multicanal simultáneo: React Hook Form `methods.handleSubmit(...)()`, hook directo `submitMessage({ text })` y DOM nativo `form.requestSubmit()`.
>    - Mantener un watchdog activo de verificación (hasta 3 segundos) que reintente el despacho hasta que el textarea quede limpio antes de borrar los parámetros de la URL. Si alcanza el límite, ejecutar reintento de emergencia y liberar el guard.
> 3. **ESPECIFICACIÓN DE GOOGLE MULTIMODAL LIVE API:**
>    - En `api/server/routes/voice/geminiLive.js`, `inputAudioTranscription: {}` y `outputAudioTranscription: {}` **DEBEN ser objetos vacíos**. Está terminantemente prohibido incluir `languageCodes` u otros campos internos dentro de `inputAudioTranscription`, ya que causa el error **Code 1011 (Internal error encountered)** y cierra el WebSocket inmediatamente.
>    - Todas las herramientas en `voiceSession.js` deben definir siempre el objeto `properties` tipado para evitar rechazos en el validador OpenAPI/Protobuf de Google.
> 4. **RECONEXIÓN RESILIENTE Y ROTACIÓN DE MODELOS:**
>    - Ante cualquier desconexión abrupta de Google (1011, 1006, 1001), `voiceSession.js` no debe matar la llamada; debe ejecutar `reconnectGemini()` rotando de modelo y clave en caliente y reenviando la última consulta huérfana del usuario.
> 5. **OBEDIENCIA DIRECTA A PETICIÓN DEL USUARIO:**
>    - Si el usuario dice "hazlo tú", "respóndeme tú", "no abras el chat" o se frustra con la delegación, Tenshi debe responder de inmediato con su base de conocimientos en SG-SST (normativa colombiana) sin insistir tozudamente en delegar al especialista.
> 6. **ESTRUCTURACIÓN PROFESIONAL OBLIGATORIA DEL PROMPT PARA ESPECIALISTAS:**
>    - Está terminantemente prohibido enviar frases telegráficas cortas o en crudo (ej: "Qué es medicina laboral" o "Resolución 0312").
>    - Tenshi debe formular en el parámetro 'pregunta' y el frontend en 'cleanDelegatedPrompt' una consulta técnica estructurada con planteamiento ocupacional, solicitud de fundamentación normativa colombiana (Decretos, Resoluciones aplicables) y recomendaciones prácticas para el SG-SST de la empresa.
> 7. **UNICIDAD ESTRICTA DE DECLARACIONES DE HERRAMIENTAS (PREVENCIÓN DE ERROR 1007):**
>    - En `api/server/routes/voice/voiceSession.js`, cada función en `this.liveConfig.tools[0].functionDeclarations` DEBE tener un nombre único en todo el array.
>    - Duplicar una herramienta provoca el cierre inmediato del WebSocket de voz por Google con código **1007 (Duplicate function declaration found)**.
>    - Antes de commitear, ejecutar siempre el script de comprobación que garantice 0 duplicados.

