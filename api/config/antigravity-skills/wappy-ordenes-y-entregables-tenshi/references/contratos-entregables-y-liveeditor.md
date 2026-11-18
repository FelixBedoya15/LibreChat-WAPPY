# Contratos de Entregables, Reglas `LiveEditor` (`html-docx`) y Plantilla Ejecutiva SG-SST

Este documento de referencia especifica la estructura exacta esperada por el backend de WAPPY IA al recibir respuestas o archivos desde Google Antigravity.

---

## 1. Contrato HTTP de Cierre y Entrega Directa

- **Endpoints Oficiales:**
  - `POST /api/mcp-bridge/antigravity/ordenes/:id/completar`
  - `POST /api/mcp-bridge/antigravity/completar`
- **Autenticación:** Header `x-api-key: wpy_live_...` (o `Authorization: Bearer wpy_live_...`).
- **Modo Espontáneo (`ordenId: "auto"`):**
  Cuando el usuario no proviene de una orden previa y pide desde Antigravity enviar un archivo o informe directamente a Tenshi (`entregar-a-tenshi.js --file=...` sin `--orden-id`), el servidor asocia automáticamente la orden en curso reciente o crea una entrega directa limpia en `TenshiMessage` + `CanvasSession` y dispara el evento SSE `orden_completada` en tiempo real al navegador/celular del usuario.

---

## 2. Reglas Anti-Corrupción para `LiveEditor` (Exportación Word `.docx` y `.pdf`)

Cuando envíes `formato: "documento"`, `mcpBridge.js` ejecuta `formatWappyEditorDocument(markdown, titulo, company)` y sincroniza el resultado con `CanvasSession` y `LiveEditorSession`:

1. **Cero Envoltorios HTML Externos:**
   - **PROHIBIDO** iniciar con `<!DOCTYPE html>`, `<html>`, `<head>` o `<body>`.
   - El servidor inyecta automáticamente el cabezote institucional **`INFORMACIÓN RESUMIDA DE LA ENTIDAD`** (Razón Social, NIT, Actividad Económica, Clase de Riesgo, Código Documental, Versión y Fecha) y el bloque interactivo de **Firmas Digitales** (Elaboró / Revisó / Aprobó).
2. **Tablas Markdown 100% Compatibles con `html-docx`:**
   - Todas las filas de una tabla deben tener **exactamente el mismo número de columnas** que la fila de encabezado.
   - **PROHIBIDO** insertar saltos de línea reales ni bloques `<ul><li>` crudos dentro de una celda `| ... |`. Para listar varios controles o evidencias dentro de una celda usa viñetas separadas por `<br>` (ejemplo: `• Control de ingeniería: línea de vida certificada<br>• Administrativo: ATS y permiso Res. 4272/2021`).
   - Evita tablas de más de **7 columnas** para que al exportar a Word tamaño Carta vertical ninguna columna quede comprimida a una letra por renglón.
3. **Extensión Mínima:**
   - Todo `formato: "documento"` exige al menos **300 caracteres** de desarrollo técnico real fundamentado en los datos de la empresa activa.

---

## 3. Estructura Maestra Recomendada para Documentos Técnicos SG-SST

```markdown
## 1. OBJETIVO Y ALCANCE
Definir los lineamientos técnicos y controles operacionales aplicables a **[PROCESO / SEDE]** de **[RAZÓN SOCIAL DE LA EMPRESA ACTIVA]**, cubriendo a trabajadores directos, contratistas y visitantes.

## 2. MARCO NORMATIVO VIGENTE EN COLOMBIA
- **Decreto 1072 de 2015** (Libro 2, Parte 2, Título 4, Capítulo 6): Sistema de Gestión de la Seguridad y Salud en el Trabajo.
- **Resolución 0312 de 2019**: Estándares Mínimos del SG-SST.
- **[Norma específica aplicable al tema: Res. 4272/2021, GTC 45, Res. 20223040040595, Decreto 1496/2018, Res. 1401/2007, Res. 2764/2022]**.

## 3. DIAGNÓSTICO Y HALLAZGOS BASADOS EN DATOS REALES DE LA EMPRESA
Síntesis cuantitativa obtenida desde las herramientas MCP de `wappy` (nómina, riesgos críticos, calificación 0312 o certificados verificados).

## 4. MATRIZ TÉCNICA / PLAN DE ACCIÓN (5W2H — PHVA)

| Ciclo PHVA | Hallazgo / Peligro | Acción Correctiva o Preventiva | Responsable | Plazo | Evidencia / Indicador |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Hacer | Trabajo en cubiertas (> 2.0 m) | Verificar vigencia anual/18m en MinTrabajo<br>• Emitir permiso Res. 4272/2021 | Responsable SG-SST | Inmediato | 100% permisos firmados con constancia PDF |

## 5. SEGUIMIENTO E INDICADORES DE GESTIÓN
Fórmula de medición, meta porcentual y periodicidad conforme al Art. 30 de la Resolución 0312 de 2019.
```

---

## 4. Checklist Rápido Pre-Cierre de Orden

- [ ] ¿Confirmaste la **empresa activa** (`wappy_consultar_perfil_empresa`) antes de citar cifras o trabajadores?
- [ ] Si había fotos/videos en `/tmp/wappy_media_...`, ¿los inspeccionaste con `read_file`?
- [ ] Si la orden vino de `/tareas` (`sgsst_workflow_antigravity` / `sgsst_automation`), ¿cerraste con `formato: "respuesta"` indicando entrega al Flujo Autónomo sin mencionar Tenshi Voz?
- [ ] Si enviaste un `.pdf` oficial de un portal colombiano, ¿verificaste que provenga de `consultar-portal-colombia.js` con cabecera `%PDF` real?
