---
name: wappy-copiloto-sgsst-mcp
description: "Opera el Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) de la empresa en WAPPY IA mediante las 130+ herramientas del servidor MCP 'wappy' (trabajadores, Perfil Sociodemográfico, Matriz GTC 45 IPEVR, Matriz PESV, Inventario y Compatibilidad Química SGA, Diagnóstico Res. 0312, Matriz Legal, COPASST/CCL, ATEL, Cronograma ACPM, ATS/Permisos de Alturas, OWAS, Cursos LMS, Automatizaciones y Documentos en Vivo LiveEditor) y audita/repara la conexión local. Activa esta skill siempre que el usuario pida consultar, auditar, registrar, analizar o documentar cualquier módulo SG-SST de su empresa en WAPPY IA o diagnosticar la conexión del puente."
---

# Copiloto Maestro SG-SST & Diagnóstico MCP Multi-Empresa (`wappy-copiloto-sgsst-mcp`)

## Overview

Esta skill entrena a la instancia de Google Antigravity para operar con **precisión normativa colombiana y aislamiento multi-empresa estricto** todas las herramientas MCP del servidor `wappy` (`Somos SST`, Hitos 1 al 8, LMS, Flujos `/tareas` y `LiveEditor`), incluyendo una herramienta CLI de autodiagnóstico y autorreparación en 1 comando.

---

## When to Use

Activa esta skill ante cualquier solicitud relacionada con:
- Consultar o gestionar datos de una empresa en WAPPY IA: **Trabajadores y Perfil Sociodemográfico**, **Matriz de Peligros GTC 45 (IPEVR)**, **Matriz Vial PESV**, **Inventario Químico y Matriz de Compatibilidad SGA**, **Autoevaluación de Estándares Mínimos (Res. 0312 de 2019)**, **Matriz Legal**, **COPASST / Comité de Convivencia**, **Casos e Indicadores ATEL**, **Cronograma / Planes de Acción ACPM**, **Perfiles de Cargo**, **Estudios de Puesto y OWAS**, **ATS y Permisos de Alturas**, **Vulnerabilidad**, **Contexto DOFA** o **Revisión por la Alta Dirección**.
- Construir informes ejecutivos, actas, procedimientos o matrices exportables a Word/PDF en **`LiveEditor`** (`wappy_guardar_documento_vivo` o entregables de Tenshi).
- Auditar, sincronizar o reparar el puente MCP, el daemon reactivo SSE o el paquete de Skills de WAPPY IA (`scripts/diagnostico-wappy.js`).

---

## Protocolo Operativo de 5 Reglas de Oro en SG-SST

### 1. Paso 0 Obligatorio: Verificación de Empresa Activa (`companyId`)
WAPPY IA es una plataforma **multitenant multi-empresa** (consultores SST suelen administrar decenas de empresas simultáneamente).
- **Antes de leer o escribir cualquier registro:** Invoca `wappy_consultar_perfil_empresa` para confirmar sobre qué razón social, NIT, clase de riesgo ARL (I a V) y número de trabajadores estás operando.
- **Si el usuario menciona otra empresa específica por nombre o NIT:** Invoca `wappy_consultar_empresas`, localiza su `companyId` exacto y actívala con `wappy_activar_empresa` (o pásale explícitamente `companyId` a la herramienta si lo soporta) antes de continuar.
- **Prohibición Absoluta:** Jamás mezcles trabajadores, matrices GTC 45/PESV ni documentos entre empresas distintas.

### 2. Lectura Panorámica Inteligente (Menos Llamadas, Más Contexto)
- Cuando necesites entender el estado global del SG-SST de la empresa, llama primero a **`wappy_resumen_general_360`** y/o **`wappy_obtener_briefing_ejecutivo`**.
- Luego profundiza únicamente en los módulos pertinentes (ej. `wappy_consultar_matriz_gtc45`, `wappy_consultar_diagnostico_0312`, `wappy_consultar_trabajadores`).
- Recuerda que en herramientas `lazy` del servidor MCP `wappy`, debes leer primero el esquema JSON de la herramienta o invocarla vía `call_mcp_tool` con `ServerName: "wappy"` respetando los nombres exactos de sus argumentos.

