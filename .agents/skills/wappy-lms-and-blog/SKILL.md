---
name: wappy-lms-and-blog
description: >-
  Diseño instruccional, creación de cursos interactivos para el LMS de WAPPY (`Course` schema, lecciones, quizzes, `seed-lms.js`) y redacción de artículos SEO/AEO de alto impacto para el Blog de WAPPY.
---

# Creación de Cursos LMS & Artículos SEO/AEO del Blog WAPPY

---

## 1. Creación de Cursos Interactivos LMS (`seed-lms.js`)

### Esquema del Modelo `Course` (MongoDB):
- `title`: Título profesional del curso.
- `description`: Resumen con público objetivo y objetivos de aprendizaje.
- `thumbnail`: URL de imagen o ruta en `Agentes/Miniaturas/Cursos/`.
- `tags`: Ej. `['SST', 'Alturas', 'Formativo']` o `['IA', 'Gemini', 'Productividad']`.
- `isPublished`: `true` / `false`.
- `lessons`: Array de lecciones con `title`, `content` (Markdown rico con casos prácticos y referencias normativas), `videoUrl` (opcional) y `order` (`1, 2, 3...`).
- `quiz`: Array opcional de preguntas de evaluación con opciones, respuesta correcta y retroalimentación.

### Verificación:
Comprobar sintaxis con `node -c seed-lms.js` y ejecutar `node seed-lms.js`.

---

## 2. Publicación de Artículos en el Blog WAPPY (SEO + AEO)

### Estructura Obligatoria del Artículo:
1. **Título Atractivo con Keyword:** Ej. *"Guía Práctica: Cómo Auditar la Matriz IPVER con Inteligencia Artificial"*.
2. **Bloque de Respuesta Directa (AEO Hook):** Párrafo inicial de 2–3 oraciones que responde directamente la pregunta principal (optimizado para citas en Perplexity, ChatGPT Search y Google AI Overviews).
3. **Cuerpo Estructurado (H2 / H3):** Pasos prácticos, tablas comparativas, citas normativas (Decreto 1072, Res. 0312, GTC-45) y bloques de alerta.
4. **Diagrama Visual / Infografía:** Diagrama Mermaid o prompt 16:9 para portada con identidad WAPPY.
5. **Call to Action (CTA) + Repurposing:** Invitación a probar los agentes de WAPPY + resumen para carrusel de LinkedIn (5–7 slides) y mensaje corto de difusión para WhatsApp.
