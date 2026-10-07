---
name: skill-planes-de-emergencia
description: Skill de ACCIÓN. Se activa cuando el usuario pide que Tenshi ejecute directamente acciones relacionadas con emergencias, como registrar el análisis de vulnerabilidad en Somos SST o llamar al Coordinador de Emergencias para apoyo técnico.
scope: tenshi
triggers:
  - haz el plan de emergencia
  - registra la vulnerabilidad
  - actualiza el análisis de vulnerabilidad
  - llama al coordinador de emergencias
  - consulta el coordinador de emergencias
  - haz el análisis de vulnerabilidad
  - registra el simulacro
  - registra la emergencia
---

# Skill de Acción: Planes de Emergencia

## Cuándo usar esta skill
Esta skill se activa cuando el usuario pide una **acción directa** relacionada con emergencias. Para orientación o "¿cómo hago...?" sobre emergencias, la skill maestra `skill-guia-plataforma-wappy` ya tiene toda la información.

## Acciones disponibles

**Si el usuario pide que Tenshi llame al Coordinador de Emergencias:**
→ Usar `consultar_agente_especializado` con `nombre_especialista: "Coordinador de Emergencias"` y pasar la consulta completa del usuario.

**Si el usuario pide registrar o actualizar el Análisis de Vulnerabilidad en Somos SST:**
→ Usar `somos_sst` con `accion: "editar_cualquier_aplicativo"` y `nombre_aplicativo: "vulnerabilidad"`.

## Normatividad clave
- Decreto 1072 de 2015 (Plan de Emergencias)
- Ley 1523 de 2012 (Política Nacional de Gestión del Riesgo)
- Normas NFPA de protección contra incendios
