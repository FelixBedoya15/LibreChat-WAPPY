---
name: wappy-sgsst-tools
description: "Guía técnica de herramientas operativas SG-SST en WAPPY: Matriz PESV (Res. 20223040040595), Compatibilidad Química (SGA Decreto 1496) y Gestor de Automatizaciones (/tareas)."
category: backend-and-domain
bundle: wappy-platform-and-sgsst
risk: safe
source: self
source_type: self
date_added: "2026-10-28"
author: wappy-ia
agents: [wappy-backend-api, wappy-frontend-ui]
tags: [sgsst, pesv, quimicos, sga, automatizaciones, mcp, matrices]
---

# Herramientas Operativas SG-SST (`wappy-sgsst-tools`)

## Overview

Documentación técnica de los esquemas de datos, fórmulas de calificación y reglas normativas para las herramientas operativas SG-SST en **LibreChat-WAPPY**: **Matriz PESV** (`matriz_pesv`), **Matriz de Compatibilidad Química** (`matriz_compatibilidad`) y **Gestor de Tareas/Automatizaciones** (`gestor_automatizaciones`).

## When to Use

- **Usar cuando** se programen, auditen, depuren o ejecuten herramientas de matrices SST, riesgos viales PESV, inventario/compatibilidad de productos químicos SGA o automatizaciones programadas (`/tareas`).

## Prerequisites

- Contexto de empresa activa en SG-SST (`consultar_contexto_sgsst` / `wappy_consultar_perfil_empresa`).
- Para `/tareas`: cuenta con rol Administrador o plan Wappy Pro (`canAccessTareas` en `client/src/utils/planAccess.ts` y `api/server/routes/sgsst/automatizaciones.js`).

---

## How It Works

### 1. Herramienta Matriz PESV (`matriz_pesv` — Res. 20223040040595 / ISO 39001)

#### Acciones:
- `consultar_contexto_sgsst`, `leer` (`filtro_proceso`, `filtro_actor_vial`, `filtro_peligro`), `escribir` (`riesgos: [...]`), `borrar` (`ids_a_borrar`).

#### Cálculo Automático de Calificación:
$$\text{Calificación} = \text{NP} + \text{NE} + \text{NC} \quad (\text{Rango de 3 a 15})$$
- **NP (Probabilidad):** `MUY PROBABLE` (5), `MEDIANAMENTE PROBABLE` (4), `PROBABLE` (3), `POCO PROBABLE` (2), `NO ES PROBABLE` (1).
- **NE (Exposición):** `CONSTANTE` (5), `FRECUENTE` (4), `OCASIONAL` (3), `ESPORADICO` (2), `MINIMA` (1).
- **NC (Consecuencia):** `CRITICO` (5), `PELIGROSO` (4), `MODERADO` (3), `MARGINAL` (2), `INSIGNIFICANTE` (1).
- **Aceptabilidad:** $\ge 12$ Alto/Crítico (*NO ACEPTABLE*), $8\text{–}11$ Medio (*ACEPTABLE CON CONTROL ESPECÍFICO*), $\le 7$ Bajo (*ACEPTABLE*).

#### Estructura de objeto en `riesgos`:
`grupo_trabajo`, `cargo`, `tipo_desplazamiento`, `rol_via`, `factor_riesgo`, `peligro_descripcion`, `np_cualitativo`, `ne_cualitativo`, `nc_cualitativo`, `controles_existentes_descripcion`, `controles_existentes_tipo`, `tratamiento_accion`, `plan_accion_medio`, `plan_accion_vehiculo`, `plan_accion_individuo`, `plan_accion_infraestructura`, `responsable`, `fecha_programacion`, `estado`, `observaciones`.

---

### 2. Herramienta Matriz de Compatibilidad Química (`matriz_compatibilidad` — Decreto 1496 SGA / NTC 1692)

#### Acciones:
- `consultar_contexto_sgsst`, `leer` (`filtro_nombre`, `filtro_ubicacion`, `filtro_clase`), `escribir` (`productos: [...]`), `borrar` (`ids_a_borrar`).

#### Clases ONU y Pictogramas SGA:
- **Clases ONU:** `Clase 1` Explosivos, `Clase 2` Gases, `Clase 3` Líquidos Inflamables, `Clase 4` Sólidos Inflamables, `Clase 5` Comburentes/Peróxidos, `Clase 6` Tóxicos/Infecciosos, `Clase 7` Radiactivos, `Clase 8` Corrosivos (Ácidos/Bases), `Clase 9` Peligrosos Varios.
- **Pictogramas SGA válidos:** `["inflamable", "corrosivo", "toxico", "nocivo", "explosivo", "comburente", "gas_presion", "peligro_salud", "medio_ambiente"]`.
- **Reglas Críticas:** Nunca almacenar Ácidos y Bases juntos (Clase 8 vs 8); separar Inflamables (Clase 3) de Comburentes (Clase 5); FDS de 16 secciones obligatoria.

#### Estructura de objeto en `productos`:
`nombre`, `fabricante`, `estado_fisico`, `clasificacion_onu`, `pictogramas_sga`, `cantidad_almacenada`, `ubicacion`, `tiene_fds`, `tiene_rotulo`, `incompatibilidades`, `requisitos_almacenamiento`.

---

### 3. Herramienta Gestor de Tareas y Automatizaciones (`gestor_automatizaciones`)

- **Ruta en UI:** `/tareas` (historial en `/tareas?tab=historial`). Acceso exclusivo para Administradores y cuentas Wappy Pro (`canAccessTareas` en `client/src/utils/planAccess.ts` y `api/server/routes/sgsst/automatizaciones.js`).
- **Acciones:** `crear`, `listar`, `actualizar` (`active`/`inactive`), `ejecutar_ahora`, `eliminar`, `ver_logs`.

---

## Verification

- Validar con `node -c <archivo.js>` cualquier cambio en rutas o controladores de `api/server/routes/sgsst/`.
- Verificar que la suma $\text{NP} + \text{NE} + \text{NC}$ y los niveles de aceptabilidad PESV coincidan con los umbrales ($\ge 12$, $8\text{–}11$, $\le 7$).

## Safety and Side Effects

- **Risk level:** `safe` — Las acciones `borrar` o `eliminar` sobre riesgos, productos químicos o automatizaciones modifican datos de la empresa activa; confirmar IDs antes de borrar.

## Sources and Related Skills

- [`wappy-ui-design-system`](../wappy-ui-design-system/SKILL.md)
- [`wappy-google-connectors`](../wappy-google-connectors/SKILL.md)
