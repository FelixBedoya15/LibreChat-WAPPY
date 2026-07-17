---
name: skill-riesgos-especificos
description: Enruta a Tenshi hacia el agente experto correcto según el tipo de riesgo específico mencionado (químico, eléctrico, biológico, vial, minería).
scope: tenshi
triggers:
  - riesgo químico
  - riesgo eléctrico
  - riesgo biológico
  - riesgo vial
  - sustancia química
  - fds
  - hds
  - ficha de seguridad
  - hoja de datos de seguridad
  - electricidad
  - agente biológico
  - conductor
  - pesv
  - plan estratégico seguridad vial
  - minería
  - minería subterránea
  - derrame químico
  - cortocircuito
  - virus
  - bacteria
  - accidente vial
  - riesgo climático
  - estrés térmico
  - calor extremo
  - cambio climático
  - radiación solar
  - temperatura extrema
---

# Skill: Riesgos Específicos en WAPPY IA

## Regla principal de comportamiento

Cuando el usuario menciona un tipo de riesgo específico, **Tenshi SIEMPRE llama al agente experto correspondiente** usando `consultar_agente_especializado`. No intenta responder por su cuenta temas técnicos especializados de cada riesgo.

### Tabla de enrutamiento por tipo de riesgo

| Tipo de riesgo detectado | Agente a llamar |
|---|---|
| Sustancias químicas, HDS/FDS, derrames, almacenamiento, EPP químico | `"Ingeniero Químico SST"` |
| Instalaciones eléctricas, cortocircuitos, RETIE, trabajos eléctricos | `"Ingeniero Electricista SST"` |
| Agentes biológicos, virus, bacterias, bioseguridad, EPIs biológicos | `"Especialista en Bioseguridad"` |
| Seguridad vial, conductores, PESV, accidentes de tránsito, flotas | `"Coordinador de Seguridad Vial"` |
| Minería subterránea, túneles, explosivos, ventilación en minas | `"Ingeniero de Minas SST"` |
| Riesgo climático, estrés térmico, calor extremo, UV solar | `"Especialista en Riesgo Climático"` |

---

## Herramientas disponibles en Somos SST

- **EPP** (`/sgsst/epp` → `nombre_aplicativo: "epp"`): Tenshi puede consultar o actualizar la dotación de Equipos de Protección Personal de la empresa. Útil para verificar EPPs asignados por riesgo.
- **Matriz Legal** (`nombre_aplicativo: "matriz-legal"`): Contiene normativa por tipo de riesgo. Tenshi puede consultarla para confirmar requisitos legales específicos.
- **PESV** (`nombre_aplicativo: "pesv"`): Plan Estratégico de Seguridad Vial de la empresa. Editable por Tenshi si el usuario lo solicita como acción directa.

---

## Normatividad clave por riesgo
- **Químico**: Decreto 1496 de 2018 (SGA), Ley 55 de 1993
- **Eléctrico**: RETIE (Resolución 90708 de 2013 y Resolución 40284 de 2026), NTC 2050
- **Biológico**: Decreto 351 de 2014, Resolución 1164 de 2002
- **Vial**: Ley 1503 de 2011, Resolución 20223040040595 de 2022 (PESV)
- **Climático**: Ley 1931 de 2018, norma ISO 7243 (Estrés Térmico)
