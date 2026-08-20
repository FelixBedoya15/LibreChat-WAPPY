---
name: tool-matriz-pesv
description: >-
  Expert guide on using the 'matriz_pesv' tool to evaluate, document, and manage road safety risks under the Colombian PESV (Res. 20223040040595).
---

# Skill: Uso de la Herramienta Matriz PESV (`matriz_pesv`)

Esta habilidad enseña a los agentes cómo utilizar correctamente la herramienta `matriz_pesv` para gestionar el Plan Estratégico de Seguridad Vial (PESV) en Colombia conforme a la **Resolución 20223040040595 de 2022** y la **ISO 39001**.

---

## 1. Esquema de la Herramienta `matriz_pesv`

La herramienta cuenta con 4 acciones principales:
- **`consultar_contexto_sgsst`**: Lee la información de la empresa, perfiles de cargo y recomendaciones de salud vial.
- **`leer`**: Consulta los riesgos viales existentes (permite filtros por `filtro_proceso`, `filtro_actor_vial`, `filtro_peligro`).
- **`escribir`**: Registra o actualiza uno o varios riesgos viales en lote (`riesgos: [...]`).
- **`borrar`**: Elimina riesgos específicos por su ID (`ids_a_borrar: ["id1", "id2"]`).

---

## 2. Metodología de Evaluación y Cálculos

La herramienta calcula automáticamente la calificación sumando los tres niveles cualitativos:
$$\text{Calificación} = \text{NP} + \text{NE} + \text{NC} \quad (\text{Rango de 3 a 15})$$

### Tablas de Conversión Cualitativa a Cuantitativa:

1. **Nivel de Probabilidad (NP):**
   - `MUY PROBABLE` = 5
   - `MEDIANAMENTE PROBABLE` = 4
   - `PROBABLE` = 3
   - `POCO PROBABLE` = 2
   - `NO ES PROBABLE` = 1

2. **Nivel de Exposición (NE):**
   - `CONSTANTE` = 5 (Conductores misionales de jornada completa)
   - `FRECUENTE` = 4
   - `OCASIONAL` = 3
   - `ESPORADICO` = 2 (Desplazamientos in itinere cortos o peatonales)
   - `MINIMA` = 1

3. **Nivel de Consecuencia (NC):**
   - `CRITICO` = 5 (Muerte o invalidez permanente)
   - `PELIGROSO` = 4 (Lesiones graves con hospitalización)
   - `MODERADO` = 3 (Incapacidad temporal)
   - `MARGINAL` = 2 (Primeros auxilios sin incapacidad)
   - `INSIGNIFICANTE` = 1 (Daños menores)

### Interpretación del Nivel de Riesgo y Aceptabilidad:
- **Calificación $\ge$ 12:** `NIVEL DE RIESGO ALTO o CRITICO` $\rightarrow$ **NO ACEPTABLE**
- **Calificación 8 a 11:** `NIVEL DE RIESGO MEDIO o MODERADO` $\rightarrow$ **ACEPTABLE CON CONTROL ESPECIFICO**
- **Calificación $\le$ 7:** `NIVEL DE RIESGO BAJO` $\rightarrow$ **ACEPTABLE**

---

## 3. Estructura Obligatoria al Escribir Riesgos

Al invocar `accion: "escribir"`, cada objeto dentro de `riesgos` debe seguir este formato:

```json
{
  "grupo_trabajo": "OPERATIVO",
  "cargo": "Conductor de Reparto",
  "tipo_desplazamiento": "Misional",
  "rol_via": "Conductor de vehículo liviano",
  "factor_riesgo": "Factor Humano",
  "peligro_descripcion": "Exceso de velocidad y microsueños durante rutas nocturnas intermunicipales",
  "np_cualitativo": "MEDIANAMENTE PROBABLE",
  "ne_cualitativo": "FRECUENTE",
  "nc_cualitativo": "CRITICO",
  "controles_existentes_descripcion": "Capacitación anual en manejo defensivo y GPS con sensor de velocidad.",
  "controles_existentes_tipo": "MEDIO-INDIVIDUO",
  "tratamiento_accion": "MODIFICAR LOS FACTORES DE EXPOSICION",
  "plan_accion_medio": "Monitoreo telemático de excesos de velocidad en tiempo real con alertas sonoras.",
  "plan_accion_vehiculo": "Mantenimiento preventivo quincenal de frenos y llantas.",
  "plan_accion_individuo": "Protocolo estricto de pausas activas cada 2 horas y prueba de fatiga antes de iniciar ruta.",
  "plan_accion_infraestructura": "Planificación y ruteo seguro evitando vías con alto índice de siniestralidad.",
  "responsable": "Coordinador PESV / Jefe de Logística",
  "fecha_programacion": "Permanente",
  "estado": "PLANEADA",
  "observaciones": "Articular con el programa de vigilancia epidemiológica de riesgo cardiovascular y fatiga."
}
```

---

## 4. Buenas Prácticas para el Agente
1. **Paso 1:** Si no conoces la empresa, invoca primero `accion: "consultar_contexto_sgsst"`.
2. **Paso 2:** Si el usuario pide analizar un cargo específico, lee los riesgos previos con `accion: "leer", filtro_proceso: "Conductor"`.
3. **Paso 3:** Presenta siempre un análisis pedagógico y fundamentado antes de confirmar el guardado en la matriz.
