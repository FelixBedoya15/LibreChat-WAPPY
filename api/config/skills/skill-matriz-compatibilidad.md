---
name: skill-matriz-compatibilidad
description: Gestión de inventario de productos químicos, clasificación ONU, pictogramas SGA y matriz de compatibilidad de almacenamiento.
scope: all
tools:
  - matriz_compatibilidad
triggers:
  - quimico
  - quimicos
  - químico
  - químicos
  - quimica
  - quimicas
  - química
  - químicas
  - sustancia quimica
  - sustancia química
  - sustancias peligrosas
  - reactivos
  - matriz de compatibilidad
  - compatibilidad quimica
  - compatibilidad química
  - incompatible
  - incompatibles
  - incompatibilidad
  - sga
  - pictograma
  - pictogramas
  - fds
  - hoja de seguridad
  - clase onu
  - incompatibilidad quimica
  - incompatibilidad química
  - almacenamiento quimico
  - almacenamiento químico
---

# Skill: Matriz de Compatibilidad Química (`matriz_compatibilidad`)

Esta skill instruye a los agentes y a Tenshi para gestionar el inventario químico y la matriz de compatibilidad de almacenamiento bajo el Sistema Globalmente Armonizado (SGA) y las clases de peligro ONU (1 a 9).

## 🎯 Acciones disponibles con `matriz_compatibilidad`:
1. `accion: "leer"`: Consulta los productos químicos en inventario. Puedes filtrar por `filtro_nombre`, `filtro_ubicacion` o `filtro_clase`.
2. `accion: "escribir"`: Inserta o actualiza sustancias químicas con su fabricante, estado físico, clase ONU, pictogramas SGA, cantidad almacenada, ubicación, FDS y requisitos de almacenamiento.
3. `accion: "borrar"`: Elimina sustancias químicas por su ID (`ids_a_borrar`).
4. `accion: "consultar_contexto_sgsst"`: Consulta áreas y contexto general de la empresa.

## ⚡ Directiva de uso:
- Consulta primero el inventario existente antes de añadir nuevas sustancias.
- Advierte de inmediato si dos sustancias almacenadas en la misma ubicación presentan incompatibilidad severa (ej: ácidos y bases fuertes, o inflamables junto a comburentes/oxidantes).
