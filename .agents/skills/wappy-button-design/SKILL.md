---
name: wappy-button-design
description: Directrices estrictas y componentes del sistema de diseño para botones, barras de herramientas (botoneras) flotantes y micro-botones en WAPPY. Usar SIEMPRE que se cree, modifique o estilice cualquier botón o barra de herramientas en el frontend.
---

# WAPPY Button & Toolbar Design System

Este estándar define de forma permanente el estilo visual de todas las botoneras y botones en LibreChat-WAPPY (inspirado en `SGSSTToolbar` e interfaces de Hitos SGSST):

## 1. Botonera Flotante Cápsula / Isla (`SGSSTToolbar`)
Se utiliza como barra de control superior en los módulos de SGSST, LMS y herramientas de gestión:
- **Contenedor:**
  `inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/40 dark:shadow-none`
- **Botón Cuadrado Tab / Herramienta:**
  `w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all shadow-2xs active:scale-95`
- **Estado Activo (Tab seleccionado):**
  `bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-600 dark:text-teal-300 font-bold`
- **Badges/Notificaciones:**
  `bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center absolute -top-1.5 -right-1.5`

## 2. Botones de Acción Primarios y Secundarios (Pills / Botones de Mando)
- **Estructura base:**
  `flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95`
- **Acción con IA / Especial:**
  `bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white`
- **Acción Primaria Teal / Guardar / Confirmar:**
  `bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white`
- **Botón Neutro / Secundario / Cancelar:**
  `bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-sm`

## 3. Micro-Botones en Tablas de Datos (Expansibles al Hover)
En tablas de expedientes, citas o inventarios, las acciones por fila usan micro-botones interactivos compactos que revelan su etiqueta de texto al posar el cursor:
- **Ver / Inspeccionar:** `bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100`
- **Reprogramar / Editar:** `bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 hover:bg-amber-100`
- **WhatsApp:** `bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100`
- **Eliminar / Cancelar:** `text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600`
