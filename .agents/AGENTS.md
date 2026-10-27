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

## 4. Estilo Obligatorio de Botones, Insignias y Botoneras (WAPPY 14-Group Design System)
> [!IMPORTANT]
> **REGLA ESTRICTA DE DISEÑO DE BOTONES E INSIGNIAS EXPANSIBLES:**
> Todos los botones auto-expansibles, insignias de conexión de Hitos, botones de barra de herramientas (toolbars), copiar, exportar, importar, generar con IA, modelo de IA, sincronizar, guardar o eliminar en WAPPY deben seguir **ESTRICTAMENTE** la geometría compacta con inclinación (`sm:hover:-rotate-3 sm:hover:scale-105`) y los **14 Grupos Semánticos de Color** definidos en `client/src/components/Common/ExpandableButton.tsx`:
>
> 1. **Geometría y Física Común (Todos los Botones e Insignias Expansibles):**
>    - **Componente Maestro:** `client/src/components/Common/ExpandableButton.tsx` (y sus adaptadores `ExpandingButton`, `ToolbarButton`, `WappyExpandButton`, `SGSSTLegalBadge`, `DummyGenerateButton`, `ModelSelector`, `ExportDropdown`).
>    - **Dimensiones estándar responsive (`size="md"`):** `h-9 px-2.5 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px] rounded-xl`, ícono `h-4 w-4`, texto `text-sm font-bold tracking-wide`.
>    - **Dimensiones para tablas (`size="sm"`):** `h-8 px-2 min-w-[32px] sm:h-9 sm:px-2.5 sm:min-w-[36px] rounded-xl`, ícono `h-3.5 w-3.5 sm:h-4 sm:w-4`, texto `text-xs font-bold tracking-wide`.
>    - **Animación y Física al Hover (Ladeado + Expansión):**
>      - Clase del botón: `transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95`
>      - Contenedor del texto: `hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[260px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap`
>    - **Prohibido:** Usar `rounded-full` (tipo píldora redonda) o rellenos sólidos pesados (`bg-teal-600 text-white`). Todos usan fondo translúcido (`/10`) y borde (`/30`) de su grupo semántico.
>
> 2. **Los 14 Grupos Semánticos de Color (Obligatorios en todos los aplicativos):**
>    - **Grupo 1 — Normatividad CUMPLIDA (`compliance-ok` / `SGSSTLegalBadge`):** `border-emerald-500/70 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30` (con punto esmeralda pulsante).
>    - **Grupo 2 — Normatividad PENDIENTE (`compliance-warn` / `SGSSTLegalBadge`):** `bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20`.
>    - **Grupo 3 — Confirmar / Guardar / Aprobar / Fijar (`teal`):** `bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20`.
>    - **Grupo 4 — Crear / Añadir / Nuevo (`+`) (`emerald`):** `bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20`.
>    - **Grupo 5 — Actualizar / Sincronizar / Recargar / Despachar (`cyan`):** `bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20`.
>    - **Grupo 6 — Generar / Analizar / Auditar con IA (`Sparkles`) (`purple`):** `bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20`.
>    - **Grupo 7 — Selector de Modelo IA (Cerebro `Brain`) / Oráculo ML (`indigo`):** `bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20`.
>    - **Grupo 8 — Datos de Prueba (`Dummy` / Robot) / Alertas (`amber`):** `bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20`.
>    - **Grupo 9 — Importar / Subir / Cargar Base / Plantilla (`blue`):** `bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20`.
>    - **Grupo 10 — Exportar / Descargar / Imprimir / Reportes (`green`):** `bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300 hover:bg-green-500/20`.
>    - **Grupo 11 — Códigos QR / Portal Público / Copiar / Compartir (`fuchsia`):** `bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-500/20`.
>    - **Grupo 12 — Analíticas / Historial / Versiones / Ver / Editar (`orange`):** `bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20`.
>    - **Grupo 13 — Eliminar / Borrar / Limpiar / Peligro (`danger` / `rose`):** `bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20`.
>    - **Grupo 14 — Cerrar / Volver / Cancelar / Pantalla Completa / Default (`neutral` / `slate`):** Todo botón que pertenezca a acciones de cierre o que no esté en los grupos anteriores usa un único color unificado: `bg-slate-500/10 dark:bg-zinc-800/80 border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-500/20`.

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
> 8. **PUENTE REACTIVO PUSH EN TIEMPO REAL TENSHI <-> ANTIGRAVITY (SIN CRONS DE SONDEO):**
>    - La conexión bidireccional entre Tenshi (celular/web) y Google Antigravity utiliza arquitectura **Event-Driven Push SSE** (`/api/mcp-bridge/antigravity/stream`) + el binario nativo `~/.gemini/antigravity/bin/agentapi` (*Reactive Wakeup* vía `bin/wappy-antigravity-daemon.js`).
>    - Está **terminantemente prohibido** usar o instruir crons periódicos (`schedule` cada 2 minutos) para sondear órdenes delegadas de Tenshi. Tanto el disparo de `nueva_orden` hacia Antigravity como la entrega de `orden_completada` hacia el Canvas de Tenshi operan por Push en tiempo real (0 ms de latencia y 0 consumo de tokens en reposo).

