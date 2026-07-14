---
name: skill-gestion-ipevar
description: Guía a Tenshi para manejar la Matriz de Peligros GTC-45 e IPEVAR, delegando al especialista para análisis técnico o editando el módulo directamente según el tipo de solicitud.
triggers:
  - ipevar
  - matriz de peligros
  - peligro
  - riesgo
  - gtc45
  - gtc-45
  - valoración de riesgos
  - identificación de peligros
  - controles
  - intervención de riesgos
  - nivel de riesgo
  - nivel de deficiencia
  - aceptabilidad del riesgo
  - matriz de riesgos
---

# Skill: Gestión IPEVAR y Matriz GTC-45 en WAPPY IA

## Regla principal de comportamiento

**Si el usuario pide análisis técnico, orientación sobre la metodología o construcción de la matriz con IA** (ejemplo: "¿cómo hago la matriz GTC-45?", "ayúdame a identificar peligros en mi empresa"):
→ Tenshi indica que debe ir al **Chat Principal** y seleccionar el agente **"Especialista GTC-45 (Matriz IPEVAR)"**, que puede generar filas completas de la matriz directamente en el chat y exportarla a Excel, Word y PDF.

**Si el usuario pide consultar, actualizar o editar la matriz existente de su empresa** (ejemplo: "muéstrame los peligros registrados", "actualiza el control de este riesgo"):
→ Tenshi usa `somos_sst` con `accion: "editar_cualquier_aplicativo"` con `nombre_aplicativo: "gtc45"` o `"ipevar"`.

---

## Herramientas disponibles en WAPPY IA

### En Somos SST (Hito 02: Interacción Fisiológica y Entorno)
- **Matriz IPEVAR GTC-45** (`/sgsst/matriz-peligros`): La matriz de identificación, evaluación y valoración de riesgos más completa.
  - Campos: proceso, actividad, tarea, peligro, efectos, controles existentes, ND/NE/NC/NP/NR
  - Dashboard visual con gráficas de calor y tortas de distribución
  - Llenado asistido por IA disponible directamente en el módulo
  - Exportación a Excel, Word y PDF
  - Historial de versiones de la matriz

- **Participación IPEVAR (formulario público)**: Los trabajadores pueden identificar peligros desde su celular sin cuenta, por un enlace público. Esto nutre automáticamente la matriz.

### En el Chat Principal — Agente Especializado
- **Agente IPEVAR integrado**: Genera, analiza y edita la Matriz GTC-45 directamente desde el chat con llenado inteligente por IA.

---

## Normatividad clave
- GTC-45 (Guía Técnica Colombiana para Identificación de Peligros y Valoración de Riesgos)
- Resolución 0312 de 2019 (Estándares Mínimos)
- Decreto 1072 de 2015
