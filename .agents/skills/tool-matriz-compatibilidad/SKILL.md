---
name: tool-matriz-compatibilidad
description: >-
  Expert guide on using the 'matriz_compatibilidad' tool to manage chemical inventories, UN classifications, SGA pictograms, and storage compatibility rules.
---

# Skill: Uso de la Herramienta Matriz de Compatibilidad Química (`matriz_compatibilidad`)

Esta habilidad enseña a los agentes cómo utilizar correctamente la herramienta `matriz_compatibilidad` para gestionar el inventario químico, rotulado SGA y matriz de compatibilidad de almacenamiento bajo el **Decreto 1496 de 2018 (SGA)** y la **Norma Técnica NTC 1692 / Libro Púrpura ONU**.

---

## 1. Esquema de la Herramienta `matriz_compatibilidad`

La herramienta cuenta con 4 acciones principales:
- **`consultar_contexto_sgsst`**: Lee los datos de la empresa y trabajadores con alergias o patologías químicas registradas.
- **`leer`**: Consulta los productos químicos inventariados (permite filtros por `filtro_nombre`, `filtro_ubicacion`, `filtro_clase`).
- **`escribir`**: Registra o actualiza uno o varios productos químicos en lote (`productos: [...]`).
- **`borrar`**: Elimina productos específicos por su ID (`ids_a_borrar: ["id1", "id2"]`).

---

## 2. Clasificación ONU y Pictogramas SGA

### Clases ONU Principales:
- `Clase 1`: Explosivos
- `Clase 2`: Gases (2.1 Inflamables, 2.2 No inflamables / No tóxicos, 2.3 Tóxicos)
- `Clase 3`: Líquidos Inflamables (ej. Gasolina, Thinner, Acetona, Alcohol)
- `Clase 4`: Sólidos Inflamables / Combustión espontánea
- `Clase 5`: Sustancias Comburentes y Peróxidos Orgánicos (ej. Hipoclorito, Agua Oxigenada concentrada)
- `Clase 6`: Sustancias Tóxicas e Infecciosas
- `Clase 7`: Materiales Radiactivos
- `Clase 8`: Sustancias Corrosivas (ej. Ácido Sulfúrico, Ácido Clorhídrico, Soda Cáustica)
- `Clase 9`: Sustancias y Objetos Peligrosos Varios

### Pictogramas SGA Válidos:
`["inflamable", "corrosivo", "toxico", "nocivo", "explosivo", "comburente", "gas_presion", "peligro_salud", "medio_ambiente"]`

---

## 3. Reglas de Incompatibilidad y Almacenamiento

El agente debe aplicar rigurosamente las reglas de la **Matriz Guía de Almacenamiento Químico**:
1. **Ácidos y Bases (Clase 8 vs Clase 8):** Nunca almacenar ácidos y bases juntos sin separación física (reacción exotérmica violenta).
2. **Inflamables (Clase 3) y Comburentes/Oxidantes (Clase 5):** Separación estricta (mínimo dique o gabinete ignífugo con ventilación forzada).
3. **Tóxicos (Clase 6) y Alimentos/Oficinas:** Prohibido compartir espacio.
4. **Fichas de Datos de Seguridad (FDS):** Toda sustancia debe contar con FDS en español de 16 secciones y etiquetado con palabra de advertencia (*PELIGRO* o *ATENCIÓN*), consejos de prudencia y frases H.

---

## 4. Estructura Obligatoria al Escribir Productos Químicos

Al invocar `accion: "escribir"`, cada objeto dentro de `productos` debe seguir este formato:

```json
{
  "nombre": "Ácido Sulfúrico 98%",
  "fabricante": "Químicos Industriales S.A.S.",
  "estado_fisico": "Líquido",
  "clasificacion_onu": "Clase 8: Sustancias Corrosivas",
  "pictogramas_sga": ["corrosivo", "peligro_salud"],
  "cantidad_almacenada": "20 Litros",
  "ubicacion": "Bodega Principal - Gabinete de Corrosivos Ácidos",
  "tiene_fds": "Sí",
  "tiene_rotulo": "Sí",
  "incompatibilidades": "Incompatible con bases fuertes (Soda cáustica), agua directa (reacción violenta), oxidantes y metales.",
  "requisitos_almacenamiento": "Bandeja de contención antiderrame de polietileno (no metálica), ducha de emergencia y lavaojos a menos de 10 metros, kit de neutralización ácida y ventilación continua."
}
```

---

## 5. Flujo Recomendado para el Agente
1. **Consultar Contexto:** Invoca `consultar_contexto_sgsst` para verificar si hay personal con dermatitis o asma ocupacional.
2. **Consultar Inventario Actual:** Ejecuta `leer` para ver qué sustancias ya conviven en la misma bodega o estantería.
3. **Emitir Diagnóstico de Compatibilidad:** Indicar semaforización (🟢 Compatible, 🟡 Precaución / Separación mínima, 🔴 Incompatible / Separación física total).
4. **Guardar en la Matriz:** Invocar `escribir` para persistir el producto en la base de datos de WAPPY.
