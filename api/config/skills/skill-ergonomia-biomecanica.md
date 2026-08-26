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
- `"Fisioterapeuta Laboral"` → para lesiones musculoesqueléticas, reincorporación, fisioterapia ocupacional, evaluación ergonómica ROSA/OWAS

**Si el usuario pide el análisis en vivo con cámara o con exoesqueleto luminoso:**
→ Indicar al usuario que acceda a **Análisis en Vivo** → seleccionar el modo **"Biomécanico (Visión IA)"** para la telemetría articular con exoesqueleto luminoso en tiempo real.

---

## Herramientas disponibles en WAPPY IA

### En Somos SST (Integración Integral de Hitos & Motor Predictivo)
- **Hito 1 (Huella Biocéntrica)**: Cruza el `fitScore` y las patologías previas del Perfil Sociodemográfico con las exigencias del puesto.
- **Hito 2 (Matriz Bio-IPEVAR - Dominio Osteomuscular)**: Evalúa la interacción postural y clasifica las intervenciones bajo la **Metodología Causal ATENEA (Matriz 8M)** diferenciando:
  - **Causas Suficientes:** Modificaciones en el origen/ingeniería (altura de descarga, ayuda mecánica) que eliminan el daño.
  - **Causas Coadyuvantes:** Pausas activas, higiene postural y acondicionamiento físico.
- **Diagrama de Árbol ("¿Cómo? ¿Cómo?"):** El especialista estructura las recomendaciones de derecha a izquierda por Jerarquía de Controles.
- **Método OWAS**: Evaluación ergonómica de posturas de trabajo. Categorización automática de riesgo postural (niveles 1-4).
- **Hito 4 & 5 (Severidad y Predicción ML):** Cálculo de severidad con **Días Cargados (base 6.000 días PCL)** y balance de **Costos Tangibles e Intangibles** para la Alta Dirección.

### En el Chat Principal — Agentes Especializados
- **Fisioterapeuta Laboral**: Fisioterapeuta ocupacional. Analiza lesiones, adaptación de puesto, recomendaciones de rehabilitación, evaluaciones ergonómicas ROSA y OWAS, aplicando la causalidad ATENEA y el Diagrama de Árbol.

### Análisis en Vivo con Cámara (Exoesqueleto Luminoso)
- **Modo Biomécanico Cualitativo** (`Riesgo Biomécanico`): Revisión visual de posturas, cargas y movimientos repetitivos.
- **Modo Biomécanico con Visión IA** (`Biomécanico (Visión IA)`): Telemetría articular en tiempo real con exoesqueleto luminoso. Mide ángulos de cuello, espalda y brazos según criterios RULA/REBA. Acceder desde: Chat → Botón **Análisis en Vivo** → Modo **Biomécanico (Visión IA)**.

---

## Normatividad & Metodología Clave
- GTC-45 (Identificación de Peligros Biomecánicos)
- Resolución 2844 de 2007 (Guías de Atención Integral GATISO)
- Decreto 1072 de 2015
- Metodología Causal ATENEA (Matriz 8M) & Modelos Predictivos Machine Learning (Random Forest & XGBoost)
