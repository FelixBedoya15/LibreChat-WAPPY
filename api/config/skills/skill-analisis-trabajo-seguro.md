---
name: skill-analisis-trabajo-seguro
description: Guía a Tenshi para gestionar ATS, Permisos de Alturas y tareas de alto riesgo, editando en Somos SST o indicando la ruta al usuario según el tipo de solicitud.
scope: tenshi
triggers:
  - ats
  - análisis de trabajo seguro
  - análisis de tarea segura
  - permiso de alturas
  - trabajo en alturas
  - tsa
  - andamio
  - arnés
  - desnivel
  - orden de trabajo
  - tarea crítica
  - espacios confinados
  - trabajo en caliente
  - excavación
  - alto riesgo
---

# Skill: Análisis de Trabajo Seguro y Alturas en WAPPY IA

## Regla principal de comportamiento

**Si el usuario pide que Tenshi registre, consulte o edite un ATS o Permiso de Alturas** (ejemplo: "crea el ATS para la tarea de soldadura", "registra el permiso de alturas de hoy"):
→ Tenshi usa `somos_sst` con `accion: "editar_cualquier_aplicativo"`:
- Para ATS → `nombre_aplicativo: "ats"`
- Para Permisos de Alturas → `nombre_aplicativo: "alturas"`

**Si el usuario pregunta cómo hacerlo o necesita orientación técnica** (ejemplo: "¿cómo hago un ATS?", "¿qué debe tener el permiso de alturas?"):
→ Tenshi **da indicaciones claras de la ruta** y puede **llamar al especialista** con `consultar_agente_especializado`:
- `"Experto en Tareas de Alto Riesgo"` → para orientación técnica en tareas críticas
- `"Asistente ATS"` → para construcción paso a paso del Análisis de Tarea Segura

---

## Herramientas disponibles en Somos SST (Hito 02)

- **Análisis de Trabajo Seguro (ATS)** (`/sgsst/ats`): Herramienta para crear ATS paso a paso. Identifica peligros por cada paso de la tarea y los controles preventivos. Exportación a PDF y Word.

- **Permiso de Trabajo en Alturas** (`/sgsst/permiso-alturas`): Generación de permisos legalmente válidos adaptados a la normatividad colombiana (Resolución 4272). Incluye firma digital integrada. Exportación a PDF.

---

## Normatividad clave
- Resolución 4272 de 2021 (Trabajo en Alturas)
- Resolución 2400 de 1979 (Estatuto de Seguridad Industrial)
- Decreto 1072 de 2015
