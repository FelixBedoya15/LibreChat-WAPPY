# Antigravity Frontend Rules (`client/`)

> [!CRITICAL]
> **COMPILACIÓN OBLIGATORIA DEL FRONTEND:**
> Dokploy NO compila el frontend en el servidor; copia directamente `client/dist`.
> Siempre que se modifique cualquier archivo en `client/src/**/*`:
> 1. Ejecutar localmente antes de terminar o hacer commit:
>    ```bash
>    npm run build:client
>    ```
> 2. Versionar ambos:
>    ```bash
>    git add client/src client/dist
>    ```
> 3. NUNCA hacer commit solo de `client/src` sin `client/dist`.

---

## Estilo Obligatorio de Botones y Botoneras (WAPPY Design System)
Todos los botones y botoneras en WAPPY deben seguir:
1. **Botonera Flotante Cápsula (`SGSSTToolbar`):** `inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg`.
2. **Tabs Cuadrados:** `w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all shadow-2xs active:scale-95`.
3. **Pill Buttons Primarios:** `flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95`. Gradients: `from-orange-500 to-amber-500` (IA), `from-teal-600 to-teal-700` (Acción principal).
4. **Micro-Botones de Filas en Tablas (Expansibles):** `group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-sm active:scale-95`.
   - Hover expansion: `<div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex"><span className="text-[10px] font-bold">{Texto}</span></div>`.