---

## 7. Protocolo Obligatorio de Creación y Producción de Vídeos (WAPPY Video Framework)
> [!CRITICAL]
> **PROHIBICIÓN ESTRICTA DE CODIFICAR O RENDERIZAR VÍDEOS SIN ALINEACIÓN Y APROBACIÓN PREVIA:**
> Antigravity / cualquier agente de codificación tiene **TERMINANTEMENTE PROHIBIDO** saltar directamente a programar (`motor.js`, `index.html`) o renderizar videos completos en MP4 sin haber guiado al usuario y obtenido su aprobación explícita en el siguiente protocolo estructurado de 5 pasos:
>
> 1. **Paso 1: Formato, Propósito y Audiencia:**
>    - Consultar u ofrecer opciones de formato: **Horizontal (16:9 - 1920x1080)** para YouTube / Masterclasses vs **Vertical (9:16 - 1080x1920)** para Reels / TikTok / Shorts.
>    - Definir el objetivo claro (Promocional/Marketing de conversión, Tutorial técnico, Explicativo normativo SST, Showcase).
> 2. **Paso 2: Selección de Fondo y Atmósfera Visual (Opciones Múltiples):**
>    - Presentar alternativas claras para elegir tanto en horizontal como en vertical:
>      * **Opción A - Dark Tech Cinema:** Fondo oscuro profundo (`#080c04` a `#0e1300`), partículas lumínicas sutiles, cuadrícula suave, acentos verde lima `#c7f303` de alto dramatismo y contraste.
>      * **Opción B - WAPPY Sky & Clouds:** Azul cielo oficial (`#5bb8f5` a crema `#f6f5ef`), nubes suaves vectoriales y tarjetas translúcidas de cristal (Clean, amigable y corporativo moderno).
>      * **Opción C - Editorial Warm Cream:** Fondo crema cálido editorial (`#f6f5ef` a `#eceae1`), tipografía negra oliva con acentos turquesa `#0d9488` y lima (Estilo Stripe/Notion de alta gama).
>      * **Opción D - Dinámico por Tensión (Storytelling Split):** El fondo muta según la narrativa (oscuro tenso en la frustración/problema $\rightarrow$ luminoso y vibrante en la solución).
> 3. **Paso 3: Personajes, Poses y Roles Escénicos:**
>    - Definir quién aparece y qué rol desempeña:
>      * **Félix (Avatar 3D Low-Poly):** Narrador/Host. GESTOS NATURALES DE BRAZOS Y CABEZA ÚNICAMENTE. Está **ESTRICTAMENTE PROHIBIDO** añadir rayos láser, sables o efectos toscos en las manos. La barba debe mantenerse en bajo relieve (`~0.036`) igualada al bigote/boso.
>      * **Tenshi (Diseño Oficial Fullbody):** Mascota e IA oráculo, flotando sutilmente con halo y expresiones amigables.
>      * **Solo Motion Graphics:** Sin avatares humanos, 100% tipografía cinética y tarjetas Bento con iconos duotone.
>    - Definir balance espacial: respetar tercios de composición (evitar dejar la izquierda vacía con elementos amontonados a la derecha).
> 4. **Paso 4: Tipografía de Marca y Prohibición de Elementos Web:**
>    - Tipografía: Titulares en *Outfit* / *Plus Jakarta Sans* con resaltador lima `#c7f303` desplegable sincronizado con la voz, textos limpios en *Inter*.
>    - **PROHIBICIÓN ESTRICTA DE ELEMENTOS DE PÁGINA WEB:** Está terminantemente prohibido incrustar barras de navegación web (`WappyNavbar`), cabeceras de landing page o botones de sitios web en videos de marketing, a menos que el usuario pida explícitamente "muestra una página web". Un video es una experiencia cinematográfica y de motion graphics, no una captura de pantalla de un sitio web.
> 5. **Paso 5: Guión Estructural Escena por Escena y Previsualizaciones:**
>    - Presentar la tabla estructural del guión (segundos, locución exacta, disposición visual izquierda/centro/derecha, animaciones y CTA).
>    - **Uso Obligatorio de Transiciones Dinámicas:** Todo guión debe encadenar activamente al menos 4 transiciones maestras de la skill `animaciones-17-efectos-reels` (Orbit 3D, Zoom-Through inmersivo sin corte, Frame Break, UI World, Digital Zoom con retícula, Phone Mockup 3D, Headline Wall, Chart Grow, Doodle Boil, Glass Type). Prohibido dejar escenas estáticas o usar fundidos simples sin dinamismo.
>    - **Previsualización antes de render:** Generar imágenes fijas de demostración (frames clave) de cada escena para validación visual rápida con el usuario antes de procesar cualquier render completo en MP4.


