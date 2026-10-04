---
name: skill-blog-editor
description: Creación, lectura, edición, listado y eliminación de borradores de artículos del Blog de WAPPY.
scope: all
tools:
  - blog_editor
triggers:
  - blog
  - articulo de blog
  - artículo de blog
  - post de blog
  - borrador de blog
  - redactar articulo
  - redactar artículo
  - publicar articulo
  - publicar en blog
---

# Skill: Editor del Blog de WAPPY (`blog_editor`)

Esta skill instruye a los agentes y a Tenshi para redactar y gestionar borradores de artículos en el Blog corporativo de WAPPY.

## 🎯 Acciones disponibles con `blog_editor`:
1. `accion: "crear"`: Crea un nuevo borrador de artículo con `title`, `content` (HTML enriquecido con h1, h2, h3, p, strong, ul, li), `excerpt`, `tags`, `category` y `coverImage`. Siempre se crea como borrador (`isPublished: false`).
2. `accion: "leer"`: Lee un artículo existente pasando su `id`.
3. `accion: "listar"`: Lista todos los borradores del usuario actual.
4. `accion: "editar"`: Modifica el título, contenido o metadatos de un artículo existente.
5. `accion: "eliminar"`: Elimina un artículo existente por su `id`.
