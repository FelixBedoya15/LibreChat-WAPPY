---
name: wappy-sgsst-tools
description: >-
  Guía maestra de las herramientas operativas SG-SST en LibreChat-WAPPY: Matriz PESV (Res. 20223040040595), Matriz de Compatibilidad Química (SGA Decreto 1496 / ONU) y Gestor de Tareas/Automatizaciones (`/tareas`). Úsala cuando se programen, auditen o ejecuten herramientas de matrices SST, riesgos viales, inventario químico o automatizaciones.
---

# Herramientas Operativas SG-SST (`matriz_pesv`, `matriz_compatibilidad`, `gestor_automatizaciones`)

---

## 1. Herramienta Matriz PESV (`matriz_pesv` — Res. 20223040040595 / ISO 39001)

### Acciones:
- `consultar_contexto_sgsst`, `leer` (`filtro_proceso`, `filtro_actor_vial`, `filtro_peligro`), `escribir` (`riesgos: [...]`), `borrar` (`ids_a_borrar`).

### Cálculo Automático de Calificación:
$$\text{Calificación} = \text{NP} + \text{NE} + \text{NC} \quad (\text{Rango de 3 a 15})$$
- **NP (Probabilidad):** `MUY PROBABLE` (5), `MEDIANAMENTE PROBABLE` (4), `PROBABLE` (3), `POCO PROBABLE` (2), `NO ES PROBABLE` (1).
- **NE (Exposición):** `CONSTANTE` (5), `FRECUENTE` (4), `OCASIONAL` (3), `ESPORADICO` (2), `MINIMA` (1).
- **NC (Consecuencia):** `CRITICO` (5), `PELIGROSO` (4), `MODERADO` (3), `MARGINAL` (2), `INSIGNIFICANTE` (1).
- **Aceptabilidad:** $\ge 12$ Alto/Crítico (*NO ACEPTABLE*), $8\text{–}11$ Medio (*ACEPTABLE CON CONTROL ESPECÍFICO*), $\le 7$ Bajo (*ACEPTABLE*).

### Estructura de objeto en `riesgos`:
`grupo_trabajo`, `cargo`, `tipo_desplazamiento`, `rol_via`, `factor_riesgo`, `peligro_descripcion`, `np_cualitativo`, `ne_cualitativo`, `nc_cualitativo`, `controles_existentes_descripcion`, `controles_existentes_tipo`, `tratamiento_accion`, `plan_accion_medio`, `plan_accion_vehiculo`, `plan_accion_individuo`, `plan_accion_infraestructura`, `responsable`, `fecha_programacion`, `estado`, `observaciones`.

---

## 2. Herramienta Matriz de Compatibilidad Química (`matriz_compatibilidad` — Decreto 1496 SGA / NTC 1692)

### Acciones:
- `consultar_contexto_sgsst`, `leer` (`filtro_nombre`, `filtro_ubicacion`, `filtro_clase`), `escribir` (`productos: [...]`), `borrar` (`ids_a_borrar`).

### Clases ONU y Pictogramas SGA:
- **Clases ONU:** `Clase 1` Explosivos, `Clase 2` Gases, `Clase 3` Líquidos Inflamables, `Clase 4` Sólidos Inflamables, `Clase 5` Comburentes/Peróxidos, `Clase 6` Tóxicos/Infecciosos, `Clase 7` Radiactivos, `Clase 8` Corrosivos (Ácidos/Bases), `Clase 9` Peligrosos Varios.
- **Pictogramas SGA válidos:** `["inflamable", "corrosivo", "toxico", "nocivo", "explosivo", "comburente", "gas_presion", "peligro_salud", "medio_ambiente"]`.
- **Reglas Críticas:** Nunca almacenar Ácidos y Bases juntos (Clase 8 vs 8); separar Inflamables (Clase 3) de Comburentes (Clase 5); FDS de 16 secciones obligatoria.

### Estructura de objeto en `productos`:
`nombre`, `fabricante`, `estado_fisico`, `clasificacion_onu`, `pictogramas_sga`, `cantidad_almacenada`, `ubicacion`, `tiene_fds`, `tiene_rotulo`, `incompatibilidades`, `requisitos_almacenamiento`.

---

## 3. Herramienta Gestor de Tareas y Automatizaciones (`gestor_automatizaciones`)

- **Ruta en UI:** `/tareas` (historial en `/tareas?tab=historial`). Acceso exclusivo para Administradores y cuentas Wappy Pro (`canAccessTareas` en `client/src/utils/planAccess.ts` y `api/server/routes/sgsst/automatizaciones.js`).
- **Acciones:** `crear`, `listar`, `actualizar` (`active`/`inactive`), `ejecutar_ahora`, `eliminar`, `ver_logs`.
