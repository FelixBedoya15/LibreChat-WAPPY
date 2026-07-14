---
name: skill-consultas-medicas
description: Guía a Tenshi para manejar consultas médico-laborales, activando el Consultor Médico Ocupacional o gestionando exámenes médicos en Somos SST según el tipo de solicitud.
scope: tenshi
triggers:
  - médico
  - médico laboral
  - doctor
  - examen médico
  - exámenes médicos
  - aptitud
  - vencimiento
  - restricción médica
  - apto
  - no apto
  - concepto médico
  - hable con el médico
  - incapacidad
  - profesiograma
  - salud ocupacional
  - reincorporación
---

# Skill: Consultas Médico-Laborales en WAPPY IA

## Regla principal de comportamiento

**Si el usuario pregunta por información médica, conceptos, normatividad o necesita orientación clínica laboral** (ejemplo: "¿qué dice la resolución 2346 sobre exámenes?", "¿cómo se maneja una incapacidad?"):
→ Tenshi **llama al Consultor Médico Ocupacional** usando `consultar_agente_especializado` con `nombre_especialista: "Consultor Médico Ocupacional"`.

**Si el usuario pide consultar los exámenes médicos de la empresa o de un trabajador** (ejemplo: "¿quiénes tienen el examen vencido?", "muéstrame el concepto médico de Juan"):
→ Tenshi usa `somos_sst` con `accion: "consultar_expediente_integral"` o `accion: "listar_trabajadores"` para obtener la información real de la base de datos.

**Si el usuario pide actualizar o registrar un examen médico** (ejemplo: "actualiza el examen de María", "registra que Pedro ya hizo su examen"):
→ Tenshi usa `somos_sst` con `accion: "actualizar_examen_medico"`.

---

## Dónde vive esta información en WAPPY IA

### En Somos SST — Motor Bio-Individual (Bio Motor)
- **Exámenes Médicos y Restricciones**: Seguimiento al concepto médico ocupacional, fecha de vencimiento, diagnósticos y restricciones físicas o laborales del personal.
- Ruta de acceso manual: `/sgsst` → Módulo Bio Motor → Exámenes Médicos
- Tenshi puede consultar y editar este módulo directamente.

### En el Chat Principal — Agente Especializado
- El agente **Consultor Médico Ocupacional** está disponible en el catálogo de agentes del Chat Principal.
- Especializado en: calificación de origen, pérdida de capacidad laboral, reincorporación, profesiogramas, ausentismo.
- El agente maneja la normativa: Resolución 2346 de 2007, Resolución 3050 de 2022, Decreto 1072 de 2015, Ley 1562 de 2012, Manual de Calificación Decreto 1507.

---

## Normatividad clave
- Resolución 2346 de 2007 (Exámenes Médicos Ocupacionales)
- Resolución 3050 de 2022
- Decreto 1072 de 2015
- Ley 1562 de 2012
