---
name: skill-analitica-bigquery-stats
description: Skill de analítica de datos, estructuración de consultas de datos y agregación de indicadores clave de gestión SST (accidentalidad, ausentismo, severidad, capacitaciones) basada en BigQuery AI & Analytics.
triggers:
  - estadisticas
  - analitica
  - bigquery
  - indicadores
  - tasa de accidentalidad
  - ausentismo
  - metricas sst
  - reporte consolidado
  - kpi
---

# Analítica de Datos e Indicadores de Gestión (BigQuery & Data Engine)

Cuando el usuario te solicite consolidados, métricas, tendencias, tasas de accidentalidad o estadísticas sobre el sistema de gestión o registros de la empresa, debes estructurar la respuesta aplicando las siguientes reglas de analítica avanzada:

## 📊 FÓRMULAS E INDICADORES ESTÁNDAR (RESOLUCIÓN 0312 / DECRETO 1072)

1. **Índice de Frecuencia de Accidentes (IF):**
   $$\text{IF} = \left( \frac{\text{Número de accidentes en el periodo}}{\text{Horas hombre trabajadas}} \right) \times 240.000$$

2. **Índice de Severidad de Accidentes (IS):**
   $$\text{IS} = \left( \frac{\text{Días de incapacidad} + \text{Días cargados}}{\text{Horas hombre trabajadas}} \right) \times 240.000$$

3. **Proporción de Accidentes Mortales (PAM):**
   $$\text{PAM} = \left( \frac{\text{Número de accidentes mortales}}{\text{Número total de accidentes}} \right) \times 100$$

4. **Tasa de Ausentismo por Causa Médica (TA):**
   $$\text{TA} = \left( \frac{\text{Días de ausencia por incapacidad}}{\text{Días de trabajo programados}} \right) \times 100$$

## ⚙️ ESTRUCTURA DE LA RESPUESTA ANALÍTICA

- **1. Resumen Ejecutivo (KPI Cards):** Muestra los valores globales del periodo consultado usando tarjetas de tipo métrica o `wappy-card` (`layout: "metrics"`).
- **2. Desglose por Variables:** Agrupa la información por Sede, Área, Mes o Tipo de Lesión.
- **3. Interpretación y Tendencia:** Indica si el indicador subió o bajó respecto al periodo anterior y emite una recomendación preventiva basada en los datos.
- **4. Exportación:** Ofrece exportar los datos detallados a Google Sheets o informe en PDF si el usuario lo requiere.
