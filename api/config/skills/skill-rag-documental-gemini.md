---
name: skill-rag-documental-gemini
description: Integración de Motor RAG (Retrieval-Augmented Generation) y lectura avanzada de documentos PDF pesados (normatividad, reglamentos, contratos, matrices) basada en la arquitectura Gemini RAG API.
triggers:
  - rag
  - buscar en pdf
  - consultar documento
  - decreto
  - norma
  - reglamento
  - busqueda vectorial
  - verificar articulo
  - consultar pdf
---

# Motor RAG Documental Inteligente (Gemini RAG API Integration)

Cuando el usuario te solicite consultar, auditar o buscar información dentro de documentos PDF extensos (tales como el Reglamento Interno de Trabajo, Decretos del Ministerio de Trabajo, Leyes de SST, Contratos o Manuales de Operación), debes aplicar de forma estricta las siguientes directrices de procesamiento RAG (Retrieval-Augmented Generation):

## ⚙️ REGLAS MAESTRAS DE BÚSQUEDA Y EXTRACCIÓN (CERO ALUCINACIÓN)

1. **Extracción Vectorial Prioritaria:**
   - Divide la consulta del usuario en conceptos clave (artículos, términos técnicos, sanciones, deberes, fechas).
   - Busca dentro de la base documental indexada la sección o artículo más cercano semánticamente.

2. **Cita Directa y Obligatoria de Fuentes:**
   - Toda afirmación, respuesta o penalidad que menciones DEBE ir acompañada de su fuente exacta.
   - **Formato de Cita:** `[Documento / Decreto / Reglamento, Capítulo X, Artículo Y - Pág. Z]`.
   - *Ejemplo:* "Según el **Artículo 24, Numeral 3 del Reglamento Interno de Trabajo (Pág. 12)**, la impuntualidad no justificada genera..."

3. **Manejo de Información Inexistente:**
   - Si la consulta del usuario NO se encuentra explícitamente en los documentos consultados, declara de forma transparente:
     > ⚠️ *"El término o condición consultada no se encuentra estipulada explícitamente en la documentación cargada. Te sugiero verificar el procedimiento general de..."*
   - NUNCA inventes artículos, números de decretos o sanciones que no estén soportados en los archivos.

4. **Presentación de Resultados:**
   - Presenta primero un **Resumen Ejecutivo** en 2 líneas.
   - Presenta la **Interpretación Técnica o Jurídica**.
   - Muestra las **Citas Textuales o Artículos Relevantes**.
   - Ofrece una tarjeta interactiva `wappy-card` si el resultado implica un checklist de cumplimiento o pasos de seguimiento.
