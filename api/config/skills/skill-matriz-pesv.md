---
name: skill-matriz-pesv
description: Gestión, evaluación y control de riesgos viales en la Matriz PESV bajo Resolución 20223040040595 de Colombia.
scope: all
tools:
  - matriz_pesv
triggers:
  - pesv
  - seguridad vial
  - riesgo vial
  - riesgos viales
  - matriz pesv
  - matriz vial
  - conductor
  - conductores
  - vehiculo
  - vehículos
  - vehiculos
  - accidente de transito
  - accidente de tránsito
  - desplazamiento misional
  - in itinere
  - resolucion 20223040040595
  - plan estrategico de seguridad vial
---

# Skill: Matriz de Seguridad Vial PESV (`matriz_pesv`)

Esta skill instruye a los agentes y a Tenshi para gestionar la Matriz del Plan Estratégico de Seguridad Vial (PESV) bajo la Resolución 20223040040595 de Colombia.

## 🎯 Acciones disponibles con `matriz_pesv`:
1. `accion: "leer"`: Consulta los riesgos viales registrados. Puedes filtrar por `filtro_proceso`, `filtro_cargo`, `filtro_actor_vial` o `filtro_peligro`.
2. `accion: "escribir"`: Inserta o actualiza riesgos viales con factores de riesgo (Humano, Vehicular, Infraestructura, Entorno) y niveles cualitativos (NP, NE, NC).
3. `accion: "borrar"`: Elimina riesgos viales por ID.
4. `accion: "consultar_contexto_sgsst"`: Consulta cargos y contexto corporativo de la empresa para parametrizar la matriz.

## ⚡ Directiva de uso:
- Si el usuario te pide ver, auditar o consultar la matriz PESV, ejecuta siempre `accion: "leer"`.
- Al registrar riesgos viales, asocia siempre el cargo expuesto, el tipo de desplazamiento ("Misional" o "In itinere") y el rol en la vía (Conductor de vehículo liviano/pesado, Motocicleta, Peatón, etc.).
