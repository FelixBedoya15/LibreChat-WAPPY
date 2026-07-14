---
name: skill-diagnostico-sgsst
description: Orienta a Tenshi para gestionar el Diagnóstico de Estándares Mínimos Resolución 0312, la Auditoría Interna SG-SST y la revisión gerencial, según el tipo de solicitud.
scope: tenshi
triggers:
  - diagnóstico
  - resolución 0312
  - decreto 1072
  - auditoría
  - estándares mínimos
  - ciclo phva
  - nivel de cumplimiento
  - auditoria interna
  - revisión gerencial
  - alta dirección
  - acpm
  - acciones correctivas
  - mejoramiento continuo
  - phva
---

# Skill: Diagnóstico y Auditoría SG-SST en WAPPY IA

## Regla principal de comportamiento

**Si el usuario pide consultar o actualizar el diagnóstico de estándares mínimos** (ejemplo: "¿cuánto tenemos en el diagnóstico 0312?", "actualiza el ítem de capacitaciones del diagnóstico"):
→ Tenshi usa `somos_sst` con `accion: "editar_cualquier_aplicativo"` con `nombre_aplicativo: "diagnostico"`.

**Si el usuario pide realizar o consultar la auditoría interna** (ejemplo: "¿cómo vamos en la auditoría?", "registra los hallazgos de la auditoría"):
→ Tenshi usa `somos_sst` con `nombre_aplicativo: "auditoria"`.

**Si el usuario pregunta cómo hacer el diagnóstico, auditoría o revisión gerencial** (ejemplo: "¿cómo hago el diagnóstico de la resolución 0312?"):
→ Tenshi **llama al Auditor Integral SG-SST** con `consultar_agente_especializado` con `nombre_especialista: "Auditor Integral SG-SST"` Y explica la ruta en Somos SST.

**Para el Centro de Control ACPM** (ejemplo: "crea una actividad de mejora", "¿qué actividades tengo pendientes en ACPM?"):
→ Tenshi usa `somos_sst` con `accion: "consultar_centro_control_acpm"` o `accion: "crear_actividad_acpm"`.

---

## Herramientas disponibles en Somos SST (Hito 04: Alerta Temprana)

- **Diagnóstico Inicial Res. 0312** (`/sgsst/diagnostico`): Autoevaluación de Estándares Mínimos. Filtros por tamaño de empresa y nivel de riesgo. Calificación ítem por ítem: Cumple / No Cumple / Parcial / No Aplica. Cálculo automático de puntaje y porcentaje de cumplimiento. Historial de diagnósticos guardados.

- **Auditoría Interna SG-SST** (`/sgsst/auditoria`): Checklist de auditoría interna. Calificación de hallazgos. Plan de acción automático por hallazgos. Generación del informe de auditoría con IA.

- **Alta Dirección / Revisión Gerencial** (`/sgsst/alta-direccion`): Formulario de revisión gerencial. Firma digital del gerente desde un enlace externo.

- **Centro de Control ACPM** (`/sgsst/acpm`): Tablero de Acciones Correctivas, Preventivas y de Mejora. Tenshi puede crear y actualizar actividades directamente.

---

## Normatividad clave
- Resolución 0312 de 2019 (Estándares Mínimos SG-SST)
- Decreto 1072 de 2015 (Ciclo PHVA del SG-SST)
