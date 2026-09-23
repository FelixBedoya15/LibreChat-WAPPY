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
> **REGLA ESTRICTA DE DISEÑO DE BOTONES Y BOTONERAS:**
> Todos los botones y botoneras en WAPPY deben seguir fielmente el patrón visual ya establecido:
>
> 1. **Botonera Flotante Cápsula / Toolbar (`SGSSTToolbar`):**
>    - **Contenedor Cápsula:** `inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/40 dark:shadow-none`.
>    - **Tabs Cuadrados con Ícono:** `w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all shadow-2xs active:scale-95`.
>    - **Tab Activo:** `bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-600 dark:text-teal-300 font-bold`.
>    - **Badges/Notificaciones:** Círculo o píldora en esquina superior derecha: `bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center`.
>
> 2. **Botones de Acción Primarios y Secundarios (Pills / Botones Principales):**
>    - **Estructura base:** `flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95`.
>    - **Botón Naranja / IA:** `bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white`.
>    - **Botón Teal / Confirmar:** `bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white`.
>    - **Botón Neutro / Secundario:** `bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-sm`.
>
> 3. **Micro-Botones de Filas en Tablas (Expansibles al Hover):**
>    - **Contenedor:** `group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-sm active:scale-95`.
>    - **Texto auto-expandible:**
>      `<div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex"><span className="text-[10px] font-bold">{Texto}</span></div>`
>    - **Ver / Examinar:** `bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100`.
>    - **Reprogramar / Editar:** `bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 hover:bg-amber-100`.
>    - **WhatsApp:** `bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100`.
>    - **Eliminar / Cancelar:** `text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600`.

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

