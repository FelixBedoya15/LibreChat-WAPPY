const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');
const KanbanTask = require('~/models/KanbanTask');

class GoogleAntigravity extends Tool {
  static lc_name() {
    return 'google_antigravity';
  }

  constructor(fields = {}) {
    super();

    this.userId = fields.userId || fields.req?.user?.id;
    this.req = fields.req;
    this.isAgent = fields.isAgent ?? true;

    this.name = 'google_antigravity';
    this.description =
      'Google Antigravity (Conexión Bidireccional en Tiempo Real con el PC del Usuario): Delega preguntas, consultas, inspección de carpetas locales del computador del usuario, envío de archivos originales del PC al chat, o creación de documentos en el Editor de Documentos de WAPPY (Canvas) y aplicativos HTML en tiempo real a través del Puente Reactivo de Google Antigravity.';

    this.schema = z.object({
      accion: z
        .enum(['delegar_orden', 'consultar_ordenes', 'estado_conexion'])
        .default('delegar_orden')
        .describe(
          'Acción a ejecutar: "delegar_orden" (envía una pregunta, solicitud de archivo o tarea en tiempo real a Google Antigravity en el PC del usuario y espera la respuesta), "consultar_ordenes" (consulta el historial o estado de órdenes enviadas a Antigravity) o "estado_conexion" (verifica si el puente en vivo con el PC del usuario está activo).',
        ),
      instruccion: z
        .string()
        .optional()
        .describe(
          'Instrucción, pregunta o tarea detallada que Google Antigravity debe realizar en el computador del usuario (requerido cuando accion es "delegar_orden").',
        ),
      carpeta_o_recurso: z
        .string()
        .optional()
        .describe(
          'Ruta o nombre opcional de la carpeta local en el computador del usuario o recurso que Antigravity debe inspeccionar (ej: "/Users/usuario/Desktop", "Carpeta SST").',
        ),
      tipo_entregable: z
        .enum(['respuesta', 'copia_archivo', 'documento', 'html', 'excel', 'presentacion'])
        .optional()
        .default('respuesta')
        .describe(
          'Tipo de entregable esperado: "respuesta" (POR DEFECTO para preguntas, consultas o listar carpetas/archivos del PC sin crear documentos), "copia_archivo" (cuando el usuario pide que Antigravity le envíe o suba un archivo, imagen, video o PDF desde su PC al chat), "documento" (cuando pide explícitamente redactar/crear un documento o informe en el Editor de Documentos de WAPPY / Canvas), "html" (cuando pide crear un aplicativo interactivo o dashboard HTML).',
        ),
      titulo: z
        .string()
        .optional()
        .describe('Título descriptivo de la orden o consulta para Antigravity.'),
      archivos: z
        .array(z.string())
        .optional()
        .describe('Lista opcional de rutas o enlaces de archivos de referencia para Antigravity.'),
      estado: z
        .enum(['todas', 'pendientes', 'completadas'])
        .optional()
        .default('todas')
        .describe('Filtro de estado cuando accion es "consultar_ordenes".'),
    });
  }

  returnValue(val) {
    if (this.isAgent && typeof val === 'string') {
      return [val, {}];
    }
    return val;
  }

