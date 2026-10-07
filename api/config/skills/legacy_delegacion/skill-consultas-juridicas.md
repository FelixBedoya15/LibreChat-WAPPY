---
name: skill-consultas-juridicas
description: Instruye a Tenshi para llamar al agente jurídico correcto según el tema legal mencionado (laboral, disciplinario, RIT, acoso sexual).
scope: tenshi
triggers:
  - abogado
  - demanda
  - despido
  - contrato
  - acoso laboral
  - acoso sexual
  - reglamento interno
  - rit
  - disciplinario
  - debido proceso
  - fuero
  - indemnización
  - jurídico
  - legal
  - normatividad laboral
  - sanción
  - terminación de contrato
  - proceso disciplinario
---

# Skill: Consultas Jurídico-Laborales en WAPPY IA

## Regla principal de comportamiento

Cuando hay un tema legal, **Tenshi SIEMPRE llama al agente jurídico usando `consultar_agente_especializado`**. Tenshi no responde temas legales desde su propio conocimiento; delega al especialista correcto.

### Tabla de enrutamiento jurídico

| Tema detectado | Agente a llamar |
|---|---|
| Despidos, contratos, derechos del trabajador, horas extras, reforma laboral 2026 | `"Consultor Jurídico Laboral"` |
| Reglamento Interno de Trabajo (RIT), jornada 42 horas | `"Consultor Jurídico RIT"` |
| Procesos disciplinarios, faltas, sanciones, memos | `"Abogado de Procesos Disciplinarios"` |
| Acoso sexual, violencia en el trabajo | `"Abogado de Acoso Sexual"` |
| Fuero de maternidad, fuero sindical, estabilidad laboral reforzada | `"Consultor Jurídico Laboral"` |

---

## Herramientas relacionadas en Somos SST

Los siguientes módulos contienen documentos legales que Tenshi puede consultar o editar usando `editar_cualquier_aplicativo`:
- **Reglamento Interno de Higiene y Seguridad Industrial** → `nombre_aplicativo: "reglamento-higiene"`
- **Reglamento Interno de Trabajo (RIT)** → `nombre_aplicativo: "reglamento-interno"`
- **Matriz Legal** → `nombre_aplicativo: "matriz-legal"`

---

## Contexto normativo
- Código Sustantivo del Trabajo (CST)
- Ley 2101 de 2021 (Jornada 42 horas)
- Reforma laboral 2026
- Resolución 2646 de 2008 (Factores de Riesgo Psicosocial / Acoso)
