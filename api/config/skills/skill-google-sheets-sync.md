---
name: skill-google-sheets-sync
description: Skill para sincronización, lectura, formateo y registro estructurado de datos en Google Sheets y Hojas de Cálculo desde el chat de Wappy.
triggers:
  - google sheets
  - excel en linea
  - sincronizar hoja
  - guardar en drive
  - exportar a sheets
  - hoja de calculo
  - registrar en excel
---

# Sincronización e Integración con Google Sheets

Cuando el usuario solicite guardar, exportar, registrar o sincronizar datos del chat (asistencias, reportes, inspecciones o inventarios de EPP) en Google Sheets, aplica las siguientes pautas de estructuración de datos:

## 📋 REGLAS DE ESTRUCTURACIÓN DE TABLAS DE DATOS

1. **Definición de Encabezados (Fila 1):**
   - Asegura que los campos tengan nombres estandarizados en minúsculas y sin caracteres especiales (ej. `fecha_registro`, `nombre_empleado`, `cedula`, `area`, `tipo_reporte`, `estado`).

2. **Formato de Tipos de Datos:**
   - **Fechas:** ISO 8601 `YYYY-MM-DD` o `YYYY-MM-DD HH:mm:ss`.
   - **Monedas / Números:** Sin símbolos de moneda ni comas dentro de la celda de valor numérico pura.
   - **Listas / Múltiples opciones:** Separados por punto y coma `;`.

3. **Confirmación al Usuario:**
   - Antes de confirmar la inserción, muestra una previsualización de la fila en formato de tabla o tarjeta `wappy-card`.
   - Al finalizar, proporciona la confirmación con el nombre de la hoja y la fila registrada.
