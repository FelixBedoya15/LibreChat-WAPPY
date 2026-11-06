---
name: wappy-lms-and-blog
description: "Diseño instruccional de cursos interactivos para el LMS de WAPPY (Course schema, lecciones, quizzes, seed-lms.js) y redacción de artículos SEO/AEO para el Blog."
category: frontend-and-design
bundle: wappy-ui-and-content
risk: safe
source: self
source_type: self
date_added: "2026-10-28"
author: wappy-ia
agents: [wappy-frontend-ui, wappy-backend-api]
tags: [lms, courses, blog, seo, aeo, education, sgsst]
---

# Creación de Cursos LMS & Artículos SEO/AEO del Blog WAPPY (`wappy-lms-and-blog`)

## Overview

Guía para estructurar e insertar cursos interactivos en el LMS de **LibreChat-WAPPY** (`Course` schema y `seed-lms.js`), así como redactar artículos técnicos optimizados para motores de búsqueda tradicionales (**SEO**) y motores de respuesta de IA (**AEO**).

## When to Use

- **Usar cuando** el usuario pida crear, actualizar o poblar un curso en la Academia/LMS de WAPPY (`wappy_crear_curso_lms`, `seed-lms.js`), o redactar y publicar un artículo para el Blog de WAPPY (`wappy_crear_articulo_blog`).

## Prerequisites

- Esquema Mongoose `Course` / herramientas MCP `wappy_consultar_cursos_lms`, `wappy_crear_curso_lms`, `wappy_consultar_blog`, `wappy_crear_articulo_blog`.
- Acceso a `seed-lms.js` cuando se trate de carga por script en servidor.

---

## How It Works

### 1. Creación de Cursos Interactivos LMS (`seed-lms.js`)

#### Esquema del Modelo `Course` (MongoDB):
- `title`: Título profesional del curso.
- `description`: Resumen con público objetivo y objetivos de aprendizaje.
- `thumbnail`: URL de imagen o ruta en `Agentes/Miniaturas/Cursos/`.
- `tags`: Ej. `['SST', 'Alturas', 'Formativo']` o `['IA', 'Gemini', 'Productividad']`.
- `isPublished`: `true` / `false`.
- `lessons`: Array de lecciones con `title`, `content` (Markdown rico con casos prácticos y referencias normativas), `videoUrl` (opcional) y `order` (`1, 2, 3...`).
- `quiz`: Array opcional de preguntas de evaluación con opciones, respuesta correcta y retroalimentación.

---

### 2. Publicación de Artículos en el Blog WAPPY (SEO + AEO)

#### Estructura Obligatoria del Artículo:
1. **Título Atractivo con Keyword:** Ej. *"Guía Práctica: Cómo Auditar la Matriz IPVER con Inteligencia Artificial"*.
2. **Bloque de Respuesta Directa (AEO Hook):** Párrafo inicial de 2–3 oraciones que responde directamente la pregunta principal (optimizado para citas en Perplexity, ChatGPT Search y Google AI Overviews).
3. **Cuerpo Estructurado (H2 / H3):** Pasos prácticos, tablas comparativas, citas normativas (Decreto 1072, Res. 0312, GTC-45) y bloques de alerta.
4. **Diagrama Visual / Infografía:** Diagrama Mermaid o prompt 16:9 para portada con identidad WAPPY.
5. **Call to Action (CTA) + Repurposing:** Invitación a probar los agentes de WAPPY + resumen para carrusel de LinkedIn (5–7 slides) y mensaje corto de difusión para WhatsApp.

---

## Verification

- Para scripts LMS: comprobar sintaxis con `node -c seed-lms.js` antes de ejecutar `node seed-lms.js`.
- Para artículos de blog: verificar que incluya el bloque AEO inicial y referencias normativas vigentes.

## Safety and Side Effects

- **Risk level:** `safe` — La ejecución de `seed-lms.js` o las herramientas MCP `wappy_crear_curso_lms` / `wappy_crear_articulo_blog` insertan registros de contenido en MongoDB.

## Sources and Related Skills

- [`wappy-ui-design-system`](../wappy-ui-design-system/SKILL.md)
- [`wappy-sgsst-tools`](../wappy-sgsst-tools/SKILL.md)