### 3. Coherencia Normativa Colombiana (Clasificación según Res. 0312 de 2019)
Adapta siempre tus recomendaciones, planes anuales y matrices al tamaño y clase de riesgo reales de la empresa activa:
- **≤ 10 trabajadores (Riesgo I, II o III):** 7 Estándares Mínimos (Capítulo I, Res. 0312/2019).
- **11 a 50 trabajadores (Riesgo I, II o III):** 21 Estándares Mínimos (Capítulo II, Res. 0312/2019).
- **> 50 trabajadores (cualquier riesgo) o ≤ 50 trabajadores en Riesgo IV o V:** **60 Estándares Mínimos** completos (Capítulo III, Res. 0312/2019) + Decreto 1072 de 2015 Libro 2, Parte 2, Título 4, Capítulo 6.

### 4. Cruzamiento Técnico Real entre Módulos (Cero Datos Inventados)
- **Alturas / Tareas Críticas:** Antes de guardar un Permiso de Alturas (`wappy_guardar_permiso_alturas`) o ATS (`wappy_guardar_ats`), verifica el trabajador en `wappy_consultar_trabajadores`, equipos certificados en `wappy_consultar_equipos_alturas` y, si te piden validar su curso en vivo, combina con la skill `wappy-portales-colombia-sst` (`--portal=alturas`).
- **Químicos SGA:** Cruza cada sustancia de `wappy_consultar_inventario_quimico` con `wappy_consultar_pubchem_quimico` y guarda su matriz en `wappy_guardar_compatibilidad_quimica` bajo el Decreto 1496 de 2018 (SGA ONU).
- **PESV:** Cruza conductores (`wappy_consultar_trabajadores`), parque automotor (`wappy_consultar_vehiculos`), riesgos viales (`wappy_consultar_matriz_pesv`) y consulta SIMIT (`wappy-portales-colombia-sst --portal=simit`).

### 5. Estándar de Tablas para `LiveEditor` (Exportación Impecable `html-docx` / PDF)
Cuando guardes un documento en `wappy_guardar_documento_vivo` o entregues un informe `formato: "documento"`:
- Escribe en **Markdown limpio** (`##`, `###`, negritas y tablas `| Col 1 | Col 2 | Col 3 |`).
- **NO** incluyas etiquetas `<!DOCTYPE html>`, `<html>` ni `<body>` (WAPPY inyecta automáticamente el cabezote corporativo oficial con logo, NIT, código documental y firmas digitales).
- Dentro de celdas de tablas Markdown, evita saltos de línea reales o listas `<ul>` crudas; separa múltiples controles dentro de una misma celda usando `• ` o `<br>` para que Word (`html-docx`) renderice bordes y columnas sin desbordamientos.

---

## Autodiagnóstico, Sincronización y Autorreparación CLI (`scripts/diagnostico-wappy.js`)

Si notas que las herramientas MCP `wappy` no responden, el puente SSE aparece desconectado o el usuario pide verificar/actualizar su conexión WAPPY <-> Antigravity, ejecuta inmediatamente:

```bash
# 1. Ver estado completo Local + Cloud + MCP + Skills + OSINT Engine
node ~/.gemini/antigravity/skills/wappy-copiloto-sgsst-mcp/scripts/diagnostico-wappy.js --status

# 2. Re-sincronizar todas las Skills Oficiales, Subagentes de Studio y Motor de Portales
node ~/.gemini/antigravity/skills/wappy-copiloto-sgsst-mcp/scripts/diagnostico-wappy.js --sync-skills

# 3. Reparar mcp_config.json, actualizar daemon v2.7.0+, re-sincronizar Skills y reiniciar puente
node ~/.gemini/antigravity/skills/wappy-copiloto-sgsst-mcp/scripts/diagnostico-wappy.js --repair
```

*(Añade `--json` cuando necesites parsear el diagnóstico programáticamente).*

---

## Routing Table (Progressive Disclosure)

- Para consultar el **catálogo exacto de las 130+ herramientas MCP `wappy_*`** clasificadas por los 8 Hitos SG-SST y la tabla maestra de legislación colombiana vigente (Decreto 1072/2015, Res. 0312/2019, GTC 45, Res. 4272/2021, Res. 20223040040595, Decreto 1496/2018, Res. 2764/2022, Res. 1401/2007), lee `references/mapa-herramientas-mcp-y-normativa.md`.
