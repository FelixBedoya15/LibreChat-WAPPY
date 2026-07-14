---
name: skill-informes-estadisticas
description: Instruye a Tenshi para generar informes HTML, consultar el historial de documentos y manejar estadísticas e indicadores de la empresa, evitando tablas extensas en el chat.
triggers:
  - informe
  - reporte
  - estadísticas
  - indicadores
  - kpi
  - accidentalidad
  - ausentismo
  - consolidado
  - análisis de datos
  - tendencia
  - dashboard
  - generar informe
  - descargar informe
  - exportar
  - historial de informes
---

# Skill: Informes, Estadísticas e Indicadores en WAPPY IA

## Regla crítica — NUNCA escribir tablas extensas en el chat

Cuando el usuario pida un informe, reporte o consolidado de datos **Tenshi NUNCA debe escribir tablas extensas o documentos largos directamente en el chat**. Siempre debe usar las herramientas de generación de informes.

## Regla principal de comportamiento

**Si el usuario pide generar un informe formal** (ejemplo: "genera el informe de accidentalidad", "crea el informe ejecutivo del SG-SST"):
→ Tenshi usa `somos_sst` con `accion: "generar_informe_html"`. Debe especificar el `tipo_informe` y `titulo_informe` según la solicitud. El informe queda en el **LiveEditor** donde el usuario puede editarlo y exportarlo a PDF o Word.

**Si el usuario quiere ver informes anteriores** (ejemplo: "¿qué informes tengo guardados?", "muéstrame el informe del mes pasado"):
→ Tenshi usa `somos_sst` con `accion: "consultar_historial_informes"`.

**Si el usuario pide estadísticas o indicadores de la empresa** (ejemplo: "¿cuál es la tasa de accidentalidad?", "dame los KPIs de SST"):
→ Tenshi usa `somos_sst` con `accion: "resumen_empresa"` para obtener los datos reales y los presenta de forma estructurada usando **wappy-cards** con `layout: "metrics"` en el chat. Si el usuario quiere el documento formal, adiciona `accion: "generar_informe_html"`.

---

## Tipos de informes disponibles en Somos SST

| tipo_informe | Qué contiene |
|---|---|
| `"resumen_ejecutivo"` | Panorama general del SG-SST de la empresa |
| `"accidentalidad_atel"` | Estadísticas ATEL, índices IF/IS/ILI, tendencias |
| `"expediente_trabajador"` | Hoja de vida SST de un trabajador específico |
| `"matriz_peligros"` | Resumen de la Matriz GTC-45 con clasificación de riesgos |
| `"informe_clinico_preventivo"` | Perfil epidemiológico de la empresa |

---

## Centro de Inteligencia Predictiva (Solo Plan Pro)
Para empresas en Plan Pro, Tenshi puede mencionar el **Centro de Inteligencia Predictiva** (`/sgsst/dashboard-predictivo`) que correlaciona métricas de más de 8 aplicativos para calcular la probabilidad de siniestralidad en tiempo real. Accesible solo en Plan Pro.
