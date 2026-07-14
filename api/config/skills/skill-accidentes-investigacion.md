---
name: skill-accidentes-investigacion
description: Guía a Tenshi para registrar accidentes/incidentes en ATEL o dar instrucciones de cómo investigar un accidente usando el ecosistema WAPPY IA.
triggers:
  - accidente
  - incidente
  - atel
  - investigación de accidente
  - reporte de accidente
  - siniestro
  - casi accidente
  - días de incapacidad
  - enfermedad laboral
  - árbol de causas
  - furat
  - furel
  - accidentalidad
  - tasa de accidentalidad
  - índice de frecuencia
  - índice de severidad
---

# Skill: Accidentes, ATEL e Investigación en WAPPY IA

## Regla principal de comportamiento

**Si el usuario pide registrar o reportar un accidente/incidente** (ejemplo: "registra el accidente de Pedro", "hubo un accidente hoy"):
→ Tenshi usa `somos_sst` con `accion: "registrar_accidente_atel"`.

**Si el usuario pregunta cómo investigar un accidente o necesita apoyo técnico** (ejemplo: "¿cómo investigo el accidente?", "¿qué es el árbol de causas?"):
→ Tenshi **llama al Asistente de Investigación ATEL** usando `consultar_agente_especializado` con `nombre_especialista: "Asistente de Investigación de AT"`.

**Si el usuario pide estadísticas o indicadores de accidentalidad** (ejemplo: "¿cuál es el índice de frecuencia?", "muéstrame las estadísticas ATEL"):
→ Tenshi usa `somos_sst` con `accion: "resumen_empresa"` para obtener datos reales y luego `accion: "generar_informe_html"` si se requiere el reporte formal.

---

## Dónde vive esta información en WAPPY IA

### En Somos SST — Motor Bio-Individual (Hito 04: Alerta Temprana)
- **Investigación ATEL** (`/sgsst/investigacion-atel`): Registro de siniestros, árbol de causas, cálculo de índices IF/IS e informe estadístico. Compatible con FURAT/FUREL.
- **Estadísticas ATEL** (`/sgsst/estadisticas-atel`): Dashboard con Tasa de Accidentalidad (TA), Índice de Frecuencia (IF), Índice de Severidad (IS), Índice de Lesión Incapacitante (ILI).
- Tenshi puede registrar y consultar accidentes directamente desde su widget.

### Funciones especiales del módulo ATEL
- Testimonio público: el trabajador accidentado puede dar su versión por un enlace público (sin necesidad de cuenta).
- Seguimiento al cierre de acciones correctivas.

---

## Normatividad clave
- Resolución 1401 de 2007 (Investigación de AT)
- Decreto 1072 de 2015
- Ley 1562 de 2012
