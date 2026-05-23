const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { BlogPost } = require('~/models/BlogPost');

/**
 * BlogEditor Tool
 * Permite al agente crear, leer, listar, editar o eliminar borradores de artículos de blog.
 * Todos los artículos creados se guardan en estado de borrador (isPublished = false)
 * para que el usuario pueda revisarlos en el panel administrativo antes de publicarlos.
 */
class BlogEditor extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'blog_editor';
    this.description =
      'Crea, edita, lee, lista o elimina borradores de artículos del blog corporativo en la base de datos. Los artículos nuevos siempre se guardan como borradores (isPublished = false) para revisión humana. El contenido debe redactarse en formato HTML enriquecido y profesional (usando h1, h2, h3, p, strong, ul, ol, li, tablas, etc.) sin bloques de código markdown.';
    this.req = fields.req;

    this.schema = z.object({
      accion: z
        .enum(['crear', 'leer', 'listar', 'editar', 'eliminar'])
        .describe(
          'Acción a realizar: "crear" un nuevo borrador, "leer" un artículo por ID, "listar" los borradores del usuario actual, "editar" un borrador existente, o "eliminar" un artículo.',
        ),

      // Requeridos para accion="crear" / "editar"
      title: z
        .string()
        .optional()
        .describe('Título del artículo. Obligatorio al crear un nuevo artículo.'),

      description: z
        .string()
        .optional()
        .describe('Breve descripción, subtítulo o resumen introductorio del artículo.'),

      content: z
        .string()
        .optional()
        .describe(
          'Contenido completo del artículo estructurado con etiquetas HTML (<h1>, <h2>, <h3>, <p>, <strong>, <ul>, <li>, etc.). NO uses bloques de código markdown como ```html. Obligatorio al crear.',
        ),

      tags: z
        .array(z.string())
        .optional()
        .describe('Listado de etiquetas relevantes para organizar el artículo (ej: ["SST", "Normatividad", "Emergencias"]).'),

      // Requerido para accion="leer", "editar" o "eliminar"
      postId: z
        .string()
        .optional()
        .describe('ID de la base de datos (ObjectId) del artículo a leer, editar o eliminar.'),
    });
  }

  async _call(input, runManager) {
    try {
      const userId = this.req?.user?.id || this.req?.user?._id;
      if (!userId) {
        return JSON.stringify({
          error: 'Acceso denegado: No se detectó una sesión de usuario activa en la petición de la herramienta.',
        });
      }

      const { accion, title, description, content, tags, postId } = input;

      // ── CREAR ARTÍCULO ──────────────────────────────────────────────────────
      if (accion === 'crear') {
        if (!title) {
          return JSON.stringify({ error: 'El campo "title" es obligatorio para la acción "crear".' });
        }
        if (!content) {
          return JSON.stringify({ error: 'El campo "content" es obligatorio para la acción "crear".' });
        }

        const newPost = new BlogPost({
          title,
          description: description || '',
          content,
          tags: tags || [],
          isPublished: false, // Forzar a borrador para revisión e imagen
          isFeatured: false,
          author: userId,
        });

        await newPost.save();

        return JSON.stringify({
          success: true,
          mensaje: 'Borrador de artículo de blog creado exitosamente en la base de datos.',
          postId: newPost._id,
          title: newPost.title,
          isPublished: newPost.isPublished,
          author: userId,
          url_admin_review: `/blog/admin`,
        });
      }

      // ── LEER ARTÍCULO POR ID ────────────────────────────────────────────────
      if (accion === 'leer') {
        if (!postId) {
          return JSON.stringify({ error: 'El campo "postId" es obligatorio para la acción "leer".' });
        }

        const post = await BlogPost.findById(postId)
          .populate('author', 'name username')
          .lean();

        if (!post) {
          return JSON.stringify({ error: `No se encontró ningún artículo de blog con el ID: ${postId}` });
        }

        return JSON.stringify({
          success: true,
          post,
        });
      }

      // ── LISTAR ARTÍCULOS (Borradores y Publicados del Usuario) ───────────────
      if (accion === 'listar') {
        const posts = await BlogPost.find({ author: userId })
          .sort({ createdAt: -1 })
          .select('title description tags isPublished createdAt')
          .lean();

        return JSON.stringify({
          success: true,
          total: posts.length,
          posts,
        });
      }

      // ── EDITAR ARTÍCULO ─────────────────────────────────────────────────────
      if (accion === 'editar') {
        if (!postId) {
          return JSON.stringify({ error: 'El campo "postId" es obligatorio para la acción "editar".' });
        }

        // Buscar primero el artículo para validar autoría o existencia
        const post = await BlogPost.findById(postId);
        if (!post) {
          return JSON.stringify({ error: `No se encontró ningún artículo con el ID: ${postId}` });
        }

        // Validar que sea el creador o que tenga permisos (los admins tienen acceso total)
        const isAuthor = post.author.toString() === userId.toString();
        const isAdmin = this.req?.user?.role === 'ADMIN';
        if (!isAuthor && !isAdmin) {
          return JSON.stringify({
            error: 'No tienes permisos para editar este artículo porque fue creado por otro usuario.',
          });
        }

        const updates = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (content !== undefined) updates.content = content;
        if (tags !== undefined) updates.tags = tags;

        const updatedPost = await BlogPost.findByIdAndUpdate(
          postId,
          { $set: updates },
          { new: true, runValidators: true },
        ).lean();

        return JSON.stringify({
          success: true,
          mensaje: 'Borrador de artículo de blog actualizado correctamente.',
          post: {
            postId: updatedPost._id,
            title: updatedPost.title,
          },
        });
      }

      // ── ELIMINAR ARTÍCULO ───────────────────────────────────────────────────
      if (accion === 'eliminar') {
        if (!postId) {
          return JSON.stringify({ error: 'El campo "postId" es obligatorio para la acción "eliminar".' });
        }

        const post = await BlogPost.findById(postId);
        if (!post) {
          return JSON.stringify({ error: `No se encontró ningún artículo con el ID: ${postId}` });
        }

        const isAuthor = post.author.toString() === userId.toString();
        const isAdmin = this.req?.user?.role === 'ADMIN';
        if (!isAuthor && !isAdmin) {
          return JSON.stringify({
            error: 'No tienes permisos para eliminar este artículo porque fue creado por otro usuario.',
          });
        }

        await BlogPost.findByIdAndDelete(postId);

        return JSON.stringify({
          success: true,
          mensaje: `Artículo de blog "${post.title}" eliminado con éxito de la base de datos.`,
        });
      }

      return JSON.stringify({ error: `Acción desconocida: "${accion}".` });
    } catch (error) {
      console.error('[BlogEditor Tool] Error crítico:', error);
      return JSON.stringify({
        error: 'Ocurrió un error inesperado al procesar la acción del Gestor de Blog.',
        details: error.message,
      });
    }
  }
}

module.exports = BlogEditor;
