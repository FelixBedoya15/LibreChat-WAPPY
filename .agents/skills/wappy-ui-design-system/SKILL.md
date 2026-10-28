---
name: wappy-ui-design-system
description: >-
  Sistema de diseño oficial y biblia visual de WAPPY IA: los 14 Grupos Semánticos de Color (ExpandableButton.tsx), geometría e inclinación hover, tarjetas Glassmorphism, luces ambientales, micro-animaciones SVG y exportación de tablas para LiveEditor (html-docx). Úsala SIEMPRE que se diseñe, cree o refactorice cualquier interfaz, botón, modal, tarjeta o reporte en el frontend.
---

# Sistema de Diseño Oficial de WAPPY IA (`wappy-ui-design-system`)

Esta skill consolida la arquitectura visual de **WAPPY IA** (`WAPPY_DESIGN_RULES.md` + `ExpandableButton.tsx`). Todo agente o diseñador UI debe seguirla estrictamente al crear o editar vistas en `client/src/**/*`.

---

## 1. Botones e Insignias Expansibles (WAPPY 14-Group Design System)

> [!IMPORTANT]
> **REGLA ESTRICTA DE BOTONES E INSIGNIAS (`client/src/components/Common/ExpandableButton.tsx`):**
> Todos los botones auto-expansibles, insignias de conexión de Hitos, botones de barra de herramientas (toolbars), copiar, exportar, importar, generar con IA, selector de modelo, sincronizar, guardar o eliminar deben seguir estrictamente la geometría compacta con inclinación y los **14 Grupos Semánticos de Color**:

### A. Geometría y Física Común
- **Componente Maestro:** `client/src/components/Common/ExpandableButton.tsx` (y adaptadores `ExpandingButton`, `ToolbarButton`, `WappyExpandButton`, `SGSSTLegalBadge`, `DummyGenerateButton`, `ModelSelector`, `ExportDropdown`).
- **Dimensiones estándar responsive (`size="md"`):** `h-9 px-2.5 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px] rounded-xl`, ícono `h-4 w-4`, texto `text-sm font-bold tracking-wide`.
- **Dimensiones para tablas (`size="sm"`):** `h-8 px-2 min-w-[32px] sm:h-9 sm:px-2.5 sm:min-w-[36px] rounded-xl`, ícono `h-3.5 w-3.5 sm:h-4 sm:w-4`, texto `text-xs font-bold tracking-wide`.
- **Animación y Física al Hover (Ladeado + Expansión):**
  - Clase del botón: `transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95`
  - Contenedor del texto: `hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[260px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap`
- **Prohibido:** Usar `rounded-full` (tipo píldora redonda) o rellenos sólidos pesados (`bg-teal-600 text-white`). Todos usan fondo translúcido (`/10`) y borde (`/30`) de su grupo semántico.

### B. Los 14 Grupos Semánticos de Color (Obligatorios)
1. **Grupo 1 — Normatividad CUMPLIDA (`compliance-ok` / `SGSSTLegalBadge`):** `border-emerald-500/70 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30` (con punto esmeralda pulsante).
2. **Grupo 2 — Normatividad PENDIENTE (`compliance-warn` / `SGSSTLegalBadge`):** `bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20`.
3. **Grupo 3 — Confirmar / Guardar / Aprobar / Fijar (`teal`):** `bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20`.
4. **Grupo 4 — Crear / Añadir / Nuevo (`+`) (`emerald`):** `bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20`.
5. **Grupo 5 — Actualizar / Sincronizar / Recargar / Despachar (`cyan`):** `bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20`.
6. **Grupo 6 — Generar / Analizar / Auditar con IA (`Sparkles`) (`purple`):** `bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20`.
7. **Grupo 7 — Selector de Modelo IA (Cerebro `Brain`) / Oráculo ML (`indigo`):** `bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20`.
8. **Grupo 8 — Datos de Prueba (`Dummy` / Robot) / Alertas (`amber`):** `bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20`.
9. **Grupo 9 — Importar / Subir / Cargar Base / Plantilla (`blue`):** `bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20`.
10. **Grupo 10 — Exportar / Descargar / Imprimir / Reportes (`green`):** `bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300 hover:bg-green-500/20`.
11. **Grupo 11 — Códigos QR / Portal Público / Copiar / Compartir (`fuchsia`):** `bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-500/20`.
12. **Grupo 12 — Analíticas / Historial / Versiones / Ver / Editar (`orange`):** `bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20`.
13. **Grupo 13 — Eliminar / Borrar / Limpiar / Peligro (`danger` / `rose`):** `bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20`.
14. **Grupo 14 — Cerrar / Volver / Cancelar / Pantalla Completa / Default (`neutral` / `slate`):** `bg-slate-500/10 dark:bg-zinc-800/80 border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-500/20`.

---

## 2. Botonera Flotante Isla (`SGSSTToolbar`)
- **Contenedor:** `inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/40 dark:shadow-none`
- **Estado Activo (Tab seleccionado):** `bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-600 dark:text-teal-300 font-bold`

---

## 3. Superficies, Glassmorphism, Luces Ambientales y Tipografía
- **Superficies y Textos:** Usar clases nativas `bg-surface-primary`, `bg-surface-secondary`, `text-text-primary`, `text-text-secondary` para compatibilidad perfecta con Dark Mode.
- **Títulos Principales (H1/H2):**
  `bg-gradient-to-r from-green-500 to-cyan-500 bg-clip-text text-transparent font-extrabold tracking-tight`
- **Tarjetas Glassmorphism:**
  `group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-6 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5`
- **Luces Ambientales (Glows en Esquinas):**
  Siempre con `pointer-events-none` y `blur-3xl` (`bg-green-500/10` arriba-derecha y `bg-emerald-500/10` abajo-izquierda).
- **Micro-Animaciones SVG:** En Hero Sections o estados vacíos, preferir SVGs con `<animate>` nativo (pulsos suaves o trazado `stroke-dasharray`).

---

## 4. Renderizado de Informes y Tablas para Exportación (`LiveEditor` / `html-docx`)
Al construir tablas o informes en aplicativos SGSST que se exportan a Word/PDF mediante `<LiveEditor />` y `<ExportDropdown />`:
1. **Estilos CSS en línea obligatorios (`style={{...}}`):** No encerrar tablas complejas en `className="flex"` vacío.
2. **Estructura de `<table/>`:** Siempre `border-collapse: collapse; width: 100%;` y colores hexadecimales planos (`#e2e8f0`, `#f1f5f9`, `#334155`) en lugar de variables CSS `var(--border)` para que `html-docx-js` conserve los bordes en Word.
