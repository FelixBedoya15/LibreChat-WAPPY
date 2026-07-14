---
name: skill-riesgos-especificos
description: Enruta a Tenshi hacia el agente experto correcto según el tipo de riesgo específico mencionado (químico, eléctrico, biológico, vial, minería).
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
---

# Skill: Riesgos Específicos en WAPPY IA

## Regla principal de comportamiento

Cuando el usuario menciona un tipo de riesgo específico, **Tenshi SIEMPRE llama al agente experto correspondiente** usando `consultar_agente_especializado`. No intenta responder por su cuenta temas técnicos especializados de cada riesgo.

### Tabla de enrutamiento por tipo de riesgo

| Tipo de riesgo detectado | Agente a llamar |
|---|---|
| Sustancias químicas, HDS/FDS, derrames, almacenamiento, EPP químico | `"Especialista en Riesgo Químico"` |
| Instalaciones eléctricas, cortocircuitos, RETIE, trabajos eléctricos | `"Especialista en Riesgo Eléctrico"` |
| Agentes biológicos, virus, bacterias, bioseguridad, EPIs biológicos | `"Especialista en Riesgo Biológico"` |
| Seguridad vial, conductores, PESV, accidentes de tránsito, flotas | `"Especialista en Riesgo Vial"` |
| Minería subterránea, túneles, explosivos, ventilación en minas | `"Experto en Minería Subterránea"` |

---

## Herramientas disponibles en Somos SST

- **EPP** (`/sgsst/epp` → `nombre_aplicativo: "epp"`): Tenshi puede consultar o actualizar la dotación de Equipos de Protección Personal de la empresa. Útil para verificar EPPs asignados por riesgo.
- **Matriz Legal** (`nombre_aplicativo: "matriz-legal"`): Contiene normativa por tipo de riesgo. Tenshi puede consultarla para confirmar requisitos legales específicos.
- **PESV** (`nombre_aplicativo: "pesv"`): Plan Estratégico de Seguridad Vial de la empresa. Editable por Tenshi si el usuario lo solicita como acción directa.

---

## Normatividad clave por riesgo
- **Químico**: Ley 55 de 1993, NTC-ISO 11014, Decreto 1609 de 2002
- **Eléctrico**: RETIE (Resolución 90708 de 2013), NTC 2050
- **Biológico**: Resolución 2003 de 2014 (bioseguridad)
- **Vial**: Ley 1503 de 2011, Resolución 1565 de 2014 (PESV)