  async _call(data) {
    const {
      accion = 'delegar_orden',
      instruccion,
      carpeta_o_recurso,
      tipo_entregable = 'respuesta',
      titulo,
      archivos = [],
      estado = 'todas',
    } = data || {};

    try {
      const mcpBridge = require('~/server/routes/mcpBridge');
      const targetUserId =
        this.req?.user?.isSubUser && this.req?.user?.parentUser
          ? this.req.user.parentUser
          : this.userId || this.req?.user?.id;

      if (!targetUserId) {
        return this.returnValue('No se pudo identificar el usuario activo para conectar con Google Antigravity.');
      }

      if (accion === 'estado_conexion') {
        const count = mcpBridge.countAntigravityDaemons
          ? mcpBridge.countAntigravityDaemons(String(targetUserId))
          : mcpBridge.antigravityStreamClients?.get(String(targetUserId))?.size || 0;
        if (count > 0) {
          return this.returnValue(
            `✅ **Conexión con Google Antigravity Activa en Tiempo Real**\nEl puente reactivo Push SSE está conectado con **${count}** sesión(es) activa(s) en el computador del usuario (latencia 0 ms). Puedes delegar cualquier consulta, inspección de carpetas locales, solicitud de archivos o creación de documentos.`,
          );
        }
        return this.returnValue(
          `⚠️ **Puente Reactivo en Espera**\nActualmente no se detecta el demonio local de Google Antigravity conectado en línea para este usuario. Si el usuario ya configuró los 3 pasos en Configuración -> Integraciones -> Antigravity, asegúrate de que su computador esté encendido.`,
        );
      }

      if (accion === 'consultar_ordenes') {
        const query = {
          user: targetUserId,
          type: 'antigravity_delegation',
        };
        if (estado === 'pendientes') {
          query.status = { $in: ['todo', 'in_progress'] };
        } else if (estado === 'completadas') {
          query.status = 'done';
        }

        const tasks = await KanbanTask.find(query).sort({ createdAt: -1 }).limit(10).lean();
        if (!tasks || tasks.length === 0) {
          return this.returnValue('No se encontraron órdenes registradas para Google Antigravity con ese filtro.');
        }

        const rows = tasks.map((t, idx) => {
          const deliv = t.deliverable || {};
          const summary = deliv.resumen || deliv.contenido || '';
          const urlInfo = deliv.urlDescarga ? ` | Archivo: \`${deliv.urlDescarga}\`` : '';
          return `${idx + 1}. **[${t.status === 'done' ? '✅ COMPLETADA' : '⏳ EN PROCESO'}]** ${t.title} (ID: \`${t._id}\`)${urlInfo}${summary ? `\n   - *Resultado:* ${String(summary).slice(0, 400)}` : ''}`;
        });

        return this.returnValue(`### 🚀 Órdenes de Google Antigravity\n\n${rows.join('\n\n')}`);
      }

      if (!instruccion || !String(instruccion).trim()) {
        return this.returnValue(
          'Por favor proporciona la `instruccion` detallada de lo que deseas preguntar o delegar a Google Antigravity.',
        );
      }

      const company = mcpBridge.getActiveCompany ? await mcpBridge.getActiveCompany(targetUserId) : null;
      const companyId = company ? String(company._id) : null;
      const companyName = company?.companyName || 'Empresa Activa';

      const finalFiles = Array.isArray(archivos) ? archivos.filter(Boolean) : [];
      const finalDesc = String(instruccion).trim();
      const finalTitle = titulo || `Orden Antigravity: ${finalDesc.slice(0, 60)}`;
      const finalResource = carpeta_o_recurso || 'Entorno Local del PC / Datos Empresariales WAPPY MCP';
      const finalOutputType = mcpBridge.resolveAntigravityOutputFormat
        ? mcpBridge.resolveAntigravityOutputFormat(tipo_entregable, finalDesc, finalFiles)
        : tipo_entregable || 'respuesta';

      const kanbanTask = await KanbanTask.create({
        user: targetUserId,
        companyId,
        title: finalTitle,
        description: `[DELEGADO POR AGENTE WAPPY A ANTIGRAVITY]\nEmpresa: ${companyName}\nInstrucción: ${finalDesc}\nRecurso Objetivo: ${finalResource}\nFormato Esperado: ${finalOutputType}${finalFiles.length > 0 ? `\nArchivos Adjuntos:\n${finalFiles.map((f) => `- ${f}`).join('\n')}` : ''}`,
        attachments: finalFiles.map((f) => ({
          name: typeof f === 'string' ? f.split('/').pop() : 'archivo',
          url: typeof f === 'string' ? f : '',
        })),
        status: 'todo',
        dueDate: new Date(Date.now() + 2 * 3600 * 1000),
        type: 'antigravity_delegation',
        priority: 'alta',
        sourceModule: 'agent_tool',
      });

      const finalOrdenId = kanbanTask._id.toString();
      const orderPushPayload = {
        id: finalOrdenId,
        ordenId: finalOrdenId,
        titulo: finalTitle,
        instruccion: finalDesc,
        descripcion: kanbanTask.description,
        recursoObjetivo: finalResource,
        formatoEntregable: finalOutputType,
        archivos: finalFiles,
        estado: 'todo',
        prioridad: 'alta',
        empresa: companyName,
        fechaCreacion: kanbanTask.createdAt || new Date().toISOString(),
      };

      const pushedListeners = mcpBridge.broadcastAntigravityEvent
        ? mcpBridge.broadcastAntigravityEvent(targetUserId, 'nueva_orden', orderPushPayload)
        : 0;
      const daemonCount = mcpBridge.countAntigravityDaemons
        ? mcpBridge.countAntigravityDaemons(String(targetUserId))
        : pushedListeners;

      logger.info(
        `[google_antigravity] Orden ${finalOrdenId} emitida por Push SSE a ${pushedListeners} cliente(s) (${daemonCount} computador(es)) para usuario ${targetUserId}.`,
      );

      if (daemonCount === 0) {
        return this.returnValue(
          `⚠️ **Orden Registrada para Google Antigravity (ID: \`${finalOrdenId}\`)**\n\nLa orden **"${finalTitle}"** quedó registrada, pero en este instante no se detectó el puente en vivo activo en el computador del usuario (\`0\` clientes SSE conectados). Tan pronto el computador del usuario esté encendido con el Puente Reactivo activo, Antigravity procesará la orden automáticamente.`,
        );
      }

      // Esperar en tiempo real hasta 85 segundos a que Antigravity complete la orden y devuelva el resultado al chat del agente
      const maxWaitMs = 85000;
      const pollIntervalMs = 1000;
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitMs) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        const updated = await KanbanTask.findById(finalOrdenId).lean();
        if (updated && updated.status === 'dismissed' && updated.deliverable?.formato === 'error') {
          return this.returnValue(
            `${updated.deliverable.resumen || 'Google Antigravity no pudo procesar la orden en el computador del usuario.'}\n\n*(INSTRUCCIÓN AL AGENTE: Informa al usuario de este inconveniente con honestidad y sugiérele abrir Antigravity en su computador y volver a intentarlo.)*`,
          );
        }
        if (updated && updated.status === 'done') {
          const deliv = updated.deliverable || {};
          const fmt = String(deliv.formato || finalOutputType).toLowerCase();
          const media = deliv.media;
          const publicUrl = media?.publicUrl || deliv.urlDescarga;

          if ((fmt === 'copia_archivo' || media) && publicUrl) {
            const fileName = media?.name || updated.title || 'archivo_original';
            const mediaType = media?.type || 'document';
            const summaryText =
              deliv.resumen || `Archivo original "${fileName}" recibido desde Google Antigravity.`;

            if (mediaType === 'image') {
              return this.returnValue(
                `### 📎 Imagen Original Enviada desde tu PC por Google Antigravity\n![${fileName}](${publicUrl})\n\n* **Archivo:** ${fileName}\n* **Resumen:** ${summaryText}\n* **Descargar:** [⬇ Descargar Archivo Original (${fileName})](${publicUrl})\n\n*(INSTRUCCIÓN CRÍTICA AL AGENTE: Incluye en tu respuesta EXACTAMENTE la imagen \`![${fileName}](${publicUrl})\` y el enlace de descarga \`[⬇ Descargar Archivo Original (${fileName})](${publicUrl})\` usando la ruta exacta \`${publicUrl}\`).*`,
              );
            }
            if (mediaType === 'video') {
              return this.returnValue(
                `### 🎬 Video Original Enviado desde tu PC por Google Antigravity\n[🎬 Reproducir Video (${fileName})](${publicUrl})\n\n* **Archivo:** ${fileName}\n* **Resumen:** ${summaryText}\n* **Descargar:** [⬇ Descargar Video (${fileName})](${publicUrl})\n\n*(INSTRUCCIÓN CRÍTICA AL AGENTE: Incluye en tu respuesta el enlace \`[🎬 Reproducir Video (${fileName})](${publicUrl})\` y \`[⬇ Descargar Video (${fileName})](${publicUrl})\`).*`,
              );
            }
            return this.returnValue(
              `### 📎 Archivo Original Enviado desde tu PC por Google Antigravity\n* **Archivo:** \`${fileName}\`\n* **Resumen:** ${summaryText}\n* **Descargar:** [⬇ Descargar Archivo Original (${fileName})](${publicUrl})\n\n*(INSTRUCCIÓN CRÍTICA AL AGENTE: Incluye en tu respuesta el enlace de descarga \`[⬇ Descargar Archivo Original (${fileName})](${publicUrl})\` usando la ruta exacta \`${publicUrl}\`).*`,
            );
          }

          if (fmt === 'documento' || fmt === 'html') {
            const summaryText =
              deliv.resumen ||
              'El entregable ha sido generado y abierto automáticamente en el Editor de Documentos / Canvas de WAPPY.';
            const contentPreview = String(deliv.contenido || '')
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 1800);

            return this.returnValue(
              `### ✨ Entregable Completado por Google Antigravity y Abierto en Canvas\n* **Título:** ${updated.title}\n* **Formato:** \`${fmt.toUpperCase()}\`\n* **Resumen de Antigravity:** ${summaryText}\n${contentPreview ? `\n**Extracto del contenido generado:**\n${contentPreview}` : ''}\n\n*(INSTRUCCIÓN AL AGENTE: Confírmale al usuario que Google Antigravity ya completó el entregable "${updated.title}" y que ya se abrió automáticamente en el panel del Editor de Documentos / Canvas de su pantalla, además de comentarle los puntos clave del resumen).*`,
            );
          }

          const replyContent = deliv.contenido || deliv.resumen || 'Consulta completada por Google Antigravity.';
          return this.returnValue(
            `### ⚡ Respuesta en Tiempo Real de Google Antigravity\n\n${replyContent}\n\n*(INSTRUCCIÓN AL AGENTE: Presenta esta respuesta de Google Antigravity de forma clara, completa y directa al usuario).*`,
          );
        }
      }

      return this.returnValue(
        `🚀 **Orden Enviada en Tiempo Real a Google Antigravity (ID: \`${finalOrdenId}\`)**\n\n* **Tarea:** ${finalTitle}\n* **Estado:** Procesándose en el computador del usuario (${pushedListeners} puente activo).\n\nLa tarea requiere un análisis extenso y continúa ejecutándose en segundo plano en Google Antigravity. Tan pronto finalice, el resultado o documento se inyectará y abrirá automáticamente en la pantalla del usuario vía Push SSE.`,
      );
    } catch (err) {
      logger.error('[google_antigravity] Error en herramienta:', err);
      return this.returnValue(`Error al comunicar con Google Antigravity: ${err.message}`);
    }
  }
}

module.exports = GoogleAntigravity;
