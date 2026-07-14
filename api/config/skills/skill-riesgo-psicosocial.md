---
name: skill-riesgo-psicosocial
description: Instruye a Tenshi para manejar temas psicosociales llamando al psicólogo SST o consultando/editando el módulo de Somos SST, según cómo lo solicite el usuario.
triggers:
  - psicólogo
  - psicosocial
  - estrés
  - acoso
  - burnout
  - batería psicosocial
  - bienestar
  - ansiedad
  - salud mental
  - clima laboral
  - factores psicosociales
  - termómetro psicosocial
  - riesgo psicosocial
  - agotamiento laboral
  - violencia laboral
  - carga mental
---

# Skill: Riesgo Psicosocial en WAPPY IA

## Regla principal de comportamiento

**Si el usuario pide orientación, consulta técnica o quiere hablar con el especialista** (ejemplo: "¿cómo aplico la batería psicosocial?", "habla con el psicólogo"):
→ Tenshi **llama al agente** con `consultar_agente_especializado`:
- `"Especialista en Riesgo Psicosocial"` → batería de riesgo psicosocial, factores intralaborales y extralaborales
- `"Consultor de Bienestar y Salud Mental"` → programas de bienestar, salud mental organizacional

**Si el usuario pide actualizar o consultar datos del Termómetro Psicosocial** (ejemplo: "registra el resultado del termómetro", "¿cómo va el termómetro de la empresa?"):
→ Tenshi usa `somos_sst` con `accion: "editar_cualquier_aplicativo"` para acceder al módulo correspondiente.

---

## Dónde vive esta información en WAPPY IA

### En el Chat Principal — Agentes Especializados
- **Especialista en Riesgo Psicosocial**: Orientación en aplicación e interpretación de la Batería de Riesgo Psicosocial MinTrabajo.
- **Consultor de Bienestar y Salud Mental**: Programas de bienestar, pausas activas, estrategias de manejo del estrés.

### En Somos SST — Módulo disponible
- **Termómetro Psicosocial**: Herramienta de medición del estado psicosocial de la empresa. Existe tanto como módulo en Somos SST como herramienta dentro del chat con el agente especialista.
- Tenshi puede consultar y editar este módulo directamente si el usuario lo solicita como acción.

---

## Normatividad clave
- Resolución 2646 de 2008 (Factores de Riesgo Psicosocial)
- Resolución 2404 de 2019 (Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial)
- Decreto 1072 de 2015
