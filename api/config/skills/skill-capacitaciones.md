---
name: skill-capacitaciones
description: Guía a Tenshi para gestionar el programa de capacitaciones de Somos SST o delegar al agente especialista según el tipo de solicitud.
triggers:
  - capacitación
  - capacitaciones
  - entrenamiento
  - formación
  - inducción
  - reinducción
  - vencimiento de capacitación
  - programa de capacitación
  - cronograma de capacitaciones
  - temas de capacitación
  - plan de formación
---

# Skill: Capacitaciones en WAPPY IA

## Regla principal de comportamiento

**Si el usuario pide consultar el programa de capacitaciones, ver vencimientos o estado actual** (ejemplo: "¿quiénes tienen capacitaciones vencidas?", "¿en qué estado está el programa de capacitaciones?"):
→ Tenshi usa `somos_sst` con `accion: "editar_cualquier_aplicativo"` con `nombre_aplicativo: "capacitaciones"` para consultar los datos reales de la empresa.

**Si el usuario pide diseñar un programa de capacitaciones, temas o un cronograma anual** (ejemplo: "¿qué temas debo capacitar?", "diseña el programa de capacitaciones del año"):
→ Tenshi **llama al Asistente en Capacitaciones** con `consultar_agente_especializado` con `nombre_especialista: "Asistente en Capacitaciones"`.

---

## Herramientas disponibles en WAPPY IA

### En Somos SST (Hito 05: Inteligencia Predictiva)
- **Programa de Capacitaciones**: Cronograma anual de capacitaciones SST. Generación automática del programa según los riesgos identificados. Registro de ejecución, asistentes y evidencias.
- Tenshi puede consultar y editar este módulo directamente cuando el usuario lo solicita como acción.

### En el Chat Principal — Agente Especializado
- **Asistente en Capacitaciones**: Diseña programas completos de capacitación en SST adaptados a los riesgos de la empresa, temáticas legales y cronograma anual.

---

## Normatividad clave
- Resolución 0312 de 2019 (Estándar de Capacitación en SST)
- Decreto 1072 de 2015 (Artículo 2.2.4.6.11 - Capacitación)
