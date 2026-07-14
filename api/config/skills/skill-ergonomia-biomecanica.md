---
name: skill-ergonomia-biomecanica
description: Orienta a Tenshi sobre cómo manejar solicitudes ergonómicas y biomecánicas usando Somos SST o delegando al agente especialista, dependiendo de si el usuario pide instrucciones o acción directa.
scope: tenshi
triggers:
  - ergonomía
  - ergonómico
  - postura
  - fisioterapeuta
  - biomecánica
  - método rosa
  - rosa
  - owas
  - lesión
  - túnel carpiano
  - lumbalgia
  - carga postural
  - dolor de espalda
  - posición de trabajo
  - trabajo repetitivo
  - desórdenes musculoesqueléticos
---

# Skill: Ergonomía y Biomecánica en WAPPY IA

## Regla principal de comportamiento

**Si el usuario pide que Tenshi realice, actualice o consulte datos ergonómicos** (ejemplo: "actualiza el OWAS de Juan", "muéstrame los resultados de ergonomía"):
→ Tenshi usa `somos_sst` con `accion: "editar_cualquier_aplicativo"` usando `nombre_aplicativo: "owas"` o según corresponda.

**Si el usuario pregunta cómo hacer una evaluación ergonómica o necesita orientación técnica** (ejemplo: "¿cómo aplico el método ROSA?", "¿qué evalúa el OWAS?"):
→ Tenshi **indica la ruta en WAPPY IA** y puede **llamar al especialista** con `consultar_agente_especializado`:
- `"Especialista en Biomecánica Laboral"` → para lesiones musculoesqueléticas, reincorporación, fisioterapia ocupacional
- `"Analista Ergonómico ROSA"` → para evaluación específica de puestos de trabajo con el método ROSA

---

## Herramientas disponibles en WAPPY IA

### En Somos SST (Hito 02: Interacción Fisiológica y Entorno)
- **Método OWAS**: Evaluación ergonómica de posturas de trabajo. Categorización automática de riesgo postural (niveles 1-4). Accesible en Somos SST, editable por Tenshi.
- **Perfil Sociodemográfico** (`/sgsst/perfiles-sociodemograficos`): Contiene datos de condiciones de salud que pueden correlacionarse con riesgos ergonómicos.

### En el Chat Principal — Agentes Especializados
- **Especialista en Biomecánica Laboral**: Fisioterapeuta ocupacional. Analiza lesiones, adaptación de puesto, recomendaciones de rehabilitación.
- **Analista Ergonómico ROSA**: Aplica metodología ROSA para evaluación de puestos de trabajo con pantallas, sillas, teclados y mouse.

---

## Normatividad clave
- GTC-45 (Identificación de Peligros Biomecánicos)
- Resolución 2844 de 2007 (Guías de Atención Integral GATISO)
- Decreto 1072 de 2015
