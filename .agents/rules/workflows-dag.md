---
trigger: glob
globs: "**/systemWorkflowPresetsCatalog.js, **/automationScheduler.js, **/WappyWorkflowCanvas.tsx, **/validate-workflow-logic.js"
description: "Invariantes de flujos lógicos y automatizaciones DAG estilo n8n en /tareas (causalidad izquierda->derecha, roles Hito, compuertas y anti-duplicados)."
---

# Reglas Contextuales — Flujos Lógicos & Automatizaciones DAG (`/tareas`)

1. **Causalidad Estricta de Izquierda a Derecha (DAG):**
   - Ningún nodo puede depender de datos que solo existen aguas abajo. Separar claramente fuentes de lectura (`source_read`) y destinos de escritura/reporte (`target_write_report`) en aplicativos Hito.
2. **Cero Fuentes Redundantes:**
   - No duplicar extractores ni consultas redundantes si el nodo anterior ya entrega el contexto estructurado en `outputItems`.
3. **Compuertas Deterministas (`pre_agent` vs `post_agent`):**
   - Aplicar filtros y dedup deterministas antes de gastar tokens en el `AI Agent` (`pre_agent`), y validar salidas/acciones con compuertas `post_agent` antes de escribir en módulos SG-SST o enviar notificaciones.
4. **Deduplicación con Estado (`processedEntityKeys`):**
   - Todo flujo periódico o basado en eventos debe registrar y respetar claves de entidad procesada para evitar ejecuciones o registros duplicados.
5. **Validación Multi-Escenario Obligatoria:**
   - Ejecutar `validate-workflow-logic.js` y consultar `workflow-logic-lessons.md` antes y después de modificar presets o el scheduler.
